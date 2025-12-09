export const GRAPHQL_ENDPOINT = '/graphql';

/**
 * Wrapper for GraphQL queries in tests
 */
export interface GraphQLTestQuery {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

/**
 * Creates a GraphQL query for testing
 */
export function createGraphQLQuery(
  query: string,
  variables?: Record<string, any>,
  operationName?: string,
): GraphQLTestQuery {
  return {
    query: query.trim(),
    variables,
    operationName,
  };
}

/**
 * Basic GraphQL queries for testing
 */
export const TestQueries = {
  introspection: createGraphQLQuery(`
    query IntrospectionQuery {
      __schema {
        queryType { name }
        mutationType { name }
        subscriptionType { name }
      }
    }
  `),

  basicQuery: createGraphQLQuery(`
    query {
      __typename
    }
  `),

  invalidQuery: createGraphQLQuery(`
    query {
      invalidField {
    }
  `),

  nonExistentField: createGraphQLQuery(`
    query {
      nonExistentField
    }
  `),
};
