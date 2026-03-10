import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { UserRepository } from '../../domain/repositories';
import { UsersGetQuery } from '../queries';
import { UsersDto } from '../../presentation/dtos';
import { UserMapper } from '../../presentation/mappers';

@QueryHandler(UsersGetQuery)
export class UsersGetHandler implements IQueryHandler<UsersGetQuery> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: UsersGetQuery): Promise<UsersDto> {
    const users = await this.userRepository.find(query.filter);
    return UserMapper.toDtoList(users);
  }
}
