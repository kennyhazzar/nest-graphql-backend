import { Injectable } from '@nestjs/common';

import { OAuthProviderType } from '@/enums/oauth-provider-type.enum';
import { OAuthProviderService } from '../../domain/services/oauth-provider.service';
import { OAuthGoogleAdapter } from '../adapters/oauth-google.adapter';
import { OAuthYandexAdapter } from '../adapters/oauth-yandex.adapter';

/**
 * Factory for creating OAuth provider instances
 * Returns the appropriate adapter based on provider type
 */
@Injectable()
export class OAuthProviderFactory {
  constructor(
    private readonly googleAdapter: OAuthGoogleAdapter,
    private readonly yandexAdapter: OAuthYandexAdapter,
  ) {}

  /**
   * Create an OAuth provider instance based on provider type
   */
  createProvider(providerType: OAuthProviderType): OAuthProviderService {
    switch (providerType) {
      case OAuthProviderType.GOOGLE:
        return this.googleAdapter;
      case OAuthProviderType.YANDEX:
        return this.yandexAdapter;
      default:
        throw new Error(`Unsupported OAuth provider: ${providerType}`);
    }
  }

  /**
   * Get all configured (available) provider types
   */
  getAvailableProviders(): OAuthProviderType[] {
    return [
      this.googleAdapter.isConfigured() ? OAuthProviderType.GOOGLE : null,
      this.yandexAdapter.isConfigured() ? OAuthProviderType.YANDEX : null,
    ].filter((p): p is OAuthProviderType => p !== null);
  }
}
