import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { FilesUploadCommand } from '../commands/files-upload.command';
import { FileRepository } from '../../domain/repositories/file.repository';
import { FileMapper, FilesDto } from '../../presentation';

@CommandHandler(FilesUploadCommand)
export class FilesUploadHandler implements ICommandHandler<FilesUploadCommand, FilesDto> {
  constructor(private readonly repo: FileRepository) {}

  async execute({ params: { currentUserId, payload } }: FilesUploadCommand): Promise<FilesDto> {
    const files = await this.repo.uploads(currentUserId, payload);
    const filesDto = FileMapper.toDtoList(files['nodes'], files['totalCount']);
    return filesDto;
  }
}
