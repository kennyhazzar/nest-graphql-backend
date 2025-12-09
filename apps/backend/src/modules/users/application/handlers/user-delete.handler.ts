import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { Status } from '@/enums/status.enum';
import { UserRepository } from '../../domain/repositories';
import { UserDeleteCommand } from '../commands';

@CommandHandler(UserDeleteCommand)
export class UserDeleteHandler implements ICommandHandler<UserDeleteCommand> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: UserDeleteCommand): Promise<Status> {
    const result = await this.userRepository.delete(command.userId);
    return result.affected && result.affected > 0 ? Status.OK : Status.ERROR;
  }
}
