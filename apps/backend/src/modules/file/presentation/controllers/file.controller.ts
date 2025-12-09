import { BadRequestException, Controller, Get, Param, Response, UseGuards } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { isUUID } from 'class-validator';
import { CommandBus } from '@nestjs/cqrs';

import type { IdType } from '@/interfaces/id.type';
import type { RoleType } from '@/enums/role-type.enum';
import { CurrentRoleType } from '@/decorators/current-role-type.decorator';
import { CurrentUserId } from '@/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { FileDownloadCommand } from '../../application/commands/file-download.command';

@Controller('file')
export class FileController {
  constructor(private readonly commandBus: CommandBus) {}

  /**
   * Endpoint to download a public file by its ID.
   * @param fileId - The ID of the file to download.
   */
  @Get('public/:fileId')
  async downloadPublic(@Param('fileId') fileId: IdType, @Response() reply: FastifyReply): Promise<void> {
    if (!isUUID(fileId)) {
      throw new BadRequestException(`Invalid file ID: ${fileId}`);
    }
    await this.commandBus.execute(new FileDownloadCommand({ reply, fileId }));
  }

  /**
   * Endpoint to download a public file by its ID and version ID.
   * @param fileId - The ID of the file to download.
   * @param versionId - The ID of the version to download.
   */
  @Get('public/:fileId/:versionId')
  async downloadPublicVersion(
    @Param('fileId') fileId: IdType,
    @Param('versionId') versionId: IdType,
    @Response() reply: FastifyReply,
  ): Promise<void> {
    if (!isUUID(fileId)) {
      throw new BadRequestException(`Invalid file ID: ${fileId}`);
    }
    await this.commandBus.execute(new FileDownloadCommand({ reply, fileId, versionId }));
  }

  /**
   * Endpoint to download a file by its ID.
   * @param fileId - The ID of the file to download.
   */
  @Get(':fileId')
  @UseGuards(JwtAuthGuard)
  async download(
    @Param('fileId') fileId: IdType,
    @CurrentUserId() currentUserId: IdType,
    @CurrentRoleType() currentRoleType: RoleType,
    @Response() reply: FastifyReply,
  ): Promise<void> {
    if (!isUUID(fileId)) {
      throw new BadRequestException(`Invalid file ID: ${fileId}`);
    }
    await this.commandBus.execute(new FileDownloadCommand({ reply, fileId, currentUserId, currentRoleType }));
  }

  /**
   * Endpoint to download a file by its ID and version.
   * @param fileId - The ID of the file to download.
   * @param versionId - The ID of the version to download.
   */
  @Get(':fileId/:versionId')
  @UseGuards(JwtAuthGuard)
  async downloadVersion(
    @Param('fileId') fileId: IdType,
    @Param('versionId') versionId: IdType,
    @CurrentUserId() currentUserId: IdType,
    @CurrentRoleType() currentRoleType: RoleType,
    @Response() reply: FastifyReply,
  ): Promise<void> {
    if (!isUUID(fileId)) {
      throw new BadRequestException(`Invalid file ID: ${fileId}`);
    }
    await this.commandBus.execute(
      new FileDownloadCommand({ reply, fileId, versionId, currentUserId, currentRoleType }),
    );
  }
}
