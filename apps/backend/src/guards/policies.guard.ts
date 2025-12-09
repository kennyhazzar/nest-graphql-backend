import { FastifyRequest } from 'fastify';
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';

import { GraphQLContext, GraphQLWebSocketContext } from '@/interfaces/graphql-context.interface';
import { RoleType } from '@/enums/role-type.enum';
import { Actions } from '@/enums/actions.enum';
import { Subjects } from '@/enums/subjects.enum';
import { PoliciesService } from '@/modules/users/infrastructure/services/policies.service';
import { POLICY_KEY } from '../decorators/policy.decorator';

/**
 * Guard for checking access based on roles and action policies.
 * Uses role enum and action/subject enums for centralized user permission checking.
 * Allows flexible access control for GraphQL and HTTP endpoints without complex custom implementations.
 */
@Injectable()
export class PoliciesGuard implements CanActivate {
  private readonly logger = new Logger(PoliciesGuard.name);

  constructor(
    private reflector: Reflector,
    private policiesService: PoliciesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const policy = this.reflector.get<[Actions, Subjects[] | Subjects]>(POLICY_KEY, handler);
    if (!policy) {
      // If policy is not defined, allow access
      return true;
    }

    const type = context.getType<GqlContextType>();
    let ctx: GraphQLContext | GraphQLWebSocketContext | FastifyRequest;
    if (type === 'ws') {
      ctx = context.switchToWs().getClient();
    } else if (type === 'graphql') {
      ctx = GqlExecutionContext.create(context).getContext<GraphQLContext>();
    } else {
      // type === 'http'
      ctx = context.switchToHttp().getRequest();
    }

    // For public access userId may be missing
    if (!ctx.userId || !ctx.roleId || !ctx.roleType || !ctx.language) {
      // Check if public access is allowed
      const [action, subject] = policy;
      return this.policiesService.hasPermission(RoleType.PUBLIC, action, subject);
    }

    const ability = await this.policiesService.getAbilityForRole(ctx.roleType);
    if (!ability) {
      this.logger.warn(`No ability found for role type: ${ctx.roleType}`);
      return false;
    }

    const [action, subject] = policy;
    let can: boolean;
    if (Array.isArray(subject)) {
      can = subject.some((s) => ability.can(action, s));
    } else {
      can = ability.can(action, subject);
    }

    if (!can) {
      this.logger.warn(
        `User ${ctx.userId} with role ${ctx.roleType} is not allowed to perform ${action} on ${JSON.stringify(subject)}`,
      );
    }

    return can;
  }
}
