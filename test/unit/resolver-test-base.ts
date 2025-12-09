import { BaseTestSetup } from './base-test-setup';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { GraphQLResolveInfo } from 'graphql';

/**
 * Base class for testing GraphQL resolvers
 * Extends BaseTestSetup with additional utilities for resolvers
 */
export abstract class ResolverTestBase extends BaseTestSetup {
  declare protected queryBus: QueryBus;
  declare protected commandBus: CommandBus;

  /**
   * Mocks command execution through CommandBus
   */
  protected mockCommandExecution<T>(result: T): jest.SpyInstance {
    return jest.spyOn(this.commandBus, 'execute').mockResolvedValue(result);
  }

  /**
   * Mocks query execution through QueryBus
   */
  protected mockQueryExecution<T>(result: T): jest.SpyInstance {
    return jest.spyOn(this.queryBus, 'execute').mockResolvedValue(result);
  }

  /**
   * Mocks command execution error
   */
  protected mockCommandError(error: Error): jest.SpyInstance {
    return jest.spyOn(this.commandBus, 'execute').mockRejectedValue(error);
  }

  /**
   * Mocks query execution error
   */
  protected mockQueryError(error: Error): jest.SpyInstance {
    return jest.spyOn(this.queryBus, 'execute').mockRejectedValue(error);
  }

  /**
   * Verifies that command was executed with correct parameters
   */
  protected expectCommandToBeExecuted(commandClass: any, params?: any): void {
    expect(this.commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        ...(params && { ...params }),
      }),
    );
  }

  /**
   * Verifies that query was executed with correct parameters
   */
  protected expectQueryToBeExecuted(queryClass: any, params?: any): void {
    expect(this.queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        ...(params && { ...params }),
      }),
    );
  }

  /**
   * Creates a mock GraphQL Info object
   */
  protected createMockGraphQLInfo(): GraphQLResolveInfo {
    return {
      fieldName: 'testField',
      fieldNodes: [],
      returnType: {} as any,
      parentType: {} as any,
      path: { key: 'test', typename: 'Test', prev: undefined },
      schema: {} as any,
      fragments: {},
      rootValue: {},
      operation: { operation: 'query', name: { value: 'TestQuery' } } as any,
      variableValues: {},
      cacheControl: { cacheHint: {} },
    } as GraphQLResolveInfo;
  }

  /**
   * Creates a mock FastifyRequest
   */
  protected createMockRequest(): any {
    return {
      headers: {},
      query: {},
      params: {},
      body: {},
      user: null,
    };
  }

  /**
   * Verifies that result matches expected
   */
  protected expectResult<T>(result: T, expected: T): void {
    expect(result).toEqual(expected);
  }

  /**
   * Verifies that an error was thrown
   */
  protected async expectError<T>(asyncFunction: () => Promise<T>, expectedError?: string | RegExp): Promise<void> {
    if (expectedError) {
      await expect(asyncFunction).rejects.toThrow(expectedError);
    } else {
      await expect(asyncFunction).rejects.toThrow();
    }
  }

  /**
   * Verifies that method was called specific number of times
   */
  protected expectMethodToBeCalledTimes(method: jest.SpyInstance, times: number): void {
    expect(method).toHaveBeenCalledTimes(times);
  }

  /**
   * Verifies that method was not called
   */
  protected expectMethodNotToBeCalled(method: jest.SpyInstance): void {
    expect(method).not.toHaveBeenCalled();
  }

  /**
   * Verifies that method was called with specific arguments
   */
  protected expectMethodToBeCalledWith(method: jest.SpyInstance, ...args: any[]): void {
    expect(method).toHaveBeenCalledWith(...args);
  }

  /**
   * Verifies that method was called with object containing specific properties
   */
  protected expectMethodToBeCalledWithObject(method: jest.SpyInstance, object: any): void {
    expect(method).toHaveBeenCalledWith(expect.objectContaining(object));
  }
}
