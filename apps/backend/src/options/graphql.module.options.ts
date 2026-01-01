import { join as pathJoin } from 'node:path';
import { FastifyReply, FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';
import * as MQEmitterRedis from 'mqemitter-redis';
import { MercuriusDriverConfig } from '@nestjs/mercurius';
import { ConfigService } from '@nestjs/config';

import { GraphQLContext, GraphQLWebSocketContext } from '@/interfaces/graphql-context.interface';
import { AuthServiceAdapter } from '@/modules/users/infrastructure/adapters';

export const GraphQLModuleOptions = (
  configService: ConfigService,
  authService: AuthServiceAdapter,
): MercuriusDriverConfig => {
  const path = configService.get<string>('graphql.path');
  const graphiql = configService.get<boolean>('graphql.graphiql', false);
  const introspection = configService.get<boolean>('graphql.introspection', false);
  const autoSchemaFile = pathJoin(process.cwd(), 'schema.gql');

  const redisHost = configService.get<string>('redis.host');
  const redisPort = configService.get<number>('redis.port');
  const redisPassword = configService.get<string>('redis.password');
  let emitter: object | undefined = undefined;
  if (redisHost) {
    emitter = MQEmitterRedis({
      host: redisHost,
      port: redisPort,
      password: redisPassword || '',
    });
  }

  return {
    path,
    autoSchemaFile,
    sortSchema: true,
    introspection,
    graphiql,
    cache: true,
    buildSchemaOptions: {
      dateScalarMode: 'timestamp',
      numberScalarMode: 'float',
      skipCheck: false,
      noDuplicatedFields: false,
    },
    routes: true,
    subscription: {
      emitter,
      fullWsTransport: true,
      onConnect: async ({ payload }) => {
        if (typeof payload === 'object') {
          const token = (payload?.['Authorization'] as string)?.slice(7);
          if (!token) {
            throw new Error('Authorization token not found');
          }
          const credentials = await authService.validateJwt(token, undefined, payload);
          if (!credentials) {
            throw new Error('Invalid authorization token');
          }
          return credentials;
        }
        return false;
      },
      context: (socket: WebSocket, req: FastifyRequest): GraphQLWebSocketContext => {
        return { socket, req };
      },
    },
    context: async (req: FastifyRequest, reply: FastifyReply): Promise<GraphQLContext> => {
      // Try to extract token from Authorization header first
      let token = req.headers.authorization?.slice(7);

      // If not in header, try to get from cookie
      if (!token) {
        const cookieName = configService.get<string>('auth.cookies.accessToken.name', 'accessToken');
        token = (req.cookies as Record<string, string> | undefined)?.[cookieName];
      }

      // If no token found at all, return context without credentials
      if (!token) {
        return { req, reply };
      }

      // Validate token and add credentials to context
      const credentials = await authService.validateJwt(token, undefined, req);
      return { ...credentials, req, reply };
    },
  };
};
