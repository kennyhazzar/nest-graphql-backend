import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { UserRoleRepository } from '../../domain/repositories';
import { UserRolesGetQuery } from '../queries';
import { UserRolesDto } from '../../presentation/dtos';
import { UserRoleMapper } from '../../presentation/mappers';

@QueryHandler(UserRolesGetQuery)
export class UserRolesGetHandler implements IQueryHandler<UserRolesGetQuery> {
  constructor(private readonly userRoleRepository: UserRoleRepository) {}

  async execute(query: UserRolesGetQuery): Promise<UserRolesDto> {
    const roles = await this.userRoleRepository.find(query.options);
    return UserRoleMapper.toDtoList(roles);
  }
}
