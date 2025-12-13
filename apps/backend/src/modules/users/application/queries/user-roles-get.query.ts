import { Query } from '@nestjs/cqrs';
import { FindManyOptions } from 'typeorm';

import { UserRolesDto } from '../../presentation/dtos';
import { UserRoleEntity } from '../../infrastructure/entity';

export class UserRolesGetQuery extends Query<UserRolesDto> {
  constructor(public readonly options?: FindManyOptions<UserRoleEntity>) {
    super();
  }
}
