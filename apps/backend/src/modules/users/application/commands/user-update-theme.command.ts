import { IdType } from '@/interfaces/id.type';
import { UserUpdateThemeInput } from '../../presentation/dtos';

export class UserUpdateThemeCommand {
  constructor(
    public readonly userId: IdType,
    public readonly payload: UserUpdateThemeInput,
  ) {}
}
