import { Command } from '@nestjs/cqrs';

import { IdType } from '@/interfaces/id.type';
import { UserRoleDto, UserRoleUpdateInput } from '../../presentation/dtos';

export class UserRoleUpdateCommand extends Command<UserRoleDto> {
  constructor(
    public readonly roleId: IdType,
    public readonly payload: UserRoleUpdateInput,
  ) {
    super();
  }
}
