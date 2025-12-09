import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';

import { GraphqlSearchQuery } from '@/common/graphql-search-query';
import { FilesGetQuery } from '../queries';
import { FileMapper, FilesDto } from '../../presentation';
import { FileRepository } from '../../domain/repositories';
import { FileEntity } from '../../infrastructure';

@QueryHandler(FilesGetQuery)
export class FilesGetHandler implements IQueryHandler<FilesGetQuery> {
  constructor(
    private readonly repo: FileRepository,
    private readonly graphqlSearchQuery: GraphqlSearchQuery,
  ) {}

  async execute({ params: { payload, info } }: FilesGetQuery): Promise<FilesDto> {
    const query = this.graphqlSearchQuery.normalize(FileEntity, {
      payload,
      info,
    });

    const files = await this.repo.find(query);

    return FileMapper.toDtoList(files['nodes'], files['totalCount']);
  }
}
