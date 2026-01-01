import { Command } from '@nestjs/cqrs';
import { OAuthProviderType } from '@/enums/oauth-provider-type.enum';
import { Identity } from '@/modules/users/domain/entities/identity.entity';

/**
 * Command to link OAuth provider to existing user account
 */
export class OAuthLinkProviderCommand extends Command<Identity> {
  constructor(
    public readonly userId: string,
    public readonly provider: OAuthProviderType,
    public readonly code: string,
    public readonly state: string,
    public readonly redirectUri: string,
  ) {
    super();
  }
}
