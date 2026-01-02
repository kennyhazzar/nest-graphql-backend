import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';

import { OAuthGetProvidersQuery, OAuthProviderInfo } from '../queries/oauth-get-providers.query';
import { OAuthProviderFactory } from '../../infrastructure/factories/oauth-provider.factory';
import { OAuthProviderType } from '@/enums/oauth-provider-type.enum';

/**
 * Handler to get list of available OAuth providers with authorization URLs
 */
@QueryHandler(OAuthGetProvidersQuery)
export class OAuthGetProvidersHandler implements IQueryHandler<OAuthGetProvidersQuery> {
  constructor(private readonly oauthProviderFactory: OAuthProviderFactory) {}

  async execute(query: OAuthGetProvidersQuery): Promise<OAuthProviderInfo[]> {
    const { redirectUri } = query;

    // Generate state token (TODO: store in Redis with TTL for CSRF protection)
    const state = randomUUID();

    const providers = this.oauthProviderFactory.getAvailableProviders();

    return providers.map((providerType) => {
      const provider = this.oauthProviderFactory.createProvider(providerType);
      const authorizationUrl = provider.getAuthorizationUrl(state, redirectUri);

      return {
        type: providerType,
        name: this.getProviderName(providerType),
        authorizationUrl,
      };
    });
  }

  private getProviderName(type: OAuthProviderType): string {
    switch (type) {
      case OAuthProviderType.GOOGLE:
        return 'Google';
      case OAuthProviderType.YANDEX:
        return 'Yandex';
      default:
        return type;
    }
  }
}
