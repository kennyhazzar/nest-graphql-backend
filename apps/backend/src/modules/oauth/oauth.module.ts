import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module';
import { IdentityEntity } from '../users/infrastructure/entity/identity.entity';
import { IdentityRepository } from '../users/domain/repositories/identity.repository';
import { IdentityRepositoryImpl } from '../users/infrastructure/repositories/identity.repository.impl';
import { OAuthGoogleAdapter, OAuthYandexAdapter } from './infrastructure/adapters';
import { OAuthProviderFactory } from './infrastructure/factories/oauth-provider.factory';
import { OAuthResolver } from './presentation/resolvers/oauth.resolver';
import {
  OAuthAuthenticateHandler,
  OAuthLinkProviderHandler,
  OAuthUnlinkProviderHandler,
  OAuthGetProvidersHandler,
  OAuthGetUserIdentitiesHandler,
} from './application/handlers';

/**
 * Command handlers for OAuth module
 */
const CommandHandlers = [OAuthAuthenticateHandler, OAuthLinkProviderHandler, OAuthUnlinkProviderHandler];

/**
 * Query handlers for OAuth module
 */
const QueryHandlers = [OAuthGetProvidersHandler, OAuthGetUserIdentitiesHandler];

/**
 * OAuth module for third-party authentication
 * Provides Google and Yandex OAuth integration
 */
@Module({
  imports: [UsersModule, CqrsModule, TypeOrmModule.forFeature([IdentityEntity])],
  providers: [
    // Adapters
    OAuthGoogleAdapter,
    OAuthYandexAdapter,

    // Factory
    OAuthProviderFactory,

    // Resolver
    OAuthResolver,

    // Repository
    {
      provide: IdentityRepository,
      useClass: IdentityRepositoryImpl,
    },

    // Handlers
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [OAuthProviderFactory, IdentityRepository],
})
export class OAuthModule {}
