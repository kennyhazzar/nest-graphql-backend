import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { OAuthLinkProviderCommand } from '../commands/oauth-link-provider.command';
import { OAuthProviderFactory } from '../../infrastructure/factories/oauth-provider.factory';
import { IdentityRepository } from '@/modules/users/domain/repositories/identity.repository';
import { Identity } from '@/modules/users/domain/entities/identity.entity';
import { MailService } from '@/modules/mail/infrastructure/services/mail.service';
import { MailRepository } from '@/modules/mail/domain/repositories/mail.repository';
import { Mail, MailTemplateType } from '@/modules/mail/domain';
import { UserRepository } from '@/modules/users/domain/repositories/user.repository';

/**
 * Handler for linking OAuth provider to existing user
 */
@CommandHandler(OAuthLinkProviderCommand)
export class OAuthLinkProviderHandler implements ICommandHandler<OAuthLinkProviderCommand> {
  private readonly logger = new Logger(OAuthLinkProviderHandler.name);

  constructor(
    private readonly oauthProviderFactory: OAuthProviderFactory,
    private readonly identityRepository: IdentityRepository,
    private readonly userRepository: UserRepository,
    private readonly mailRepository: MailRepository,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: OAuthLinkProviderCommand): Promise<Identity> {
    const { userId, provider, code, redirectUri } = command;

    this.logger.log(`Linking OAuth provider ${provider} to user: ${userId}`);

    // Check if provider already linked
    const existing = await this.identityRepository.findByUserIdAndProvider(userId, provider);
    if (existing) {
      throw new ConflictException(`${provider} is already linked to this account`);
    }

    // Get OAuth provider adapter
    const oauthProvider = this.oauthProviderFactory.createProvider(provider);

    // Exchange code for tokens
    const tokens = await oauthProvider.exchangeCodeForToken(code, redirectUri);

    // Get user info
    const userInfo = await oauthProvider.getUserInfo(tokens.accessToken);

    // Check if this OAuth account is already linked to another user
    const existingIdentity = await this.identityRepository.findByProviderUserId(provider, userInfo.id);
    if (existingIdentity) {
      throw new ConflictException('This OAuth account is already linked to another user');
    }

    // Create identity
    const identityData = Identity.create({
      userId,
      providerType: provider,
      providerUserId: userInfo.id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : undefined,
      providerEmail: userInfo.email,
      avatarUrl: userInfo.avatar,
      metadata: userInfo.metadata,
    });

    const identity = await this.identityRepository.create(identityData);

    // Send notification email
    const user = await this.userRepository.findById(userId);
    if (user) {
      const mail = Mail.create({
        to: user.email,
        subject: 'OAuth Provider Linked',
        template: MailTemplateType.OAUTH_ACCOUNT_LINKED,
        context: {
          userName: user.name,
          providerName: provider === 'google' ? 'Google' : 'Yandex',
          providerEmail: userInfo.email,
          linkedAt: new Date().toISOString(),
          accountSettingsUrl: `${this.configService.get('app.frontendUrl')}/settings/security`,
        },
      });

      const savedMail = await this.mailRepository.create(mail);
      await this.mailService.addToQueue(savedMail);
    }

    this.logger.log(`OAuth provider ${provider} linked successfully to user: ${userId}`);

    return identity;
  }
}
