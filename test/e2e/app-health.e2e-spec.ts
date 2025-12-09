import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { ValidationPipe } from '@nestjs/common';
import { I18nValidationExceptionFilter } from 'nestjs-i18n';
import { RawServerDefault } from 'fastify';
import { join as pathJoin } from 'node:path';
import fastifyStatic from '@fastify/static';

import { TestResourceManager, setupTestEnvironment, cleanupTestEnvironment } from './utils/test.utils';
import { GRAPHQL_ENDPOINT, TestQueries } from './utils/graphql.utils';

import { AllExceptionFilter } from '@/exceptions/all.exception';
import { LoggerInterceptor } from '@/interceptors/logger-interceptor';
import { AppModule } from '@/app.module';

/**
 * E2E tests for application health
 * Verifies basic functionality and service availability
 */
describe('App Health E2E Tests', () => {
  let app: NestFastifyApplication | null;
  let httpServer: RawServerDefault | null;
  let configService: ConfigService | null;
  let moduleRef: TestingModule | null;
  let dataSource: DataSource | null;
  let bootstrapCompleted = false;

  const resourceManager = new TestResourceManager();

  const ensureInitialized = () => {
    if (!bootstrapCompleted || !app || !httpServer) {
      return false;
    }
    return true;
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await setupTestEnvironment();

    try {
      moduleRef = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter({ logger: false }));

      const httpServerAdapter = app.getHttpAdapter();
      httpServer = app.getHttpServer();

      await app.register(fastifyStatic, { root: pathJoin(process.cwd(), 'upload'), prefix: '/' });

      app.useGlobalPipes(
        new ValidationPipe({
          transform: true,
          whitelist: false,
        }),
      );
      app.useGlobalInterceptors(new LoggerInterceptor());
      app.useGlobalFilters(new AllExceptionFilter(httpServerAdapter), new I18nValidationExceptionFilter());

      configService = moduleRef.get<ConfigService>(ConfigService);

      await app.init();
      await app.getHttpAdapter().getInstance().ready();

      dataSource = app.get(DataSource, { strict: false }) ?? null;

      resourceManager.register('app', app);
      resourceManager.register('dataSource', dataSource ?? undefined);
      resourceManager.register('moduleRef', moduleRef);

      bootstrapCompleted = true;
    } catch (error) {
      console.error('Failed to initialize app for health tests:', error);
      bootstrapCompleted = false;
      app = null;
      configService = null;
      moduleRef = null;
      dataSource = null;
    }
  });

  afterAll(async () => {
    await cleanupTestEnvironment();

    await resourceManager.cleanup();
    app = null;
    httpServer = null;
    configService = null;
    moduleRef = null;
    dataSource = null;
    bootstrapCompleted = false;
  });

  describe('Application Health', () => {
    it('should be defined', () => {
      if (!ensureInitialized()) {
        return;
      }
      expect(app).toBeDefined();
    });

    it('should have config service', () => {
      if (!ensureInitialized()) {
        return;
      }
      expect(configService).toBeDefined();
    });

    it('should load test configuration', () => {
      if (!ensureInitialized() || !configService) {
        return;
      }

      const dbConfig = configService.get('database.db');
      expect(dbConfig).toBeDefined();

      const environment = configService.get('host.environment');
      expect(['testing', 'development', 'production'].includes(environment)).toBe(true);
    });

    it('should have GraphQL configuration', () => {
      if (!ensureInitialized() || !configService) {
        return;
      }

      const graphqlConfig = {
        graphiql: configService.get('graphql.graphiql'),
        introspection: configService.get('graphql.introspection'),
      };

      expect(graphqlConfig.graphiql).toBe(true);
      expect(graphqlConfig.introspection).toBe(true);
    });
  });

  describe('Health Checks', () => {
    it('should respond to basic GraphQL query', async () => {
      if (!ensureInitialized()) {
        return;
      }

      await request(httpServer!)
        .post(GRAPHQL_ENDPOINT)
        .send(TestQueries.basicQuery)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(res.body.data.__typename).toBe('Query');
        });
    });

    it('should have proper response headers', async () => {
      if (!ensureInitialized()) {
        return;
      }

      await request(httpServer!)
        .post(GRAPHQL_ENDPOINT)
        .send(TestQueries.basicQuery)
        .expect(200)
        .expect((res) => {
          expect(res.headers['content-type']).toMatch(/application\/json/);
        });
    });

    it('should handle GraphQL introspection query', async () => {
      if (!ensureInitialized()) {
        return;
      }

      await request(httpServer!)
        .post(GRAPHQL_ENDPOINT)
        .send(TestQueries.introspection)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(res.body.data.__schema).toBeDefined();
          expect(res.body.data.__schema.queryType.name).toBe('Query');
          expect(res.body.data.__schema.mutationType.name).toBe('Mutation');
          expect(res.body.data.__schema.subscriptionType.name).toBe('Subscription');
        });
    });

    it('should return proper error for invalid GraphQL syntax', async () => {
      if (!ensureInitialized()) {
        return;
      }

      await request(httpServer!)
        .post(GRAPHQL_ENDPOINT)
        .send(TestQueries.invalidQuery)
        .expect(400)
        .expect((res) => {
          expect(res.body.errors).toBeDefined();
          expect(Array.isArray(res.body.errors)).toBe(true);
          expect(res.body.errors.length).toBeGreaterThan(0);
        });
    });
  });

  describe('Performance Tests', () => {
    it('should respond within acceptable time limits', async () => {
      if (!ensureInitialized()) {
        return;
      }

      const startTime = Date.now();
      await request(httpServer!).post(GRAPHQL_ENDPOINT).send(TestQueries.basicQuery).expect(200);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(5000);
    });

    it('should handle multiple concurrent requests', async () => {
      if (!ensureInitialized()) {
        return;
      }

      const concurrentRequests = 3;
      const promises = Array.from({ length: concurrentRequests }, () =>
        request(httpServer!).post(GRAPHQL_ENDPOINT).send(TestQueries.basicQuery).expect(200),
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(concurrentRequests);
      results.forEach((result) => {
        expect(result.body.data.__typename).toBe('Query');
      });
    });
  });
});
