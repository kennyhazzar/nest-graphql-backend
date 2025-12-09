import { UseGuards } from '@nestjs/common';
import { Args, Context, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { IdType } from '@/interfaces/id.type';
import { Actions } from '@/enums/actions.enum';
import { Subjects } from '@/enums/subjects.enum';
import { Status } from '@/enums/status.enum';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { PoliciesGuard } from '@/guards/policies.guard';
import { CurrentUserId } from '@/decorators/current-user-id.decorator';
import { Policy } from '@/decorators/policy.decorator';
import { GraphQLContext } from '@/interfaces/graphql-context.interface';
import { AuthServiceAdapter } from '../../infrastructure/adapters';
import {
  UserDto,
  UsersDto,
  UserLoginInput,
  UserCreateInput,
  UserUpdateInput,
  UserUpdateThemeInput,
  RefreshTokenInput,
  AuthResponseDto,
  AccessTokenResponseDto,
} from '../dtos';
import { UserMapper } from '../mappers';
import {
  UserLoginCommand,
  UserCreateCommand,
  UserUpdateCommand,
  UserDeleteCommand,
  UserUpdateThemeCommand,
  AccessFromRefreshTokenCommand,
} from '../../application/commands';
import { UsersGetQuery, UserGetByIdQuery } from '../../application/queries';

@Resolver(() => UserDto)
export class UserResolver {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly authService: AuthServiceAdapter,
  ) {}

  // Auth mutations
  @Mutation(() => AuthResponseDto)
  async login(
    @Args('input') input: UserLoginInput,
    @Context() ctx: GraphQLContext,
  ): Promise<AuthResponseDto> {
    const user = await this.commandBus.execute(new UserLoginCommand(input));
    const accessToken = await this.authService.generateAccessToken({
      userId: user.id,
      roleId: user.roleId,
      roleType: user.role.type,
      language: user.language,
    });
    const refreshToken = await this.authService.generateRefreshToken(user, ctx.req!);

    return {
      accessToken,
      refreshToken,
      user: UserMapper.toDto(user),
    };
  }

  @Mutation(() => AccessTokenResponseDto)
  async accessFromRefreshToken(
    @Args('input') input: RefreshTokenInput,
  ): Promise<AccessTokenResponseDto> {
    const accessToken = await this.commandBus.execute(
      new AccessFromRefreshTokenCommand(input.refreshToken),
    );
    return { accessToken };
  }

  // User queries
  @Query(() => UsersDto)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Policy(Actions.READ, Subjects.USER_ADMIN)
  async users(): Promise<UsersDto> {
    return this.queryBus.execute(new UsersGetQuery());
  }

  @Query(() => UserDto)
  @UseGuards(JwtAuthGuard)
  async user(@CurrentUserId() userId: IdType): Promise<UserDto> {
    return this.queryBus.execute(new UserGetByIdQuery(userId));
  }

  @Query(() => UserDto)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Policy(Actions.READ, Subjects.USER_ADMIN)
  async userGetById(@Args('id', { type: () => ID }) id: IdType): Promise<UserDto> {
    return this.queryBus.execute(new UserGetByIdQuery(id));
  }

  // User mutations
  @Mutation(() => UserDto)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Policy(Actions.CREATE, Subjects.USER_ADMIN)
  async userCreate(@Args('input') input: UserCreateInput): Promise<UserDto> {
    return this.commandBus.execute(new UserCreateCommand(input));
  }

  @Mutation(() => UserDto)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Policy(Actions.UPDATE, Subjects.USER_ADMIN)
  async userUpdate(
    @Args('id', { type: () => ID }) id: IdType,
    @Args('input') input: UserUpdateInput,
  ): Promise<UserDto> {
    return this.commandBus.execute(new UserUpdateCommand(id, input));
  }

  @Mutation(() => Status)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Policy(Actions.DELETE, Subjects.USER_ADMIN)
  async userDelete(@Args('id', { type: () => ID }) id: IdType): Promise<Status> {
    return this.commandBus.execute(new UserDeleteCommand(id));
  }

  @Mutation(() => UserDto)
  @UseGuards(JwtAuthGuard)
  async userUpdateTheme(
    @CurrentUserId() userId: IdType,
    @Args('input') input: UserUpdateThemeInput,
  ): Promise<UserDto> {
    return this.commandBus.execute(new UserUpdateThemeCommand(userId, input));
  }
}
