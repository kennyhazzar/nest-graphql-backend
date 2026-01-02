import { Entity, Column, Index } from 'typeorm';
import { BaseUUIDMixin } from '@/common/base.uuid.entity';

/**
 * TypeORM entity for magic link authentication tokens
 */
@Entity('magic_link_token', { comment: 'Magic link authentication tokens' })
@Index('IDX_magic_link_token_email', ['email'])
@Index('IDX_magic_link_token_expires', ['expiresAt'])
@Index('IDX_magic_link_token_token', ['token'], { unique: true })
export class MagicLinkTokenEntity extends BaseUUIDMixin('magic_link_token') {
  @Column({ type: 'varchar', length: 255, comment: 'User email address' })
  email!: string;

  @Column({ type: 'text', unique: true, comment: 'Unique token for authentication' })
  token!: string;

  @Column({ type: 'timestamptz', comment: 'Token expiration timestamp' })
  expiresAt!: Date;

  @Column({ type: 'boolean', default: false, comment: 'Whether token has been used' })
  isUsed!: boolean;

  @Column({ type: 'text', comment: 'Request fingerprint (IP address)' })
  fingerprint!: string;

  @Column({ type: 'text', comment: 'User agent from request' })
  userAgent!: string;
}
