import { resolve as pathResolve } from 'node:path';
import { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { LogLevel } from 'typeorm';

import { TypeOrmLogger } from '@/common/typeorm.logger';

export const TypeOrmDbModuleOptions = (configService: ConfigService): TypeOrmModuleOptions => {
  const cacheHost = configService.getOrThrow<string>('redis.host');
  const logLevel = configService.getOrThrow<string>('log.level');
  let ssl = configService.get<boolean | { rejectUnauthorized: boolean; ca: string | undefined }>('database.ssl', false);
  const sslCa = configService.get<string | undefined>('database.sslCa');
  if (ssl && sslCa) {
    ssl = {
      rejectUnauthorized: true,
      ca: sslCa,
    };
  }
  return {
    type: configService.get<string>('database.type', 'postgres') as any,
    username: configService.get<string>('database.username'),
    password: configService.get<string>('database.password'),
    host: configService.get<string>('database.host'),
    port: configService.get<number>('database.port'),
    url: configService.get<string>('database.uri'),
    database: configService.get<string>('database.db'),
    dropSchema: configService.get<boolean>('database.dropSchema', false),
    ssl,
    nativeDriver: true,
    logging: logLevel ? (logLevel.split(',') as LogLevel[]) : false,
    logger: new TypeOrmLogger(),
    synchronize: configService.get<boolean>('database.synchronize', false),
    entities: [`${pathResolve(__dirname, '..')}/**/*.entity.{ts,js}`],
    migrations: [`${pathResolve(__dirname, '..')}/migrations/*.{ts,js}`],
    migrationsRun: configService.get<boolean>('database.migrationsRun', false),
    autoLoadEntities: configService.get<boolean>('database.autoLoadEntities', true),

    cache: cacheHost
      ? {
          type: 'ioredis',
          options: {
            clientName: 'DATABASE',
            host: cacheHost,
            port: parseInt(configService.get<string>('redis.port', '6379'), 10),
            db: 0,
            keyPrefix: 'DATABASE:',
          },
          alwaysEnabled: true,
          duration: parseInt(configService.get<string>('redis.duration', '1000'), 10),
        }
      : undefined,
  };
};
