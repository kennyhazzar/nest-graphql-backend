import { UserRoleCreateInput } from '../../presentation/dtos';

export class UserRoleCreateCommand {
  constructor(public readonly payload: UserRoleCreateInput) {}
}
