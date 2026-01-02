import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthServiceAdapter } from '../../infrastructure/adapters';
import { UserRepository } from '../../domain/repositories/user.repository';
import { RefreshTokensCommand } from '../commands/refresh-tokens.command';
import { RefreshEntity } from '../../infrastructure/entity/refresh.entity';

@CommandHandler(RefreshTokensCommand)
export class RefreshTokensHandler implements ICommandHandler<RefreshTokensCommand> {
  private readonly logger = new Logger(RefreshTokensHandler.name);

  constructor(
    private readonly authService: AuthServiceAdapter,
    private readonly userRepository: UserRepository,
    @InjectRepository(RefreshEntity)
    private readonly refreshTokenRepository: Repository<RefreshEntity>,
  ) {}

  async execute(command: RefreshTokensCommand): Promise<{
    accessToken: string;
    refreshToken: string;
    csrfToken: string;
  }> {
    // Validate refresh token JWT
    const credentials = await this.authService.validateJwt(
      command.refreshToken,
      (this.authService as any).refreshToken, // Private field access
    );

    if (!credentials) {
      this.logger.warn('Invalid refresh token provided');
      throw new UnauthorizedException('user.auth.invalidJwtPayload');
    }

    // Check if token exists in database and is not revoked
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { refreshToken: command.refreshToken },
    });

    if (!tokenRecord) {
      this.logger.warn(`Refresh token not found in database for user ${credentials.userId}`);
      throw new UnauthorizedException('user.auth.tokenNotFound');
    }

    if (tokenRecord.isRevoked) {
      this.logger.warn(
        `Attempted reuse of revoked refresh token for user ${credentials.userId}. Possible token theft!`,
      );
      // TODO: Consider revoking ALL user tokens here for security
      throw new ForbiddenException('user.auth.tokenRevoked');
    }

    // Check token expiration
    if (new Date() > tokenRecord.expiresAt) {
      this.logger.warn(`Expired refresh token used for user ${credentials.userId}`);
      throw new UnauthorizedException('user.auth.tokenExpired');
    }

    // Fetch user from database
    const user = await this.userRepository.findById(credentials.userId, {
      loadEagerRelations: false,
    });

    if (!user) {
      this.logger.error(`User with ID ${credentials.userId} not found`);
      throw new UnauthorizedException('user.notFound');
    }

    // Verify user status
    if (!user.verified) {
      this.logger.warn(`User with ID ${credentials.userId} is not verified`);
      throw new UnauthorizedException('user.auth.verified');
    }

    if (user.blocked) {
      this.logger.warn(`User with ID ${credentials.userId} is blocked`);
      throw new UnauthorizedException('user.auth.blocked');
    }

    // CRITICAL: Revoke old refresh token (rotation)
    await this.refreshTokenRepository.update(
      { id: tokenRecord.id },
      { isRevoked: true },
    );

    this.logger.log(`Old refresh token revoked for user: ${user.email}`);

    // Generate NEW tokens (refresh token rotation)
    const accessToken = await this.authService.generateAccessToken(credentials);
    const refreshToken = await this.authService.generateRefreshToken(user, command.request);
    const csrfToken = this.authService.generateCsrfToken();

    this.logger.log(`New tokens generated successfully for user: ${user.email}`);

    return {
      accessToken,
      refreshToken,
      csrfToken,
    };
  }
}
