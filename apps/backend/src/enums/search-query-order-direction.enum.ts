import { registerEnumType } from '@nestjs/graphql';

// This enum defines the possible directions for sorting search results in GraphQL queries.
// It can be either ascending (ASC) or descending (DESC).
export enum SearchQueryOrderDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

registerEnumType(SearchQueryOrderDirection, {
  name: 'SearchQueryOrderDirection',
  description: 'Order for GraphQL search queries',
  valuesMap: {
    ASC: { description: 'Ascending' },
    DESC: { description: 'Descending' },
  },
});
