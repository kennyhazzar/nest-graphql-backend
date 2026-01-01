import { ObjectType, Field } from '@nestjs/graphql';

/**
 * Response DTO for magic link request
 */
@ObjectType('MagicLinkResponse')
export class MagicLinkResponseDto {
  @Field()
  success!: boolean;

  @Field({ nullable: true })
  message?: string;
}
