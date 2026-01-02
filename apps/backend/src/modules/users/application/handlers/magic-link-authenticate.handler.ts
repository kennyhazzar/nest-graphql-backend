import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { MagicLinkAuthenticateCommand } from '../commands/magic-link-authenticate.command';
import { MagicLinkTokenRepository } from '../../domain/repositories/magic-link-token.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { AuthServiceAdapter } from '../../infrastructure/adapters/auth-service.adapter';
import { AuthResponseDto } from '../../presentation/dtos/auth.dto';

/**
 * Handler for authenticating with a magic link token
 * Validates the token and generates JWT tokens
 */
@CommandHandler(MagicLinkAuthenticateCommand)
export class MagicLinkAuthenticateHandler implements ICommandHandler<MagicLinkAuthenticateCommand> {
  private readonly logger = new Logger(MagicLinkAuthenticateHandler.name);

  constructor(
    private readonly magicLinkTokenRepository: MagicLinkTokenRepository,
    private readonly userRepository: UserRepository,
    private readonly authService: AuthServiceAdapter,
  ) {}

  async execute(command: MagicLinkAuthenticateCommand): Promise<AuthResponseDto> {
    const { token, fingerprint } = command;

    this.logger.log(`Magic link authentication attempt with token: ${token.substring(0, 8)}...`);

    // Find token in database
    const magicLinkToken = await this.magicLinkTokenRepository.findByToken(token);

    if (!magicLinkToken) {
      this.logger.warn(`Invalid magic link token: ${token.substring(0, 8)}...`);
      throw new NotFoundException('user.auth.magicLink.invalidOrExpired');
    }

    // Validate token
    if (!magicLinkToken.isValid()) {
      this.logger.warn(`Magic link token is not valid (used or expired): ${token.substring(0, 8)}...`);
      throw new ForbiddenException('user.auth.magicLink.expiredOrUsed');
    }

    // Validate fingerprint (security check)
    if (!magicLinkToken.matchesFingerprint(fingerprint)) {
      this.logger.warn(
        `Fingerprint mismatch for magic link token: ${token.substring(0, 8)}... (expected: ${magicLinkToken.fingerprint}, got: ${fingerprint})`,
      );
      throw new ForbiddenException('user.auth.magicLink.invalidOrigin');
    }

    // Find user by email
    const user = await this.userRepository.findByEmail(magicLinkToken.email);

    if (!user) {
      this.logger.warn(`User not found for email: ${magicLinkToken.email}`);
      throw new NotFoundException('user.auth.magicLink.userNotFound');
    }

    // Mark token as used
    await this.magicLinkTokenRepository.markAsUsed(magicLinkToken.id);

    // Generate JWT tokens
    const accessToken = await this.authService.generateAccessToken({
      userId: user.id,
      roleId: user.roleId,
      roleType: user.role.type,
      language: user.language,
    });
    const refreshToken = await this.authService.generateRefreshToken(user, { ip: fingerprint } as FastifyRequest);
    const csrfToken = this.authService.generateCsrfToken();

    this.logger.log(`User authenticated successfully via magic link: ${user.email}`);

    return {
      accessToken,
      refreshToken,
      csrfToken,
      user,
    };
  }
}
