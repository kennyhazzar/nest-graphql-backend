import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { PubSub } from 'graphql-subscriptions';

@Injectable()
export class GraphqlSubscriptionsPubsubFactory {
  private readonly logger = new Logger(GraphqlSubscriptionsPubsubFactory.name);

  constructor(private readonly configService: ConfigService) {}

  createPubSub(): PubSub {
    const redisHost = this.configService.get<string>('redis.host');
    const redisPort = this.configService.get<number>('redis.port');
    const redisPassword = this.configService.get<string>('redis.password');

    if (redisHost && redisPort) {
      try {
        this.logger.log(`Creating RedisPubSub with host: ${redisHost}, port: ${redisPort}`);
        return new RedisPubSub({
          connection: {
            host: redisHost,
            port: redisPort,
            password: redisPassword || '',
          },
          serializer: (obj: any) => {
            return JSON.stringify(obj, (key, value) => {
              if (value instanceof Date) {
                return value.toISOString();
              }
              return value;
            });
          },
          deserializer: (str: string | Buffer) => {
            const stringData = typeof str === 'string' ? str : str.toString();
            return JSON.parse(stringData, (key, value) => {
              if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
                return new Date(value);
              }
              return value;
            });
          },
        }) as unknown as PubSub;
      } catch (error: any) {
        this.logger.warn(`Redis connection failed, falling back to in-memory PubSub: ${error}`);
        return new PubSub();
      }
    }

    this.logger.log('Creating PubSub without Redis');
    return new PubSub();
  }
}
