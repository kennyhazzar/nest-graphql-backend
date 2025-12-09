import { IdType } from '@/interfaces/id.type';
import { UserRoleUpdateInput } from '../../presentation/dtos';

export class UserRoleUpdateCommand {
  constructor(
    public readonly roleId: IdType,
    public readonly payload: UserRoleUpdateInput,
  ) {}
}
