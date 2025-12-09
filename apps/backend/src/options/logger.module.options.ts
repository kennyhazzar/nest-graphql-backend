import { join as pathJoin } from 'node:path';
import { ConfigService } from '@nestjs/config';
import type { ClientOptions as ElasticClientOptions } from '@elastic/elasticsearch';
import type { PrettyOptions } from 'pino-pretty';
import type pino from 'pino';
import type { LevelWithSilent } from 'pino';
import { Params as NestPinoParams } from 'nestjs-pino';
import type { GelfOptions } from '@/utils/pino-gelf.mts';

export const LoggerModuleOptions = async (configService: ConfigService): Promise<NestPinoParams> => {
  const targets: pino.TransportTargetOptions[] = [];

  // Pretty-print
  const prettyPrint: pino.TransportTargetOptions<PrettyOptions> = {
    target: process.env.NODE_ENV === 'test' ? 'pino-pretty' : `${__dirname}/../utils/pino-pretty.cjs`,
    options: {
      colorize: configService.get<boolean>('log.colorize', true),
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
      singleLine: true,
      ignore: 'pid,hostname',
    },
    level: configService.getOrThrow<LevelWithSilent>('log.level'),
  };
  targets.push(prettyPrint);

  // GELF transport for Graylog
  const graylogEnabled = configService.get<boolean>('graylog.enabled', true);
  const graylogHost = configService.get<string>('graylog.host');
  const graylogPort = configService.get<number>('graylog.port');
  if (graylogEnabled && graylogHost && graylogPort && process.env.NODE_ENV !== 'test') {
    const gelf: pino.TransportTargetOptions<GelfOptions> = {
      target: pathJoin(__dirname, '../utils/pino-gelf.mjs'),
      options: {
        host: graylogHost,
        port: graylogPort,
        destination: 1,
        protocol: configService.get<'udp' | 'tcp'>('graylog.protocol', 'udp'),
        facility: configService.get<string>('graylog.facility', 'backend'),
        hostname: configService.get<string>('host.hostname', process.env.HOSTNAME || 'localhost'),
        environment: configService.get<string>('host.environment', 'development'),
        compression: configService.get<boolean>('graylog.compression', true),
        maxChunkSize: configService.get<number>('graylog.maxChunkSize', 8192),
      },
      level: 'trace',
    };
    targets.push(gelf);
  }

  // Add support for pino-elasticsearch
  const kibanaHost = configService.get<string>('kibana.host');
  if (kibanaHost) {
    await import('pino-elasticsearch');
    const kibana: pino.TransportTargetOptions<ElasticClientOptions> = {
      target: 'pino-elasticsearch',
      options: {
        node: kibanaHost,
        compression: true,
      },
      level: 'trace',
    };
    targets.push(kibana);
  }

  return {
    pinoHttp: {
      level: 'trace',
      transport: { targets },
      autoLogging: false,
    },
    assignResponse: true,
  };
};
