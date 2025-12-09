import { NotFoundException } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';

import { FileGetByIdQuery } from '../queries/file-get-by-id.query';
import { FileRepository } from '../../domain/repositories/file.repository';
import { FileDto, FileMapper } from '../../presentation';

@QueryHandler(FileGetByIdQuery)
export class FileGetByIdHandler implements IQueryHandler<FileGetByIdQuery> {
  constructor(private readonly repo: FileRepository) {}

  async execute({ payload }: FileGetByIdQuery): Promise<FileDto> {
    const entity = await this.repo.findById(payload.id);
    if (!entity) {
      throw new NotFoundException(`File with ID ${payload.id} not found`);
    }
    return FileMapper.toDto(entity);
  }
}
