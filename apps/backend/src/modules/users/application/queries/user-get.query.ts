import { FindOneOptions } from 'typeorm';
import { UserEntity } from '../../infrastructure/entity';

export class UserGetQuery {
  constructor(public readonly options: FindOneOptions<UserEntity>) {}
}
