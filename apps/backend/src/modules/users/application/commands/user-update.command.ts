import { Command } from '@nestjs/cqrs';

import { IdType } from '@/interfaces/id.type';
import { UserDto, UserUpdateInput } from '../../presentation/dtos';

export class UserUpdateCommand extends Command<UserDto> {
  constructor(
    public readonly userId: IdType,
    public readonly payload: UserUpdateInput,
  ) {
    super();
  }
}
