import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { IdType } from '@/interfaces/id.type';
import { Actions } from '@/enums/actions.enum';
import { Subjects } from '@/enums/subjects.enum';
import { Status } from '@/enums/status.enum';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { PoliciesGuard } from '@/guards/policies.guard';
import { Policy } from '@/decorators/policy.decorator';
import { UserRoleDto, UserRolesDto, UserRoleCreateInput, UserRoleUpdateInput } from '../dtos';
import {
  UserRoleCreateCommand,
  UserRoleUpdateCommand,
  UserRoleDeleteCommand,
} from '../../application/commands';
import { UserRolesGetQuery, UserRoleGetByIdQuery } from '../../application/queries';

@Resolver(() => UserRoleDto)
export class UserRoleResolver {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Query(() => UserRolesDto)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Policy(Actions.READ, Subjects.USER_ROLE)
  async userRoles(): Promise<UserRolesDto> {
    return this.queryBus.execute(new UserRolesGetQuery());
  }

  @Query(() => UserRoleDto)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Policy(Actions.READ, Subjects.USER_ROLE)
  async userRoleGetById(@Args('id', { type: () => ID }) id: IdType): Promise<UserRoleDto> {
    return this.queryBus.execute(new UserRoleGetByIdQuery(id));
  }

  @Mutation(() => UserRoleDto)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Policy(Actions.CREATE, Subjects.USER_ROLE)
  async userRoleCreate(@Args('input') input: UserRoleCreateInput): Promise<UserRoleDto> {
    return this.commandBus.execute(new UserRoleCreateCommand(input));
  }

  @Mutation(() => UserRoleDto)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Policy(Actions.UPDATE, Subjects.USER_ROLE)
  async userRoleUpdate(
    @Args('id', { type: () => ID }) id: IdType,
    @Args('input') input: UserRoleUpdateInput,
  ): Promise<UserRoleDto> {
    return this.commandBus.execute(new UserRoleUpdateCommand(id, input));
  }

  @Mutation(() => Status)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Policy(Actions.DELETE, Subjects.USER_ROLE)
  async userRoleDelete(@Args('id', { type: () => ID }) id: IdType): Promise<Status> {
    return this.commandBus.execute(new UserRoleDeleteCommand(id));
  }
}
