import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Input DTO for requesting a magic link
 */
@InputType('MagicLinkRequestInput')
export class MagicLinkRequestInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

/**
 * Input DTO for authenticating with a magic link
 */
@InputType('MagicLinkAuthenticateInput')
export class MagicLinkAuthenticateInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  token!: string;
}
