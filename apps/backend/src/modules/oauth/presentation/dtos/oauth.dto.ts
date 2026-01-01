import { ObjectType, Field, ID } from '@nestjs/graphql';
import { OAuthProviderType } from '@/enums/oauth-provider-type.enum';
import { GraphQLJSON } from 'graphql-scalars';

/**
 * OAuth provider information DTO
 */
@ObjectType('OAuthProvider')
export class OAuthProviderDto {
  @Field(() => String)
  type!: OAuthProviderType;

  @Field()
  name!: string;

  @Field()
  authorizationUrl!: string;
}

/**
 * Identity (linked OAuth provider) DTO
 */
@ObjectType('Identity')
export class IdentityDto {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  providerType!: OAuthProviderType;

  @Field({ nullable: true })
  providerEmail?: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: Record<string, any>;

  @Field()
  createdAt!: Date;
}

/**
 * OAuth authentication response DTO
 */
@ObjectType('OAuthAuthResponse')
export class OAuthAuthResponseDto {
  @Field({ nullable: true })
  accessToken?: string;

  @Field({ nullable: true })
  refreshToken?: string;

  @Field({ nullable: true })
  csrfToken?: string;

  @Field(() => GraphQLJSON)
  user!: any;

  @Field()
  isNewUser!: boolean;
}
