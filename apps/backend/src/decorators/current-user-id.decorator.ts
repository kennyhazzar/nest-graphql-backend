import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLContext } from '@/interfaces/graphql-context.interface';

/**
 * Extracts the current user's ID from the execution context
 * @param data - Optional data parameter (unused)
 * @param ctx - Execution context
 * @returns The user ID or undefined
 */
export function getCurrentUserId(data: unknown, ctx: ExecutionContext): string | null | undefined {
  if (ctx.getType() === 'http') {
    const context = ctx.switchToHttp();
    const request = context.getRequest();
    if (request.user?.userId) {
      return request.user.userId;
    }
    return request.userId;
  }
  const context = GqlExecutionContext.create(ctx).getContext<GraphQLContext>();
  return context.userId;
}

/**
 * @CurrentUserId() - Parameter decorator to extract the current user's ID
 * Works with both HTTP and GraphQL contexts
 */
export const CurrentUserId = createParamDecorator(getCurrentUserId);
