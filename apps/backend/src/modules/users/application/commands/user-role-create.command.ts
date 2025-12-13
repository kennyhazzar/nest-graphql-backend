import { Command } from '@nestjs/cqrs';

import { UserRoleCreateInput, UserRoleDto } from '../../presentation/dtos';

export class UserRoleCreateCommand extends Command<UserRoleDto> {
  constructor(public readonly payload: UserRoleCreateInput) {
    super();
  }
}
