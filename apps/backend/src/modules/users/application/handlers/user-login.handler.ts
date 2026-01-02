import { Logger, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UserRepository } from '../../domain/repositories';
import { AuthServiceAdapter } from '../../infrastructure/adapters';
import { PasswordService } from '../../domain/services/password.service';
import { UserLoginCommand } from '../commands';
import { User } from '../../domain/entities';

@CommandHandler(UserLoginCommand)
export class LoginUserHandler implements ICommandHandler<UserLoginCommand> {
  private readonly logger = new Logger(LoginUserHandler.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly authService: AuthServiceAdapter,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(command: UserLoginCommand): Promise<User> {
    const { email, password } = command.payload;

    const user = await this.userRepository.findByEmail(email, {
      select: {
        id: true,
        email: true,
        password: true,
        verified: true,
        blocked: true,
        name: true,
        surname: true,
        middleName: true,
        phone: true,
        gender: true,
        birthday: true,
        country: true,
        language: true,
        locale: true,
        theme: true,
        roleId: true,
        createdAt: true,
        updatedAt: true,
      },
      loadEagerRelations: true,
    });

    if (!user) {
      throw new UnauthorizedException('user.auth.invalidCredentials');
    }

    if (!user.verified) {
      throw new UnauthorizedException('user.auth.verified');
    }

    if (user.blocked) {
      throw new UnauthorizedException('user.auth.blocked');
    }

    // If user has no password set, treat as invalid credentials (don't reveal account details)
    if (!user.password) {
      throw new UnauthorizedException('user.auth.invalidCredentials');
    }

    const valid = await this.passwordService.verifyPassword(user.password, password);
    if (!valid) {
      throw new UnauthorizedException('user.auth.password_mismatched');
    }

    // Smooth migration: rehash legacy passwords to Argon2id
    if (this.passwordService.needsRehash(user.password)) {
      const newHash = await this.passwordService.hashPassword(password);
      await this.userRepository.update(user.id, { password: newHash });
      this.logger.debug(`Migrated password hash for user "${email}" from HMAC-SHA256 to Argon2id`);
    }

    return user;
  }
}
