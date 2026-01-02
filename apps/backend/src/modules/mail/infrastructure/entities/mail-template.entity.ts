import { Entity, Column, Index } from 'typeorm';
import { BaseUUIDMixin } from '@/common/base.uuid.entity';
import { MailTemplateType } from '../../domain/enums/mail-template-type.enum';

@Entity('mail_template', { comment: 'Email templates' })
@Index(['name'], { unique: true })
export class MailTemplateEntity extends BaseUUIDMixin('mail_template') {
  @Column({
    type: 'enum',
    enum: MailTemplateType,
    enumName: 'MailTemplateType',
    comment: 'Template name',
  })
  name!: MailTemplateType;

  @Column({
    type: 'varchar',
    length: 500,
    comment: 'Email subject with variable support',
  })
  subject!: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Handlebars template content (optional, can use .hbs files instead)',
  })
  content?: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Is template active',
  })
  isActive!: boolean;
}
