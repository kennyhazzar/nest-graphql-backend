import { UserLoginInput } from '../../presentation/dtos';

export class UserLoginCommand {
  constructor(public readonly payload: UserLoginInput) {}
}
