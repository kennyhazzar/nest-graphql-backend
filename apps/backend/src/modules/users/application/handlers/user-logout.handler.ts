import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuthServiceAdapter } from '../../infrastructure/adapters';
import { UserLogoutCommand } from '../commands';

@CommandHandler(UserLogoutCommand)
export class UserLogoutHandler implements ICommandHandler<UserLogoutCommand> {
  constructor(private readonly authService: AuthServiceAdapter) {}

  async execute(command: UserLogoutCommand): Promise<boolean> {
    return this.authService.revokeRefreshToken(command.refreshToken);
  }
}
