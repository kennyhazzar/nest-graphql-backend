import { InputType, Field, ID } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { IdType } from '@/interfaces/id.type';
import { Gender } from '@/enums/gender.enum';
import { Theme } from '@/enums/theme.enum';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,32}$/;

@InputType('UserLoginInput')
export class UserLoginInput {
  @Field()
  @IsEmail({}, { message: i18nValidationMessage('validation.IS_EMAIL') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  email!: string;

  @Field()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  password!: string;
}

@InputType('UserCreateInput')
export class UserCreateInput {
  @Field()
  @IsEmail({}, { message: i18nValidationMessage('validation.IS_EMAIL') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  email!: string;

  @Field()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MinLength(8, { message: i18nValidationMessage('validation.PASSWORD_MIN_LENGTH') })
  @MaxLength(32, { message: i18nValidationMessage('validation.PASSWORD_MAX_LENGTH') })
  @Matches(PASSWORD_REGEX, { message: i18nValidationMessage('validation.PASSWORD_TOO_WEAK') })
  password!: string;

  @Field()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  name!: string;

  @Field()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  surname!: string;

  @Field({ nullable: true })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsOptional()
  middleName?: string;

  @Field({ nullable: true })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsOptional()
  phone?: string;

  @Field(() => Gender, { nullable: true })
  @IsEnum(Gender, { message: i18nValidationMessage('validation.IS_ENUM') })
  @IsOptional()
  gender?: Gender;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  birthday?: Date;

  @Field(() => ID)
  @IsUUID('4', { message: i18nValidationMessage('validation.IS_UUID') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  roleId!: IdType;
}

@InputType('UserUpdateInput')
export class UserUpdateInput {
  @Field({ nullable: true })
  @IsEmail({}, { message: i18nValidationMessage('validation.IS_EMAIL') })
  @IsOptional()
  email?: string;

  @Field({ nullable: true })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsOptional()
  surname?: string;

  @Field({ nullable: true })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsOptional()
  middleName?: string;

  @Field({ nullable: true })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsOptional()
  phone?: string;

  @Field(() => Gender, { nullable: true })
  @IsEnum(Gender, { message: i18nValidationMessage('validation.IS_ENUM') })
  @IsOptional()
  gender?: Gender;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  birthday?: Date;

  @Field(() => ID, { nullable: true })
  @IsUUID('4', { message: i18nValidationMessage('validation.IS_UUID') })
  @IsOptional()
  roleId?: IdType;

  @Field({ nullable: true })
  @IsOptional()
  blocked?: boolean;
}

@InputType('UserUpdateThemeInput')
export class UserUpdateThemeInput {
  @Field(() => Theme)
  @IsEnum(Theme, { message: i18nValidationMessage('validation.IS_ENUM') })
  theme!: Theme;
}

@InputType('RefreshTokenInput')
export class RefreshTokenInput {
  @Field()
  @IsString({ message: i18nValidationMessage('validation.IS_DEFINED_REFRESH') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_DEFINED_REFRESH') })
  refreshToken!: string;
}
