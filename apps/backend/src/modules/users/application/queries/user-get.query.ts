import { Query } from '@nestjs/cqrs';
import { FindOneOptions } from 'typeorm';

import { UserDto } from '../../presentation/dtos';
import { UserEntity } from '../../infrastructure/entity';

export class UserGetQuery extends Query<UserDto> {
  constructor(public readonly options: FindOneOptions<UserEntity>) {
    super();
  }
}
