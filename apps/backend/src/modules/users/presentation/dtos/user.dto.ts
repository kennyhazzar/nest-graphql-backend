import { ObjectType, Field, ID } from '@nestjs/graphql';

import { IdType } from '@/interfaces/id.type';
import { Gender } from '@/enums/gender.enum';
import { Theme } from '@/enums/theme.enum';
import { Paginated } from '@/common/Paginated';
import { UserRoleDto } from './user-role.dto';

@ObjectType('User')
export class UserDto {
  @Field(() => ID)
  id!: IdType;

  @Field()
  email!: string;

  @Field()
  name!: string;

  @Field()
  surname!: string;

  @Field({ nullable: true })
  middleName?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field(() => Gender)
  gender!: Gender;

  @Field(() => Date, { nullable: true })
  birthday?: Date;

  @Field()
  verified!: boolean;

  @Field()
  blocked!: boolean;

  @Field()
  country!: string;

  @Field()
  language!: string;

  @Field()
  locale!: string;

  @Field(() => Theme)
  theme!: Theme;

  @Field(() => UserRoleDto, { nullable: true })
  role?: UserRoleDto;

  @Field(() => Date, { nullable: true })
  createdAt?: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date;
}

@ObjectType('Users')
export class UsersDto extends Paginated(UserDto) {}
