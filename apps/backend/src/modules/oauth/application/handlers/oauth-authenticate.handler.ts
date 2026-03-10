import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyRequest } from 'fastify';

import { OAuthAuthenticateCommand, OAuthAuthResponse } from '../commands/oauth-authenticate.command';
import { OAuthProviderFactory } from '../../infrastructure/factories/oauth-provider.factory';
import { IdentityRepository } from '@/modules/users/domain/repositories/identity.repository';
import { UserRepository } from '@/modules/users/domain/repositories/user.repository';
import { MailRepository } from '@/modules/mail/domain/repositories/mail.repository';
import { AuthServiceAdapter } from '@/modules/users/infrastructure/adapters/auth-service.adapter';
import { Identity } from '@/modules/users/domain/entities/identity.entity';
import { MailService } from '@/modules/mail/infrastructure/services/mail.service';
import { Mail, MailTemplateType } from '@/modules/mail/domain';
import { User } from '@/modules/users/domain/entities';

/**
 * Handler for OAuth authentication
 * Exchanges OAuth code for tokens, creates/links user account
 */
@CommandHandler(OAuthAuthenticateCommand)
export class OAuthAuthenticateHandler implements ICommandHandler<OAuthAuthenticateCommand> {
  private readonly logger = new Logger(OAuthAuthenticateHandler.name);

  constructor(
    private readonly oauthProviderFactory: OAuthProviderFactory,
    private readonly identityRepository: IdentityRepository,
    private readonly userRepository: UserRepository,
    private readonly mailRepository: MailRepository,
    private readonly authService: AuthServiceAdapter,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: OAuthAuthenticateCommand): Promise<OAuthAuthResponse> {
    const { provider, code, state, redirectUri } = command;

    this.logger.log(`OAuth authentication attempt with provider: ${provider}`);

    // TODO: Validate state token (CSRF protection with Redis)
    // For now, we'll skip state validation in the template

    // Get OAuth provider adapter
    const oauthProvider = this.oauthProviderFactory.createProvider(provider);

    // Exchange authorization code for tokens
    const tokens = await oauthProvider.exchangeCodeForToken(code, redirectUri);

    // Get user info from provider
    const userInfo = await oauthProvider.getUserInfo(tokens.accessToken);

    this.logger.log(`OAuth user info received: ${userInfo.email}`);

    // Check if identity already exists
    let identity = await this.identityRepository.findByProviderUserId(provider, userInfo.id);

    let user: User;
    let isNewUser = false;

    if (identity) {
      // Identity exists - get the user
      const foundUser = await this.userRepository.findById(identity.userId);
      if (!foundUser) {
        throw new NotFoundException('user.auth.oauth.userNotFound');
      }
      user = foundUser;

      // Update tokens in identity
      await this.identityRepository.update(identity.id, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : undefined,
        providerEmail: userInfo.email,
        avatarUrl: userInfo.avatar,
        metadata: userInfo.metadata,
      });

      this.logger.log(`Existing user authenticated via OAuth: ${user.email}`);
    } else {
      // Identity doesn't exist - check if user with email exists
      const existingUser = await this.userRepository.findByEmail(userInfo.email);

      if (existingUser) {
        // User exists - link OAuth to existing account
        user = existingUser;
        this.logger.log(`Linking OAuth provider to existing user: ${user.email}`);
      } else {
        // New user - create account
        isNewUser = true;

        // Parse name from OAuth
        const nameParts = (userInfo.name || userInfo.email.split('@')[0]).split(' ');
        const name = nameParts[0] || 'User';
        const surname = nameParts[1] || '';

        // Get default role
        const defaultRoleId = this.configService.get<string>('defaultRole.id');
        if (!defaultRoleId) {
          throw new Error('Default role ID not configured');
        }

        // Create new user (password is nullable for OAuth-only users)
        const newUser = User.create({
          email: userInfo.email,
          name,
          surname,
          verified: true, // OAuth emails are pre-verified
          roleId: defaultRoleId,
          language: this.configService.get('settings.language', 'en'),
          locale: this.configService.get('settings.locale', 'en-US'),
          country: this.configService.get('settings.country', 'US'),
          forgotConfirmKey: null,
          emailConfirmKey: null,
          gender: undefined as any,
          blocked: false,
          theme: undefined as any,
        });
        user = await this.userRepository.create(newUser);

        this.logger.log(`New user created via OAuth: ${user.email}`);
      }

      // Create identity record
      const identityData = Identity.create({
        userId: user.id,
        providerType: provider,
        providerUserId: userInfo.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : undefined,
        providerEmail: userInfo.email,
        avatarUrl: userInfo.avatar,
        metadata: userInfo.metadata,
      });

      await this.identityRepository.create(identityData);

      // Send welcome email for new users
      if (isNewUser) {
        const mail = Mail.create({
          to: user.email,
          subject: 'Welcome!',
          template: MailTemplateType.OAUTH_FIRST_LOGIN,
          context: {
            appName: this.configService.get('app.name', 'Application'),
            userName: user.name,
            providerName: provider === 'google' ? 'Google' : 'Yandex',
            email: user.email,
            dashboardUrl: `${this.configService.get('app.frontendUrl', 'http://localhost:3000')}/dashboard`,
          },
        });

        const savedMail = await this.mailRepository.create(mail);
        await this.mailService.addToQueue(savedMail);
      }
    }

    // Generate JWT tokens
    const accessToken = await this.authService.generateAccessToken({
      userId: user.id,
      roleId: user.roleId,
      roleType: user.role!.type,
      language: user.language,
    });
    const refreshToken = await this.authService.generateRefreshToken(user, { ip: '0.0.0.0' } as FastifyRequest);
    const csrfToken = this.authService.generateCsrfToken();

    this.logger.log(`OAuth authentication successful for user: ${user.email}`);

    return {
      accessToken,
      refreshToken,
      csrfToken,
      user,
      isNewUser,
    };
  }
}
