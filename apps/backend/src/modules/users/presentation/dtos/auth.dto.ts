import { ObjectType, Field } from '@nestjs/graphql';

import { UserDto } from './user.dto';

@ObjectType('AuthResponse')
export class AuthResponseDto {
  @Field()
  accessToken!: string;

  @Field()
  refreshToken!: string;

  @Field(() => UserDto)
  user!: UserDto;
}

@ObjectType('AccessTokenResponse')
export class AccessTokenResponseDto {
  @Field()
  accessToken!: string;
}
