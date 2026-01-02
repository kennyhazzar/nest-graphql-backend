import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { OAuthProviderType } from '@/enums/oauth-provider-type.enum';

/**
 * Input for OAuth authentication
 */
@InputType('OAuthAuthenticateInput')
export class OAuthAuthenticateInput {
  @Field(() => String)
  @IsEnum(OAuthProviderType)
  provider!: OAuthProviderType;

  @Field()
  @IsString()
  @IsNotEmpty()
  code!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  state!: string;

  @Field()
  @IsUrl()
  @IsNotEmpty()
  redirectUri!: string;
}

/**
 * Input for linking OAuth provider
 */
@InputType('OAuthLinkProviderInput')
export class OAuthLinkProviderInput {
  @Field(() => String)
  @IsEnum(OAuthProviderType)
  provider!: OAuthProviderType;

  @Field()
  @IsString()
  @IsNotEmpty()
  code!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  state!: string;

  @Field()
  @IsUrl()
  @IsNotEmpty()
  redirectUri!: string;
}

/**
 * Input for getting OAuth providers
 */
@InputType('OAuthGetProvidersInput')
export class OAuthGetProvidersInput {
  @Field()
  @IsUrl()
  @IsNotEmpty()
  redirectUri!: string;
}
