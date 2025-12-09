import { IdType } from '@/interfaces/id.type';
import { UserUpdateInput } from '../../presentation/dtos';

export class UserUpdateCommand {
  constructor(
    public readonly userId: IdType,
    public readonly payload: UserUpdateInput,
  ) {}
}
