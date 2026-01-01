import { ObjectType, Field } from '@nestjs/graphql';

import { UserDto } from './user.dto';

@ObjectType('AuthResponse')
export class AuthResponseDto {
  @Field({ nullable: true })
  accessToken?: string;

  @Field({ nullable: true })
  refreshToken?: string;

  @Field({ nullable: true })
  csrfToken?: string;

  @Field(() => UserDto)
  user!: UserDto;
}

@ObjectType('AccessTokenResponse')
export class AccessTokenResponseDto {
  @Field({ nullable: true })
  accessToken?: string;
}

@ObjectType('LogoutResponse')
export class LogoutResponseDto {
  @Field()
  success!: boolean;

  @Field({ nullable: true })
  message?: string;
}
