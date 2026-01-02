import { registerEnumType } from '@nestjs/graphql';

/**
 * OAuth provider types supported by the application
 */
export enum OAuthProviderType {
  GOOGLE = 'google',
  YANDEX = 'yandex',
}

// Register enum with GraphQL
registerEnumType(OAuthProviderType, {
  name: 'OAuthProviderType',
  description: 'Supported OAuth providers for third-party authentication',
  valuesMap: {
    GOOGLE: {
      description: 'Google OAuth 2.0',
    },
    YANDEX: {
      description: 'Yandex OAuth 2.0',
    },
  },
});
