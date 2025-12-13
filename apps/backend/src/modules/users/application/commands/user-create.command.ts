import { Command } from '@nestjs/cqrs';

import { UserCreateInput, UserDto } from '../../presentation/dtos';

export class UserCreateCommand extends Command<UserDto> {
  constructor(public readonly payload: UserCreateInput) {
    super();
  }
}
