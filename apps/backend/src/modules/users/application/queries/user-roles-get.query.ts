import { Query } from '@nestjs/cqrs';

import { UserRolesDto } from '../../presentation/dtos';
import { UserRoleFilter } from '../../domain/repositories/user-role.filter';

export class UserRolesGetQuery extends Query<UserRolesDto> {
  constructor(public readonly filter?: UserRoleFilter) {
    super();
  }
}
