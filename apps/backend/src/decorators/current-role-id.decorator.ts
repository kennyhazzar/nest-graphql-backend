import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLContext } from '@/interfaces/graphql-context.interface';

/**
 * Extracts the current user's role ID from the execution context
 * @param data - Optional data parameter (unused)
 * @param ctx - Execution context
 * @returns The role ID or undefined
 */
export function getCurrentRoleId(data: unknown, ctx: ExecutionContext) {
  if (ctx.getType() === 'http') {
    const context = ctx.switchToHttp();
    const request = context.getRequest();
    if (request.user?.roleId) {
      return request.user.roleId;
    }
    return request.roleId;
  }
  const context = GqlExecutionContext.create(ctx).getContext<GraphQLContext>();
  return context.roleId;
}

/**
 * @CurrentRoleId() - Parameter decorator to extract the current user's role ID
 * Works with both HTTP and GraphQL contexts
 */
export const CurrentRoleId = createParamDecorator(getCurrentRoleId);
