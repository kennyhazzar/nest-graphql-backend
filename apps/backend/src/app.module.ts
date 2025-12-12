import { readFileSync } from 'node:fs';
import { join as pathJoin } from 'node:path';
import * as yaml from 'js-yaml';
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigFactory, ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLWebsocketResolver, I18nModule, I18nOptionsWithoutResolvers } from 'nestjs-i18n';
import { MercuriusDriver, MercuriusDriverConfig } from '@nestjs/mercurius';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { LoggerModuleOptions, GraphQLModuleOptions, TypeOrmDbModuleOptions, BullmqModuleOptions } from './options';

import { GraphqlSearchQueryModule } from './common/graphql-search-query';
import { UserLanguageResolver } from './i18n/user-language-resolver';
import { UsersModule } from './modules/users/users.module';
import { AuthServiceAdapter } from './modules/users/infrastructure/adapters';
import { MigrationModule } from './modules/migration/migration.module';
import { FileModule } from './modules/file/file.module';
import { NotificationModule } from './modules/notification/notification.module';
import { TimestampScalar } from './common/scalars/timestamp.scalar';

const CONFIG_FILENAME = process.env.NODE_ENV === 'test' ? 'config.test.yaml' : 'config.yaml';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => yaml.load(readFileSync(CONFIG_FILENAME, 'utf8')) as ConfigFactory],
    }),
    LoggerModule.forRootAsync({ useFactory: LoggerModuleOptions, inject: [ConfigService] }),

    TypeOrmModule.forRootAsync({ useFactory: TypeOrmDbModuleOptions, inject: [ConfigService] }),

    BullModule.forRootAsync({ useFactory: BullmqModuleOptions, inject: [ConfigService] }),

    UsersModule,

    FileModule,

    NotificationModule,

    MigrationModule,

    GraphQLModule.forRootAsync<MercuriusDriverConfig>({
      inject: [ConfigService, AuthServiceAdapter],
      driver: MercuriusDriver,
      useFactory: GraphQLModuleOptions,
    }),

    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService): I18nOptionsWithoutResolvers => ({
        fallbackLanguage: configService.getOrThrow('settings.language'),
        loaderOptions: {
          path: pathJoin(__dirname, 'i18n/'),
          watch: true,
        },
        logging: true,
        typesOutputPath:
          process.env.NODE_ENV === 'test'
            ? undefined
            : pathJoin(__dirname, '../../../apps/backend/src/i18n/i18n.generated.ts'),
      }),
      resolvers: [GraphQLWebsocketResolver, UserLanguageResolver],
      inject: [ConfigService],
      imports: [ConfigModule],
    }),

    GraphqlSearchQueryModule,
  ],
  providers: [TimestampScalar],
})
export class AppModule {}
