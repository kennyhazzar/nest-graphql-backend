import type { FastifyRequest, FastifyReply } from 'fastify';
import type { WebSocket } from 'ws';

import type { IdType } from './id.type';
import type { RoleType } from '@/enums/role-type.enum';

// Main GraphQL context interface
export interface GraphQLContext {
  userId?: IdType | null;
  roleId?: IdType | null;
  roleType?: RoleType | null;
  language?: string | null;
  req?: FastifyRequest;
  reply?: FastifyReply;
}

export interface GraphQLWebSocketContext extends GraphQLContext {
  socket?: WebSocket;
}
