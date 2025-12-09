import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UserRepository } from '../../domain/repositories';
import { UserUpdateCommand } from '../commands';
import { UserDto } from '../../presentation/dtos';
import { UserMapper } from '../../presentation/mappers';

@CommandHandler(UserUpdateCommand)
export class UserUpdateHandler implements ICommandHandler<UserUpdateCommand> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: UserUpdateCommand): Promise<UserDto> {
    const { userId, payload } = command;

    await this.userRepository.update(userId, payload);

    const updated = await this.userRepository.findById(userId);
    if (!updated) {
      throw new NotFoundException('user.notFound');
    }

    return UserMapper.toDto(updated);
  }
}
