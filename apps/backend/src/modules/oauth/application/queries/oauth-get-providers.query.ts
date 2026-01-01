import { Query } from '@nestjs/cqrs';
import { OAuthProviderType } from '@/enums/oauth-provider-type.enum';

/**
 * Provider information with authorization URL
 */
export interface OAuthProviderInfo {
  type: OAuthProviderType;
  name: string;
  authorizationUrl: string;
}

/**
 * Query to get list of available OAuth providers with authorization URLs
 */
export class OAuthGetProvidersQuery extends Query<OAuthProviderInfo[]> {
  constructor(public readonly redirectUri: string) {
    super();
  }
}
