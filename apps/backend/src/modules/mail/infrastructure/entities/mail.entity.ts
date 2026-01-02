import { Entity, Column, JoinColumn, ManyToOne, RelationId } from 'typeorm';

import { BaseUUIDMixin } from '@/common/base.uuid.entity';
import { MailStatus } from '../../domain/enums/mail-status.enum';
import { MailTemplateEntity } from './mail-template.entity';

@Entity('mail', { comment: 'Sent emails' })
export class MailEntity extends BaseUUIDMixin('mail') {
  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Recipient email',
  })
  to!: string;

  @Column({
    type: 'varchar',
    length: 500,
    comment: 'Email subject',
  })
  subject!: string;

  @ManyToOne(() => MailTemplateEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn()
  template!: MailTemplateEntity;

  @Column({ type: 'uuid', comment: 'Mail template ID' })
  @RelationId((mail: MailEntity) => mail.template)
  templateId!: string;

  @Column({
    type: 'enum',
    enum: MailStatus,
    enumName: 'MailStatus',
    default: MailStatus.PENDING,
    comment: 'Email status',
  })
  status!: MailStatus;

  @Column({
    type: 'jsonb',
    comment: 'Template variables',
  })
  variables!: Record<string, any>;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Send attempts count',
  })
  attempts!: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Error message if failed',
  })
  errorMessage?: string;

  @Column({
    type: 'timestamptz',
    nullable: true,
    comment: 'Email sent timestamp',
  })
  sentAt?: Date;
}
