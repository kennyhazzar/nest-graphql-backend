import { FindManyOptions } from 'typeorm';
import { UserRoleEntity } from '../../infrastructure/entity';

export class UserRolesGetQuery {
  constructor(public readonly options?: FindManyOptions<UserRoleEntity>) {}
}
