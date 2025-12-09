import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuthServiceAdapter } from '../../infrastructure/adapters';
import { AccessFromRefreshTokenCommand } from '../commands';

@CommandHandler(AccessFromRefreshTokenCommand)
export class AccessFromRefreshTokenHandler implements ICommandHandler<AccessFromRefreshTokenCommand> {
  constructor(private readonly authService: AuthServiceAdapter) {}

  async execute(command: AccessFromRefreshTokenCommand): Promise<string> {
    return this.authService.generateAccessTokenFromRefreshToken(command.refreshToken);
  }
}
