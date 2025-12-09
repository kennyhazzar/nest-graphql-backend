import { ObjectType, Field, ID } from '@nestjs/graphql';

import { IdType } from '@/interfaces/id.type';
import { RoleType } from '@/enums/role-type.enum';
import { Paginated } from '@/common/Paginated';

@ObjectType('UserRole')
export class UserRoleDto {
  @Field(() => ID)
  id!: IdType;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => RoleType)
  type!: RoleType;

  @Field(() => Date, { nullable: true })
  createdAt?: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date;
}

@ObjectType('UserRoles')
export class UserRolesDto extends Paginated(UserRoleDto) {}
