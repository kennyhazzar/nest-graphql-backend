import { BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UserRepository } from '../../domain/repositories';
import { PasswordService } from '../../domain/services/password.service';
import { User } from '../../domain/entities';
import { UserCreateCommand } from '../commands';
import { UserDto } from '../../presentation/dtos';
import { UserMapper } from '../../presentation/mappers';

@CommandHandler(UserCreateCommand)
export class UserCreateHandler implements ICommandHandler<UserCreateCommand> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(command: UserCreateCommand): Promise<UserDto> {
    const { email, password, name, surname, middleName, phone, gender, birthday, roleId } = command.payload;

    const exists = await this.userRepository.existsByEmail(email);
    if (exists) {
      throw new BadRequestException('user.email.alreadyExists');
    }

    // Hash password before creating user entity
    const hashedPassword = await this.passwordService.hashPassword(password);

    const user = User.create({
      email,
      password: hashedPassword,
      name,
      surname,
      middleName,
      phone,
      gender,
      birthday,
      roleId,
      verified: true,
    });

    const created = await this.userRepository.create(user);
    return UserMapper.toDto(created);
  }
}
