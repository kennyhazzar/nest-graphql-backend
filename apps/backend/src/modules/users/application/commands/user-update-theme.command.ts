import { Command } from '@nestjs/cqrs';

import { IdType } from '@/interfaces/id.type';
import { UserDto, UserUpdateThemeInput } from '../../presentation/dtos';

export class UserUpdateThemeCommand extends Command<UserDto> {
  constructor(
    public readonly userId: IdType,
    public readonly payload: UserUpdateThemeInput,
  ) {
    super();
  }
}
