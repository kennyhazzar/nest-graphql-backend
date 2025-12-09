import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLContext } from '@/interfaces/graphql-context.interface';
import { RoleType } from '@/enums/role-type.enum';

/**
 * Extracts the current user's role type from the execution context
 * @param data - Optional data parameter (unused)
 * @param ctx - Execution context
 * @returns The role type or undefined
 */
export function getCurrentRoleType(data: unknown, ctx: ExecutionContext): RoleType | undefined {
  if (ctx.getType() === 'http') {
    const context = ctx.switchToHttp();
    const request = context.getRequest();
    return request.user?.roleType;
  }
  const context = GqlExecutionContext.create(ctx).getContext<GraphQLContext>();
  return context.roleType as RoleType;
}

/**
 * @CurrentRoleType() - Parameter decorator to extract the current user's role type
 * Works with both HTTP and GraphQL contexts
 */
export const CurrentRoleType = createParamDecorator(getCurrentRoleType);
