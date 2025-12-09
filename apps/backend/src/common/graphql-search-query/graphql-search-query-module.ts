import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GraphqlSearchQuery } from './graphql-search-query';

@Global()
@Module({
  providers: [TypeOrmModule, GraphqlSearchQuery],
  exports: [GraphqlSearchQuery],
})
export class GraphqlSearchQueryModule {}
