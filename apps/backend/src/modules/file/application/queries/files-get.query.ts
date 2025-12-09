import { Query } from '@nestjs/cqrs';
import { GraphQLResolveInfo } from 'graphql';

import { IdType } from '@/interfaces/id.type';
import { SearchQuery } from '@/common/graphql-search-query';
import { FilesDto } from '../../presentation/dtos/file.dto';
import { FileEntity } from '../../infrastructure';
import { RoleType } from '@/enums/role-type.enum';

export class FilesGetQuery extends Query<FilesDto> {
  constructor(
    public readonly params: {
      currentRoleId: IdType;
      currentUserId: IdType;
      currentRoleType?: RoleType;
      payload?: SearchQuery<FileEntity>;
      info?: GraphQLResolveInfo;
    },
  ) {
    super();
  }
}
