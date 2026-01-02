import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { Args, Context, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';

import { IdType } from '@/interfaces/id.type';
import { Actions } from '@/enums/actions.enum';
import { Subjects } from '@/enums/subjects.enum';
import { Status } from '@/enums/status.enum';
import { AuthMode } from '@/enums';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { PoliciesGuard } from '@/guards/policies.guard';
import { CurrentUserId } from '@/decorators/current-user-id.decorator';
import { Policy } from '@/decorators/policy.decorator';
import { GraphQLContext } from '@/interfaces/graphql-context.interface';
import { I18nTranslations } from '@/i18n';
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
  LogoutResponseDto,
  MagicLinkRequestInput,
  MagicLinkAuthenticateInput,
  MagicLinkResponseDto,
} from '../dtos';
import { UserMapper } from '../mappers';
import {
  UserLoginCommand,
  UserLogoutCommand,
  UserCreateCommand,
  UserUpdateCommand,
  UserDeleteCommand,
  UserUpdateThemeCommand,
  RefreshTokensCommand,
  MagicLinkRequestCommand,
  MagicLinkAuthenticateCommand,
} from '../../application/commands';
import { UsersGetQuery, UserGetByIdQuery } from '../../application/queries';

@Resolver(() => UserDto)
export class UserResolver {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly authService: AuthServiceAdapter,
    private readonly i18n: I18nService<I18nTranslations>,
    private readonly configService: ConfigService,
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
    const csrfToken = this.authService.generateCsrfToken();

    // Set cookies
    this.authService.setAuthCookies(ctx.reply!, accessToken, refreshToken, csrfToken);

    // Determine response mode
    const mode = this.configService.get<AuthMode>('auth.mode', AuthMode.HYBRID);
    const csrfEnabled = this.configService.get<boolean>('auth.csrf.enabled', false);

    return {
      accessToken: mode !== AuthMode.COOKIES_ONLY ? accessToken : undefined,
      refreshToken: mode !== AuthMode.COOKIES_ONLY ? refreshToken : undefined,
      csrfToken: csrfEnabled && mode !== AuthMode.COOKIES_ONLY ? csrfToken : undefined,
      user: UserMapper.toDto(user),
    };
  }

  @Mutation(() => AccessTokenResponseDto)
  async refreshTokens(
    @Args('input', { nullable: true, type: () => RefreshTokenInput }) input: RefreshTokenInput | null,
    @Context() ctx: GraphQLContext,
  ): Promise<AccessTokenResponseDto> {
    // Try to get refresh token from cookie or from input
    const refreshToken = ctx.req?.cookies?.refreshToken || input?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    // Execute refresh tokens command (with rotation)
    const tokens = await this.commandBus.execute(new RefreshTokensCommand(refreshToken, ctx.req!));

    // Set all cookies (access, refresh, csrf) - refresh token rotation
    const mode = this.configService.get<AuthMode>('auth.mode', AuthMode.HYBRID);
    if (mode !== AuthMode.RESPONSE_ONLY) {
      this.authService.setAuthCookies(ctx.reply!, tokens.accessToken, tokens.refreshToken, tokens.csrfToken);
    }

    return {
      accessToken: mode !== AuthMode.COOKIES_ONLY ? tokens.accessToken : undefined,
      refreshToken: mode !== AuthMode.COOKIES_ONLY ? tokens.refreshToken : undefined,
      csrfToken: tokens.csrfToken,
    };
  }

  @Mutation(() => LogoutResponseDto)
  async logout(
    @Args('input') input: RefreshTokenInput,
    @Context() ctx: GraphQLContext,
  ): Promise<LogoutResponseDto> {
    // Try to get refresh token from cookie or from input
    const refreshToken = ctx.req?.cookies?.refreshToken || input.refreshToken;

    if (!refreshToken) {
      return {
        success: false,
        message: await this.i18n.translate('user.auth.logout.tokenNotProvided'),
      };
    }

    const success = await this.commandBus.execute(new UserLogoutCommand(refreshToken));

    // Clear cookies
    this.authService.clearAuthCookies(ctx.reply!);

    return {
      success,
      message: success
        ? await this.i18n.translate('user.auth.logout.success')
        : await this.i18n.translate('user.auth.logout.failed'),
    };
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

  // Magic Link mutations
  @Mutation(() => MagicLinkResponseDto)
  async requestMagicLink(
    @Args('input') input: MagicLinkRequestInput,
    @Context() ctx: GraphQLContext,
  ): Promise<MagicLinkResponseDto> {
    const fingerprint = ctx.req?.ip || 'unknown';
    const userAgent = ctx.req?.headers['user-agent'] || 'unknown';

    const result = await this.commandBus.execute(
      new MagicLinkRequestCommand(input.email, fingerprint, userAgent),
    );

    return {
      success: result.success,
      message: 'If an account exists with this email, a magic link has been sent.',
    };
  }

  @Mutation(() => AuthResponseDto)
  async authenticateWithMagicLink(
    @Args('input') input: MagicLinkAuthenticateInput,
    @Context() ctx: GraphQLContext,
  ): Promise<AuthResponseDto> {
    const fingerprint = ctx.req?.ip || 'unknown';

    const result = await this.commandBus.execute(
      new MagicLinkAuthenticateCommand(input.token, fingerprint),
    );

    // Set cookies
    this.authService.setAuthCookies(ctx.reply!, result.accessToken!, result.refreshToken!, result.csrfToken!);

    // Determine response mode
    const mode = this.configService.get<AuthMode>('auth.mode', AuthMode.HYBRID);
    const csrfEnabled = this.configService.get<boolean>('auth.csrf.enabled', false);

    return {
      accessToken: mode !== AuthMode.COOKIES_ONLY ? result.accessToken : undefined,
      refreshToken: mode !== AuthMode.COOKIES_ONLY ? result.refreshToken : undefined,
      csrfToken: csrfEnabled && mode !== AuthMode.COOKIES_ONLY ? result.csrfToken : undefined,
      user: result.user,
    };
  }
}
