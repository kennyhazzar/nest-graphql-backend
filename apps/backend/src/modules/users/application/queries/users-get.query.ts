import { Query } from '@nestjs/cqrs';
import { FindManyOptions } from 'typeorm';

import { UsersDto } from '../../presentation/dtos';
import { UserEntity } from '../../infrastructure/entity';

export class UsersGetQuery extends Query<UsersDto> {
  constructor(public readonly options?: FindManyOptions<UserEntity>) {
    super();
  }
}
