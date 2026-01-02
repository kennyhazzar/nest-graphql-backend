import { Command } from '@nestjs/cqrs';
import { OAuthProviderType } from '@/enums/oauth-provider-type.enum';

/**
 * Command to unlink OAuth provider from user account
 */
export class OAuthUnlinkProviderCommand extends Command<boolean> {
  constructor(
    public readonly userId: string,
    public readonly provider: OAuthProviderType,
  ) {
    super();
  }
}
