import { Test, TestingModule } from '@nestjs/testing';
import { CqrsModule, QueryBus, CommandBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';

import { GraphqlSearchQuery } from '@/common/graphql-search-query';
import { CaslAbilityFactory } from '@/factories/casl-ability.factory';
import { PoliciesService } from '@/modules/users/infrastructure/services/policies.service';
import { AuthServiceAdapter } from '@/modules/users/infrastructure';

/**
 * Base class for unit test setup
 * Provides common mocks and utilities for testing GraphQL resolvers
 */
export abstract class BaseTestSetup {
  protected module!: TestingModule;
  protected queryBus!: QueryBus;
  protected commandBus!: CommandBus;

  /**
   * Creates base mocks for TypeORM repositories
   */
  protected createMockRepository() {
    return {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getOne: jest.fn().mockResolvedValue(null),
        getCount: jest.fn().mockResolvedValue(0),
      })),
    };
  }

  /**
   * Creates base mocks for services
   */
  protected createBaseMocks() {
    return {
      jwtService: {
        sign: jest.fn(),
        verify: jest.fn(),
      },
      graphqlSearchQuery: {
        create: jest.fn(),
      },
      authServiceAdapter: {
        validateUser: jest.fn(),
      },
      policiesService: {
        checkPermission: jest.fn(),
      },
      caslAbilityFactory: {
        createForUser: jest.fn(),
      },
    };
  }

  /**
   * Creates base module configuration for testing
   */
  protected createBaseModuleConfig(providers: any[] = []) {
    const baseMocks = this.createBaseMocks();

    return {
      imports: [CqrsModule],
      providers: [
        ...providers,
        { provide: JwtService, useValue: baseMocks.jwtService },
        { provide: GraphqlSearchQuery, useValue: baseMocks.graphqlSearchQuery },
        { provide: AuthServiceAdapter, useValue: baseMocks.authServiceAdapter },
        { provide: PoliciesService, useValue: baseMocks.policiesService },
        { provide: CaslAbilityFactory, useValue: baseMocks.caslAbilityFactory },
      ],
    };
  }

  /**
   * Initializes test module
   */
  protected async setupModule(config: any): Promise<void> {
    this.module = await Test.createTestingModule(config).compile();
    this.queryBus = this.module.get<QueryBus>(QueryBus);
    this.commandBus = this.module.get<CommandBus>(CommandBus);
  }

  /**
   * Clears all mocks
   */
  protected clearAllMocks(): void {
    jest.clearAllMocks();
  }

  /**
   * Closes test module
   */
  protected async cleanup(): Promise<void> {
    if (this.module) {
      await this.module.close();
    }
  }
}
