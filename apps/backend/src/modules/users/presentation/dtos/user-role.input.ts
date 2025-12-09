import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { RoleType } from '@/enums/role-type.enum';

@InputType('UserRoleCreateInput')
export class UserRoleCreateInput {
  @Field()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  name!: string;

  @Field({ nullable: true })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsOptional()
  description?: string;

  @Field(() => RoleType)
  @IsEnum(RoleType, { message: i18nValidationMessage('validation.IS_ENUM') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  type!: RoleType;
}

@InputType('UserRoleUpdateInput')
export class UserRoleUpdateInput {
  @Field({ nullable: true })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsOptional()
  description?: string;

  @Field(() => RoleType, { nullable: true })
  @IsEnum(RoleType, { message: i18nValidationMessage('validation.IS_ENUM') })
  @IsOptional()
  type?: RoleType;
}
