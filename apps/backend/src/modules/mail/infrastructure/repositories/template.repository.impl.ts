import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';

import { IdType } from '@/interfaces/id.type';
import { TemplateRepository } from '../../domain/repositories/template.repository';
import { Template } from '../../domain/entities/template.entity';
import { MailTemplateEntity } from '../entities/mail-template.entity';
import { MailTemplateType } from '../../domain';

@Injectable()
export class TemplateRepositoryImpl extends TemplateRepository {
  constructor(
    @InjectRepository(MailTemplateEntity)
    private readonly templateRepository: Repository<MailTemplateEntity>,
  ) {
    super();
  }

  async count(options?: FindManyOptions<MailTemplateEntity>): Promise<number> {
    return this.templateRepository.count(options);
  }

  async create(template: {
    name: MailTemplateType;
    subject: string;
    content: string;
    isActive?: boolean;
  }): Promise<Template> {
    return this.templateRepository
      .save(
        this.templateRepository.create({
          name: template.name,
          subject: template.subject,
          content: template.content,
          isActive: template.isActive ?? true,
        }),
      )
      .then((entity) => this.toEntity(entity));
  }

  async findById(id: IdType): Promise<Template | null> {
    return this.templateRepository
      .findOne({ where: { id } })
      .then((template) => (template ? this.toEntity(template) : null));
  }

  async findByName(name: MailTemplateType): Promise<Template | null> {
    return this.templateRepository
      .findOne({ where: { name } })
      .then((template) => (template ? this.toEntity(template) : null));
  }

  async findAll(): Promise<Template[]> {
    return this.templateRepository.find().then((templates) => templates.map((template) => this.toEntity(template)));
  }

  async findActive(): Promise<Template[]> {
    return this.templateRepository
      .find({ where: { isActive: true } })
      .then((templates) => templates.map((template) => this.toEntity(template)));
  }

  async update(
    id: IdType,
    update: {
      subject?: string;
      content?: string;
      isActive?: boolean;
    },
  ): Promise<Template> {
    await this.templateRepository.update(id, update);
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new Error(`Template with id ${id} not found`);
    }
    return this.toEntity(template);
  }

  async delete(id: IdType): Promise<void> {
    await this.templateRepository.delete(id);
  }

  private toEntity(entity: MailTemplateEntity): Template {
    return new Template(
      entity.id,
      entity.name,
      entity.subject,
      entity.content,
      entity.isActive,
      entity.createdAt!,
      entity.updatedAt!,
    );
  }
}
