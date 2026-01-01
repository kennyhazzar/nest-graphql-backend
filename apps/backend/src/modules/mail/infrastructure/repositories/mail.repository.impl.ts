import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IdType } from '@/interfaces/id.type';
import { Mail, MailStatus } from '../../domain';
import { MailRepository } from '../../domain/repositories/mail.repository';
import { MailEntity } from '../entities/mail.entity';
import { MailTemplateEntity } from '../entities/mail-template.entity';

@Injectable()
export class MailRepositoryImpl extends MailRepository {
  private readonly logger = new Logger(MailRepositoryImpl.name);

  constructor(
    @InjectRepository(MailEntity)
    private readonly repo: Repository<MailEntity>,
    @InjectRepository(MailTemplateEntity)
    private readonly templateRepo: Repository<MailTemplateEntity>,
  ) {
    super();
  }

  async create(mail: Omit<Mail, 'id'>): Promise<Mail> {
    const template = await this.templateRepo.findOne({
      where: { name: mail.template },
    });
    if (!template) {
      this.logger.error('Template not found', { template: mail.template });
      throw new BadRequestException('Непредвиденная ошибка при создании письма');
    }

    return this.repo
      .save(
        this.repo.create({
          to: mail.to,
          subject: mail.subject,
          template,
          variables: mail.context,
          status: mail.status,
          attempts: mail.attempts,
          sentAt: mail.sentAt,
          errorMessage: mail.errorMessage,
        }),
      )
      .then((saved) => MailRepositoryImpl.toDomain(saved));
  }

  async findById(id: IdType): Promise<Mail | null> {
    return this.repo
      .findOne({
        where: { id },
        relations: { template: true },
      })
      .then((mail) => (mail ? MailRepositoryImpl.toDomain(mail) : null));
  }

  async findByStatus(status: MailStatus): Promise<Mail[]> {
    return this.repo
      .find({
        where: { status },
        relations: { template: true },
      })
      .then((mails) => mails.map((mail) => MailRepositoryImpl.toDomain(mail)));
  }

  /**
   * Обновляет письмо
   */
  async update(mailId: IdType, update: Partial<Mail>): Promise<Mail> {
    // Маппинг полей из domain entity в TypeORM entity
    const updateData: Partial<MailEntity> = {
      status: update.status,
      attempts: update.attempts,
      sentAt: update.sentAt,
      errorMessage: update.errorMessage,
      variables: update.context,
    };

    await this.repo.update(mailId, updateData);
    const updated = await this.repo.findOne({
      where: { id: mailId },
      relations: { template: true },
    });
    if (!updated) {
      throw new Error('Mail not found');
    }

    return MailRepositoryImpl.toDomain(updated);
  }

  async delete(mailId: IdType): Promise<void> {
    await this.repo.delete(mailId);
  }

  async findPendingMails(): Promise<Mail[]> {
    return this.repo
      .find({
        where: { status: MailStatus.PENDING },
        relations: { template: true },
      })
      .then((mails) => mails.map((mail) => MailRepositoryImpl.toDomain(mail)));
  }

  async findFailedMails(): Promise<Mail[]> {
    return this.repo
      .find({
        where: { status: MailStatus.FAILED },
        relations: { template: true },
      })
      .then((mails) => mails.map((mail) => MailRepositoryImpl.toDomain(mail)));
  }

  private static toDomain(mailEntity: MailEntity): Mail {
    return new Mail(
      mailEntity.id,
      mailEntity.to,
      mailEntity.subject,
      mailEntity.template.name,
      mailEntity.variables,
      mailEntity.status,
      mailEntity.attempts,
      mailEntity.createdAt!,
      mailEntity.sentAt,
      mailEntity.errorMessage,
    );
  }
}
