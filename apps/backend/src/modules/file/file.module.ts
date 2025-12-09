import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { S3Module } from 'nestjs-s3';
import { TypeOrmModule } from '@nestjs/typeorm';

import { S3ModuleFuncOptions } from '@/options/s3.module.options';

import {
  FileGetByIdHandler,
  FilesGetHandler,
  FilesUploadHandler,
  FileDownloadHandler,
  FileUpdateHandler,
  FileDeleteHandler,
} from './application';
import { FileEntity, FileVersionEntity } from './infrastructure/entity';
import { FileRepository } from './domain/repositories';
import { FileAdapter } from './infrastructure/adapters/s3.adapter';
import { FileRepositoryImpl } from './infrastructure/repositories/file-repository.impl';
import { FileResolver } from './presentation/resolvers';
import { FileController } from './presentation/controllers/file.controller';

/**
 * Обработчики команд для модуля файлов
 * Отвечают за выполнение операций изменения состояния
 */
const CommandHandlers = [FilesUploadHandler, FileDownloadHandler, FileUpdateHandler, FileDeleteHandler];

/**
 * Обработчики запросов для модуля файлов
 * Отвечают за получение данных без изменения состояния
 */
const QueryHandlers = [FilesGetHandler, FileGetByIdHandler];

/**
 * Модуль управления файлами
 *
 * @description
 * Модуль предоставляет следующие возможности:
 * - Загрузка файлов в S3 (multipart upload)
 * - Скачивание файлов (REST endpoints)
 * - Версионирование файлов (S3 versioning)
 * - GraphQL API для управления файлами
 */
@Global()
@Module({
  imports: [
    S3Module.forRootAsync({ useFactory: S3ModuleFuncOptions, inject: [ConfigService] }),
    CqrsModule,
    TypeOrmModule.forFeature([FileEntity, FileVersionEntity]),
  ],
  controllers: [FileController],
  providers: [
    FileAdapter,
    FileResolver,
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: FileRepository,
      useClass: FileRepositoryImpl,
    },
  ],
  exports: [FileRepository, FileAdapter],
})
export class FileModule {}
