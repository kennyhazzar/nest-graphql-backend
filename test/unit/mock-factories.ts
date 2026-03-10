import {
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLResolveInfo,
  GraphQLSchema,
  Kind,
  OperationTypeNode,
} from 'graphql';
import { FastifyRequest } from 'fastify/types/request';
import { IncomingMessage } from 'http';
import { FastifyBaseLogger, FastifyInstance } from 'fastify';

import { Gender } from '@/enums/gender.enum';
import { Theme } from '@/enums/theme.enum';
import { RoleType } from '@/enums';
import { IdType } from '@/interfaces/id.type';
import { UserDto } from '@/modules/users/presentation/dtos/user.dto';
import { UserRoleDto } from '@/modules/users/presentation/dtos/user-role.dto';

/**
 * Factories for creating test data
 * Provides methods for creating mock objects of various types
 */

/**
 * Creates a mock user
 */
export const createMockUser = (overrides: Partial<UserDto> = {}): UserDto => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test',
  surname: 'User',
  middleName: 'Middle',
  gender: Gender.MALE,
  birthday: new Date('1990-01-01'),
  phone: '+7 (999) 123-45-67',
  verified: true,
  blocked: false,
  country: 'RU',
  language: 'ru',
  locale: 'ru-RU',
  theme: Theme.LIGHT,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-02'),
  ...overrides,
});

/**
 * Creates a mock role
 */
export const createMockRole = (overrides: Partial<UserRoleDto> = {}): UserRoleDto => ({
  id: 'role-1',
  name: 'Test Role',
  type: RoleType.ADMIN,
  description: 'Test role description',
  ...overrides,
});

/**
 * Creates a mock GraphQL info object
 */
export const createMockGraphQLInfo = (overrides: Partial<GraphQLResolveInfo> = {}): GraphQLResolveInfo => ({
  fieldName: 'testField',
  fieldNodes: [],
  returnType: {
    name: 'Test',
    description: 'Test',
    isTypeOf: jest.fn(),
    extensions: {},
    astNode: undefined,
    extensionASTNodes: [],
  } as unknown as GraphQLOutputType,
  parentType: {
    name: 'Test',
    description: 'Test',
    isTypeOf: jest.fn(),
    extensions: {},
    astNode: undefined,
    extensionASTNodes: [],
  } as unknown as GraphQLObjectType,
  path: { key: 'test', typename: 'Test', prev: undefined },
  schema: {
    description: '',
    extensions: {},
    astNode: undefined,
    extensionASTNodes: [],
    __validationErrors: [],
    _queryType: undefined,
    _mutationType: undefined,
    _subscriptionType: undefined,
    _directives: [],
    _typeMap: {},
    _implementationsMap: {},
    _subTypeMap: {},
    getQueryType: jest.fn(),
    getMutationType: jest.fn(),
    getSubscriptionType: jest.fn(),
    getDirectives: jest.fn(),
    getDirective: jest.fn(),
    getPossibleTypes: jest.fn(),
    getImplementations: jest.fn(),
    getRootType: jest.fn(),
    getTypeMap: jest.fn(),
    getType: jest.fn(),
    isSubType: jest.fn(),
    toConfig: jest.fn(),
  } as unknown as GraphQLSchema,
  fragments: {},
  rootValue: {},
  operation: {
    operation: OperationTypeNode.QUERY,
    name: { value: 'TestQuery', kind: Kind.NAME },
    kind: Kind.OPERATION_DEFINITION,
    selectionSet: { kind: Kind.SELECTION_SET, selections: [] },
  },
  variableValues: {},
  ...overrides,
});

/**
 * Creates a mock FastifyRequest
 */
export const createMockRequest = (overrides: Partial<FastifyRequest> = {}): FastifyRequest =>
  ({
    id: 'request-1',
    headers: {
      'content-type': 'application/json',
    },
    raw: {
      url: 'https://example.com',
      aborted: false,
      httpVersion: '1.1',
      httpVersionMajor: 1,
      httpVersionMinor: 1,
      complete: true,
    } as IncomingMessage,
    query: {},
    params: {},
    body: {},
    userId: 'user-1',
    ip: '127.0.0.1',
    method: 'GET',
    url: 'https://example.com',
    protocol: 'http',
    hostname: 'example.com',
    port: 80,
    server: {} as unknown as FastifyInstance,
    log: {} as unknown as FastifyBaseLogger,
    req: {} as IncomingMessage,
    ...overrides,
  }) as unknown as FastifyRequest;

/**
 * Creates a mock paginated response
 */
export const createMockPaginatedResponse = <T>(
  data: T[],
  overrides: Partial<{ nodes: T[]; totalCount: number }> = {},
) => ({
  nodes: data,
  totalCount: data.length,
  ...overrides,
});

/**
 * Creates a mock error
 */
export const createMockError = (message: string, code?: string): Error => {
  const error = new Error(message);
  if (code) {
    (error as any).code = code;
  }
  return error;
};

/**
 * Creates a mock JWT token
 */
export const createMockJwtToken = (): string => 'mock-jwt-token';

/**
 * Creates a mock refresh token
 */
export const createMockRefreshToken = (): string => 'mock-refresh-token';

/**
 * Creates a mock ID
 */
export const createMockId = (): IdType => 'mock-id-' + Math.random().toString(36).substr(2, 9);

/**
 * Creates a mock UUID
 */
export const createMockUuid = (): string => 'mock-uuid-' + Math.random().toString(36).substr(2, 9);
