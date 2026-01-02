import { Command } from '@nestjs/cqrs';
import { OAuthProviderType } from '@/enums/oauth-provider-type.enum';

/**
 * OAuth authentication response with user info
 */
export interface OAuthAuthResponse {
  accessToken?: string;
  refreshToken?: string;
  csrfToken?: string;
  user: any;
  isNewUser: boolean;
}

/**
 * Command to authenticate using OAuth provider
 */
export class OAuthAuthenticateCommand extends Command<OAuthAuthResponse> {
  constructor(
    public readonly provider: OAuthProviderType,
    public readonly code: string,
    public readonly state: string,
    public readonly redirectUri: string,
  ) {
    super();
  }
}
