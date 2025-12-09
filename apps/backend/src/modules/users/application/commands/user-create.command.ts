import { UserCreateInput } from '../../presentation/dtos';

export class UserCreateCommand {
  constructor(public readonly payload: UserCreateInput) {}
}
