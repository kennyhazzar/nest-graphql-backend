import { FindManyOptions } from 'typeorm';
import { UserEntity } from '../../infrastructure/entity';

export class UsersGetQuery {
  constructor(public readonly options?: FindManyOptions<UserEntity>) {}
}
