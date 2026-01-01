import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';

import { OAuthUnlinkProviderCommand } from '../commands/oauth-unlink-provider.command';
import { OAuthProviderFactory } from '../../infrastructure/factories/oauth-provider.factory';
import { IdentityRepository } from '@/modules/users/domain/repositories/identity.repository';
import { UserRepository } from '@/modules/users/domain/repositories/user.repository';

/**
 * Handler for unlinking OAuth provider from user account
 */
@CommandHandler(OAuthUnlinkProviderCommand)
export class OAuthUnlinkProviderHandler implements ICommandHandler<OAuthUnlinkProviderCommand> {
  private readonly logger = new Logger(OAuthUnlinkProviderHandler.name);

  constructor(
    private readonly oauthProviderFactory: OAuthProviderFactory,
    private readonly identityRepository: IdentityRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: OAuthUnlinkProviderCommand): Promise<boolean> {
    const { userId, provider } = command;

    this.logger.log(`Unlinking OAuth provider ${provider} from user: ${userId}`);

    // Find identity
    const identity = await this.identityRepository.findByUserIdAndProvider(userId, provider);
    if (!identity) {
      throw new NotFoundException(`${provider} is not linked to this account`);
    }

    // IMPORTANT: Check if user has at least one auth method remaining
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const identitiesCount = await this.identityRepository.countByUserId(userId);
    const hasPassword = !!user.password;

    // User must have at least one auth method (password OR at least one OAuth provider)
    if (!hasPassword && identitiesCount <= 1) {
      throw new BadRequestException(
        'Cannot remove last authentication method. Please set a password first or keep at least one OAuth provider linked.',
      );
    }

    // Revoke OAuth token (best effort)
    try {
      if (identity.accessToken) {
        const oauthProvider = this.oauthProviderFactory.createProvider(provider);
        await oauthProvider.revokeToken(identity.accessToken);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to revoke OAuth token for ${provider}: ${errorMessage}`);
      // Continue with deletion even if revocation fails
    }

    // Delete identity
    await this.identityRepository.delete(identity.id);

    this.logger.log(`OAuth provider ${provider} unlinked successfully from user: ${userId}`);

    return true;
  }
}
