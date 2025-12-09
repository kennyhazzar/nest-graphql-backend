import { UnauthorizedException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UserRepository } from '../../domain/repositories';
import { AuthServiceAdapter } from '../../infrastructure/adapters';
import { UserLoginCommand } from '../commands';
import { User } from '../../domain/entities';

@CommandHandler(UserLoginCommand)
export class LoginUserHandler implements ICommandHandler<UserLoginCommand> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authService: AuthServiceAdapter,
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

    if (!AuthServiceAdapter.validateCredentials(user.password, password)) {
      throw new UnauthorizedException('user.auth.password_mismatched');
    }

    if (!user.verified) {
      throw new UnauthorizedException('user.auth.verified');
    }

    if (user.blocked) {
      throw new UnauthorizedException('user.auth.blocked');
    }

    return user;
  }
}
