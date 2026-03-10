import { Query } from '@nestjs/cqrs';

import { UsersDto } from '../../presentation/dtos';
import { UserFilter } from '../../domain/repositories/user.filter';

export class UsersGetQuery extends Query<UsersDto> {
  constructor(public readonly filter?: UserFilter) {
    super();
  }
}
