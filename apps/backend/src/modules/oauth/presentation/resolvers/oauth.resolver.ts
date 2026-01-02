import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { UseGuards } from '@nestjs/common';

import { OAuthProviderDto, IdentityDto, OAuthAuthResponseDto } from '../dtos/oauth.dto';
import {
  OAuthAuthenticateInput,
  OAuthLinkProviderInput,
  OAuthGetProvidersInput,
} from '../dtos/oauth.input';
import { OAuthAuthenticateCommand } from '../../application/commands/oauth-authenticate.command';
import { OAuthLinkProviderCommand } from '../../application/commands/oauth-link-provider.command';
import { OAuthUnlinkProviderCommand } from '../../application/commands/oauth-unlink-provider.command';
import { OAuthGetProvidersQuery } from '../../application/queries/oauth-get-providers.query';
import { OAuthGetUserIdentitiesQuery } from '../../application/queries/oauth-get-user-identities.query';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { CurrentUserId } from '@/decorators/current-user-id.decorator';
import { GraphQLContext } from '@/interfaces/graphql-context.interface';
import { AuthServiceAdapter } from '@/modules/users/infrastructure/adapters/auth-service.adapter';
import { AuthMode } from '@/enums/auth-mode.enum';
import { OAuthProviderType } from '@/enums/oauth-provider-type.enum';

/**
 * OAuth GraphQL resolver
 * Handles OAuth authentication, provider linking/unlinking
 */
@Resolver()
export class OAuthResolver {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly authService: AuthServiceAdapter,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get list of available OAuth providers with authorization URLs
   */
  @Query(() => [OAuthProviderDto])
  async oauthGetProviders(@Args('input') input: OAuthGetProvidersInput): Promise<OAuthProviderDto[]> {
    return this.queryBus.execute(new OAuthGetProvidersQuery(input.redirectUri));
  }

  /**
   * Authenticate user with OAuth provider
   */
  @Mutation(() => OAuthAuthResponseDto)
  async oauthAuthenticate(
    @Args('input') input: OAuthAuthenticateInput,
    @Context() ctx: GraphQLContext,
  ): Promise<OAuthAuthResponseDto> {
    const result = await this.commandBus.execute(
      new OAuthAuthenticateCommand(input.provider, input.code, input.state, input.redirectUri),
    );

    // Set cookies
    if (result.accessToken && result.refreshToken && result.csrfToken) {
      this.authService.setAuthCookies(ctx.reply!, result.accessToken, result.refreshToken, result.csrfToken);
    }

    // Determine response mode
    const mode = this.configService.get<AuthMode>('auth.mode', AuthMode.HYBRID);
    const csrfEnabled = this.configService.get<boolean>('auth.csrf.enabled', false);

    return {
      accessToken: mode !== AuthMode.COOKIES_ONLY ? result.accessToken : undefined,
      refreshToken: mode !== AuthMode.COOKIES_ONLY ? result.refreshToken : undefined,
      csrfToken: csrfEnabled && mode !== AuthMode.COOKIES_ONLY ? result.csrfToken : undefined,
      user: result.user,
      isNewUser: result.isNewUser,
    };
  }

  /**
   * Link OAuth provider to authenticated user account
   */
  @Mutation(() => IdentityDto)
  @UseGuards(JwtAuthGuard)
  async oauthLinkProvider(
    @Args('input') input: OAuthLinkProviderInput,
    @CurrentUserId() userId: string,
  ): Promise<IdentityDto> {
    const identity = await this.commandBus.execute(
      new OAuthLinkProviderCommand(userId, input.provider, input.code, input.state, input.redirectUri),
    );

    return {
      id: identity.id,
      providerType: identity.providerType,
      providerEmail: identity.providerEmail,
      avatarUrl: identity.avatarUrl,
      metadata: identity.metadata,
      createdAt: identity.createdAt,
    };
  }

  /**
   * Unlink OAuth provider from authenticated user account
   */
  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async oauthUnlinkProvider(
    @Args('provider', { type: () => String }) provider: OAuthProviderType,
    @CurrentUserId() userId: string,
  ): Promise<boolean> {
    return this.commandBus.execute(new OAuthUnlinkProviderCommand(userId, provider));
  }

  /**
   * Get all linked OAuth identities for authenticated user
   */
  @Query(() => [IdentityDto])
  @UseGuards(JwtAuthGuard)
  async oauthGetUserIdentities(@CurrentUserId() userId: string): Promise<IdentityDto[]> {
    const identities = await this.queryBus.execute(new OAuthGetUserIdentitiesQuery(userId));

    return identities.map((identity) => ({
      id: identity.id,
      providerType: identity.providerType,
      providerEmail: identity.providerEmail,
      avatarUrl: identity.avatarUrl,
      metadata: identity.metadata,
      createdAt: identity.createdAt,
    }));
  }
}
