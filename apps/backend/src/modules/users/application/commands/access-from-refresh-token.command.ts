import { Command } from '@nestjs/cqrs';

export class AccessFromRefreshTokenCommand extends Command<string> {
  constructor(public readonly refreshToken: string) {
    super();
  }
}
