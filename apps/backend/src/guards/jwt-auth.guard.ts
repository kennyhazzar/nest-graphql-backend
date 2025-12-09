import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

import { IdType } from '@/interfaces/id.type';
import { GraphQLContext } from '@/interfaces/graphql-context.interface';
import { RoleType } from '@/enums/role-type.enum';

declare module 'fastify' {
  export interface FastifyRequest {
    userId?: IdType | null;
    roleId?: IdType | null;
    roleType?: RoleType | null;
    language?: string | null;
  }
}

/**
 * JWT Authentication Guard
 * Used for protecting HTTP, WebSocket routes, and GraphQL queries
 *
 * @export
 * @class JwtAuthGuard
 * @extends {AuthGuard('jwt')}
 * @implements {CanActivate}
 * @description
 * This class extends AuthGuard to validate JWT tokens in HTTP and WebSocket request contexts.
 * It checks for the presence of userId in the GraphQL context and returns true if the user is authorized.
 * Otherwise returns false.
 * Used to protect routes that require user authorization.
 * Usage example:
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Query(() => UserDto)
 * async getUser(@CurrentUserId() userId: IdType) {
 *   return this.userService.findById(userId);
 * }
 * ```
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  canActivate(context: ExecutionContext) {
    if (context.getType<GqlContextType>() === 'graphql') {
      // For WS GraphQL context use GqlExecutionContext
      const ctx = GqlExecutionContext.create(context);
      const gqlContext = ctx.getContext<GraphQLContext>();
      if (gqlContext.userId) {
        // If userId exists, user is authorized
        return true;
      }
      // If userId doesn't exist, user is not authorized
      return false;
    }

    return super.canActivate(context);
  }

  getRequest(context: ExecutionContext) {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest();
    }
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext<GraphQLContext>();
    return gqlContext.req;
  }
}
