import { join as pathJoin } from 'node:path';
import { NestApplication, NestFactory } from '@nestjs/core';
import { I18nValidationPipe } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import helmet, { FastifyHelmetOptions } from '@fastify/helmet';
import fastifyStatic from '@fastify/static';
import mercuriusUpload from 'mercurius-upload';

import { AppModule } from './app.module';
import { AllExceptionFilter } from './exceptions';
import { LoggerInterceptor } from './interceptors';

void (async () => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      // Trust proxy headers for correct IP detection behind load balancers
      trustProxy: true,
      // Increase request timeout for file uploads
      requestTimeout: 300000, // 5 minutes
      bodyLimit: 1024 * 1024 * 50, // 50MB body limit
    }),
    {
      bufferLogs: false,
      autoFlushLogs: true,
    },
  );

  const httpServer = app.getHttpAdapter();
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.flushLogs();

  const configService = app.get(ConfigService);
  const environment = configService.getOrThrow('host.environment');

  // Setup origin for CORS and CSP
  const origin: string[] = [configService.getOrThrow('host.origin')];
  if (environment !== 'production') {
    origin.push('http://localhost:8080');
  }

  // CORS configuration
  const corsEnabled = configService.get<boolean>('cors.enabled', true);
  if (corsEnabled) {
    app.enableCors({
      origin,
      credentials: configService.get<boolean>('cors.credentials', true),
      methods: configService.get<string[]>('cors.methods', ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']),
      allowedHeaders: configService.get<string[]>('cors.allowedHeaders', [
        'Content-Type',
        'Authorization',
        'Accept',
        'X-Requested-With',
      ]),
    });
  }

  const defaultSrc: string[] = [`'self'`];
  const styleSrc: string[] = [`'self'`, `'unsafe-inline'`];
  const fontSrc: string[] = [`'self'`, 'data:'];
  const imgSrc: string[] = [`'self'`, 'data:'];
  const scriptSrc: string[] = [`'self'`, `https: 'unsafe-inline'`, `'unsafe-eval'`];
  const crossOriginResourcePolicy: FastifyHelmetOptions['crossOriginResourcePolicy'] = { policy: 'cross-origin' };

  if (configService.getOrThrow('graphql.graphiql')) {
    defaultSrc.push('unpkg.com');
    styleSrc.push('cdn.jsdelivr.net', 'fonts.googleapis.com', 'unpkg.com');
    fontSrc.push('fonts.gstatic.com');
    imgSrc.push('cdn.jsdelivr.net');
    scriptSrc.push('cdn.jsdelivr.net');
  }
  if (Array.isArray(origin)) {
    defaultSrc.push(...origin);
  } else {
    defaultSrc.push(origin);
  }
  if (environment !== 'production') {
    defaultSrc.push('http://localhost:8080');
  }

  await app.register(helmet, {
    contentSecurityPolicy: { directives: { defaultSrc, styleSrc, fontSrc, imgSrc, scriptSrc } },
    crossOriginResourcePolicy,
  });
  await app.register(fastifyStatic, { root: pathJoin(process.cwd(), 'upload'), prefix: '/' });
  await app.register(mercuriusUpload, {
    maxFileSize: 1024 * 1024 * 50, // 50 MB
    maxFiles: 10,
  });

  const port = configService.get<number>('host.port', 3000);
  const hostname = configService.get<string>('host.hostname', 'localhost');

  app.useGlobalPipes(
    new I18nValidationPipe({
      transform: true,
      whitelist: false,
    }),
  );
  app.useGlobalInterceptors(new LoggerInterceptor());
  app.useGlobalFilters(new AllExceptionFilter(httpServer));

  await app.listen(port, hostname);
  logger.log(
    `Application is running on: "http://${hostname}:${port}/" on environment: "${environment}"`,
    NestApplication.name,
  );
})();
