import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';

import { BaseUUIDMixin } from '@/common/base.uuid.entity';
import { UserEntity } from './user.entity';

/**
 * Refresh tokens for users
 */
@Entity('refresh', { comment: 'Refresh tokens for users' })
export class RefreshEntity extends BaseUUIDMixin('refresh') {
  @ManyToOne(() => UserEntity, (user) => user.id, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn()
  user!: UserEntity;

  @Column({ comment: 'User ID who owns this token' })
  @RelationId((refresh: RefreshEntity) => refresh.user)
  userId!: string;

  @Column({ type: 'text', comment: 'Refresh token' })
  refreshToken!: string;

  @Column({ type: 'timestamptz', comment: 'Token expiration date' })
  expiresAt!: Date;

  @Column({ type: 'boolean', comment: 'Is revoked' })
  isRevoked!: boolean;

  @Column({ type: 'text', comment: 'IP address' })
  fingerprint!: string;

  @Column({ type: 'text', comment: 'User Agent' })
  userAgent!: string;
}
