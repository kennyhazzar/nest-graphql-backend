import { FastifyReply } from 'fastify';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  Repository,
  UpdateResult,
} from 'typeorm';
import { InjectS3, S3 } from 'nestjs-s3';

import type { IdType } from '@/interfaces/id.type';
import { RoleType } from '@/enums/role-type.enum';
import { FileFrom } from '@/enums/file-from.enum';
import { FileEntity } from '../entity/file.entity';
import { FileAdapter } from '../adapters/s3.adapter';
import { FileRepository, Files } from '../../domain/repositories';
import { FileUpdateInput, FileUploadInput } from '../../presentation';
import { FileVersionEntity } from '../entity/file-version.entity';

@Injectable()
export class FileRepositoryImpl implements FileRepository {
  private readonly logger = new Logger(FileRepositoryImpl.name);

  constructor(
    @InjectRepository(FileEntity)
    private readonly repo: Repository<FileEntity>,
    @InjectRepository(FileVersionEntity)
    private readonly fileVersionRepo: Repository<FileVersionEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly fileAdapter: FileAdapter,
    @InjectS3()
    public readonly s3: S3,
  ) {}

  async count(options?: FindManyOptions<FileEntity>): Promise<number> {
    return this.repo.count(options);
  }

  async find(options?: FindManyOptions<FileEntity>): Promise<{ nodes: FileEntity[]; totalCount: number }> {
    const [entities, totalCount] = await this.repo.findAndCount(options);
    return { nodes: entities, totalCount };
  }

  async findById(id: IdType, options?: FindOneOptions<FileEntity>): Promise<FileEntity | null> {
    return this.repo.findOne({ ...options, where: { id } });
  }

  async findBy(
    payload: { id: IdType; module?: FileFrom },
    options?: FindOneOptions<FileEntity>,
  ): Promise<FileEntity | null> {
    return this.repo.findOne({
      ...options,
      where: { id: payload.id, module: payload.module },
    });
  }

  /**
   * Возвращает безопасное имя файла для использования в файловой системе
   * Транслитерирует кириллицу и заменяет специальные символы
   * @param file Объект файла с полями name, module, externalId, userId
   * @returns Безопасное имя файла (slugified)
   */
  private getSafeFilename(file: { name: string; module: FileFrom; externalId: string; userId: IdType }): string {
    const fullPath = this.fileAdapter.getFilePath(file.userId, file);
    const pathParts = fullPath.split('/');
    return pathParts[pathParts.length - 1];
  }

  private fileS3func = (fullPath: string, versionId?: string): Promise<GetObjectCommandOutput> =>
    this.fileAdapter
      .download(fullPath, versionId)
      .then((f) => {
        if (!f.Body) {
          this.logger.error(`Failed to download file from S3: ${fullPath}`);
          throw new BadRequestException(`Failed to download file from S3: ${fullPath}`);
        }
        this.logger.debug(`Downloading file from S3: ${fullPath}, VersionId: ${versionId || 'latest'}`);
        return f;
      })
      .catch((error) => {
        this.logger.error(`Failed to download file from S3 ${fullPath}: ${error.message}`, error.stack);
        throw new BadRequestException(`Failed to download file from S3 ${fullPath}: ${error.message}`);
      });

  /**
   * Download a file by its ID and user ID.
   * This method retrieves the file from the database and S3, then streams it to the client.
   * @param reply - The Fastify reply object to send the file response.
   * @param fileId - The ID of the file to download.
   * @param versionId - Optional version ID to download specific version.
   * @param currentUserId - The ID of the user requesting the download.
   * @param currentRoleType - The role type of the user.
   */
  async download({
    reply,
    fileId,
    versionId,
    currentUserId,
    currentRoleType,
  }: {
    reply: FastifyReply;
    fileId: IdType;
    currentUserId?: IdType;
    currentRoleType?: RoleType;
    versionId?: IdType;
  }): Promise<void> {
    const where: FindOptionsWhere<FileEntity> = { id: fileId };
    const relations: FindOptionsRelations<FileEntity> = {};
    const select: FindOptionsSelect<FileEntity> = {
      id: true,
      path: true,
      name: true,
      userId: true,
      module: true,
      externalId: true,
      type: true,
    };
    const isPublic = !currentUserId || !currentRoleType;
    if (isPublic) {
      where.module = FileFrom.PUBLIC;
    }
    if (versionId) {
      relations.versions = true;
      where.versions = { id: versionId };
      select.versions = { id: true, mimetype: true, size: true, versionId: true };
    } else {
      relations.lastVersion = true;
      select.lastVersion = { id: true, mimetype: true, size: true, versionId: true };
    }
    const file = await this.repo.findOne({
      where,
      select,
      loadEagerRelations: false,
      relations,
    });
    if (!file) {
      this.logger.error(`File with ID ${fileId} not found`);
      throw new BadRequestException(`File with ID ${fileId} not found`);
    }
    const { mimetype: mimetypeDb, size } = file.lastVersion ?? file.versions?.[0] ?? {};
    const fullPathS3 = this.fileAdapter.getFilePath(file.userId, file);

    const fileS3 = await this.fileS3func(fullPathS3, versionId);
    const mimetype = fileS3.ContentType || mimetypeDb || 'application/octet-stream';
    const contentLength = fileS3.ContentLength || size;

    reply.header('Content-Type', mimetype);
    const safeFilename = this.getSafeFilename(file);
    if (mimetype.startsWith('image/') || mimetype.startsWith('video/') || mimetype.startsWith('audio/')) {
      reply.header('Content-Disposition', `inline; filename="${safeFilename}"`);
    } else {
      reply.header('Content-Disposition', `attachment; filename="${safeFilename}"`);
    }

    if (contentLength) {
      reply.header('Content-Length', contentLength);
    }
    if (fileS3.LastModified) {
      reply.header('Last-Modified', fileS3.LastModified.toUTCString());
    }
    if (fileS3.ETag) {
      reply.header('ETag', fileS3.ETag);
    }
    if (file.module === FileFrom.PUBLIC) {
      reply.header('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    } else {
      reply.header('Cache-Control', 'private, no-store, no-cache, max-age=0, must-revalidate, proxy-revalidate');
      reply.header('Pragma', 'no-cache');
      reply.header('Expires', '0');
    }

    // Pipe the S3 file stream to the reply object
    await reply.send(fileS3.Body as NodeJS.ReadableStream);
  }

  async uploadToS3(userId: IdType, fileId: IdType, fullPath: string, upload: FileUploadInput, tran: EntityManager) {
    try {
      // Upload the file to S3
      const file = await upload.file;
      const s3Upload = await this.fileAdapter.upload(userId, file, fullPath, upload);
      if (!s3Upload.Key || !s3Upload.VersionId) {
        throw new Error(
          `Failed to upload file to S3: fullPath=${fullPath}, Key=${s3Upload.Key}, VersionId=${s3Upload.VersionId}`,
        );
      }

      try {
        // Get the file size from S3
        const { ContentLength: ContentLength = 0 } = await this.fileAdapter.head(s3Upload.Key, s3Upload.VersionId);
        this.logger.debug(
          `File uploaded to S3: ${s3Upload.Key}, VersionId: ${s3Upload.VersionId}, Size: ${ContentLength} bytes`,
        );

        // Simulate delay for S3 consistency
        await new Promise((resolve) => setTimeout(resolve, 800));

        const savedFile = await tran.findOne(FileEntity, {
          where: { id: fileId },
          select: ['id'],
          loadEagerRelations: false,
          relations: [],
        });
        if (!savedFile) {
          throw new Error(`Failed to find saved file after upload: ${fileId}`);
        }

        // Save the file version metadata
        const lastVersion = await tran.upsert(
          FileVersionEntity,
          {
            mimetype: file.mimetype,
            size: ContentLength,
            versionId: s3Upload.VersionId,
            fileId: savedFile.id,
            userId,
          },
          {
            conflictPaths: { versionId: true, fileId: true },
          },
        );
        const lastVersionId = lastVersion.identifiers[0]?.id as IdType;
        if (lastVersionId) {
          await tran.update(FileEntity, { id: fileId }, { lastVersionId });
        }

        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        if (s3Upload.Key && s3Upload.VersionId) {
          this.logger.error(`Attempting to delete file from S3: ${s3Upload.Key}, VersionId: ${s3Upload.VersionId}`);
          await this.fileAdapter.delete(s3Upload.Key, s3Upload.VersionId).catch((deleteError) => {
            const deleteErrorMessage = deleteError instanceof Error ? deleteError.message : String(deleteError);
            const deleteErrorStack = deleteError instanceof Error ? deleteError.stack : undefined;
            this.logger.error(`Failed to delete file from S3 after error: ${deleteErrorMessage}`, deleteErrorStack);
          });
        }
        if (fileId) {
          await this.repo.delete(fileId).catch((deleteError) => {
            const deleteErrorMessage = deleteError instanceof Error ? deleteError.message : String(deleteError);
            this.logger.error(`Failed to delete file in internal storage: ${deleteErrorMessage}`);
          });
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`File upload failed: ${errorMessage}`, errorStack);
      throw new Error(errorMessage);
    }
  }

  /**
   * Upload files to S3 and save their metadata to the database.
   * @param userId - The ID of the user uploading the files.
   * @param files - The files to upload.
   * @returns The uploaded file entities.
   */
  async uploads(userId: IdType, files: FileUploadInput[]): Promise<Files> {
    return this.entityManager.transaction(async (tran) => {
      const fileEntitiesPromise = files.map(async (upload) => {
        // getFilePath возвращает путь с транслитерированным именем файла для безопасности S3
        const fullPath = this.fileAdapter.getFilePath(userId, upload);
        const path = fullPath.split('/');
        path.pop(); // Удаляем slugified имя файла из пути

        // Сохраняем оригинальное имя файла (включая кириллицу) для отображения пользователю
        // В S3 хранится транслитерированная версия, в БД - оригинальное имя
        const originalName = upload.name;

        this.logger.debug(
          `Uploading file: ${originalName}, Module: ${upload.module}, ExternalId: ${upload.externalId}, User ID: ${userId}`,
        );

        const savedInsert = await tran.upsert(
          FileEntity,
          {
            name: originalName,
            path: path.join('/'),
            description: upload.description,
            module: upload.module,
            externalId: upload.externalId,
            type: upload.type,
            userId,
          },
          { conflictPaths: ['name', 'module', 'externalId'], skipUpdateIfNoValuesChanged: false },
        );
        if (!savedInsert || savedInsert.identifiers[0]?.id === undefined) {
          throw new BadRequestException('Failed to save files');
        }
        const savedFile = await tran.findOne(FileEntity, {
          where: { id: savedInsert.identifiers[0].id },
          loadEagerRelations: false,
          relations: [],
        });
        if (!savedFile) {
          this.logger.error(`Failed to find saved file after insert: ${savedInsert.identifiers[0].id}`);
          throw new BadRequestException('Failed to find saved file after insert');
        }

        try {
          // Upload to S3 without timeout - let large files complete
          const result = await this.uploadToS3(userId, savedFile.id, fullPath, upload, tran);
          if (!result.success) {
            this.logger.error(
              `File upload to S3 failed for file: fullPath=${fullPath}, name=${originalName}, userId=${userId}`,
            );
            throw new InternalServerErrorException(`File upload to S3 failed for file: ${originalName}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorStack = error instanceof Error ? error.stack : undefined;
          this.logger.error(`File upload failed for file: ${errorMessage}`, errorStack);
          throw new InternalServerErrorException(`File upload failed for file: ${errorMessage}`);
        }

        // Перезагружаем файл с lastVersion после успешной загрузки в S3
        const uploadedFile = await tran.findOne(FileEntity, {
          where: { id: savedFile.id },
          loadEagerRelations: false,
          relations: {
            lastVersion: true,
          },
        });
        if (!uploadedFile) {
          this.logger.error(`Failed to find uploaded file with lastVersion: ${savedFile.id}`);
          throw new BadRequestException('Failed to find uploaded file with lastVersion');
        }

        return uploadedFile;
      });

      const uploadedFiles = await Promise.all(fileEntitiesPromise);
      return { nodes: uploadedFiles, totalCount: uploadedFiles.length };
    });
  }

  async update(fileId: IdType, update: FileUpdateInput): Promise<FileEntity> {
    return this.entityManager.transaction(async (tran) => {
      // Find the file to update
      const file = await tran.findOne(FileEntity, {
        where: { id: fileId },
        loadEagerRelations: false,
        relations: {
          lastVersion: true,
        },
      });

      if (!file) {
        this.logger.error(`Файл не найден: ${fileId}`);
        throw new BadRequestException(`Файл не найден: ${fileId}`);
      }

      // Prepare update data
      const updateData: Partial<FileEntity> = {};

      // Update name if provided
      if (update.name !== undefined) {
        updateData.name = update.name;
      }

      // Update description if provided
      if (update.description !== undefined) {
        updateData.description = update.description;
      }

      // Update the file entity if there are changes
      if (Object.keys(updateData).length > 0) {
        await tran.update(FileEntity, { id: fileId }, updateData);
        this.logger.debug(`Updated file ${fileId} with data: ${JSON.stringify(updateData)}`);
      }

      // If a new file is provided, upload it as a new version
      if (update.file) {
        const fullPath = this.fileAdapter.getFilePath(file.userId, file);
        const uploadInput: FileUploadInput = {
          name: updateData.name || file.name,
          description: updateData.description || file.description,
          module: file.module,
          externalId: file.externalId,
          type: file.type,
          file: update.file,
        };

        this.logger.debug(`Uploading new version for file ${fileId}`);
        await this.uploadToS3(file.userId, fileId, fullPath, uploadInput, tran);
      }

      // Fetch and return the updated file
      const updatedFile = await tran.findOne(FileEntity, {
        where: { id: fileId },
        loadEagerRelations: false,
        relations: {
          lastVersion: true,
        },
      });

      if (!updatedFile) {
        this.logger.error(`Не удалось найти обновленный файл: ${fileId}`);
        throw new InternalServerErrorException(`Не удалось найти обновленный файл: ${fileId}`);
      }

      return updatedFile;
    });
  }

  async findVersion(fileId: IdType, options?: FindManyOptions<FileVersionEntity>): Promise<FileVersionEntity[]> {
    return this.fileVersionRepo.find({ where: { fileId }, order: { createdAt: 'DESC' }, ...options });
  }

  async findVersionById(
    fileVersionId: IdType,
    options?: FindOneOptions<FileVersionEntity>,
  ): Promise<FileVersionEntity | null> {
    return this.fileVersionRepo.findOne({ ...options, where: { id: fileVersionId } });
  }

  async findVersionsByIds(
    fileVersionIds: IdType[],
    options?: FindManyOptions<FileVersionEntity>,
  ): Promise<FileVersionEntity[]> {
    if (fileVersionIds.length === 0) {
      return [];
    }
    return this.fileVersionRepo.find({
      ...options,
      where: { id: In(fileVersionIds), ...(options?.where || {}) },
    });
  }

  async updateVersion(fileId: IdType, lastVersionId: IdType): Promise<UpdateResult> {
    return this.repo.update(fileId, { lastVersionId });
  }

  async delete(id: IdType): Promise<UpdateResult> {
    return this.repo.softDelete(id);
  }
}
