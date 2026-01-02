import { Entity, Column, ManyToOne, JoinColumn, RelationId, Index, Unique } from 'typeorm';
import { BaseUUIDMixin } from '@/common/base.uuid.entity';
import { OAuthProviderType } from '@/enums/oauth-provider-type.enum';
import { UserEntity } from './user.entity';

/**
 * TypeORM entity for OAuth identities
 * Stores OAuth provider authentication data for users
 */
@Entity('identity', { comment: 'OAuth provider identities for users' })
@Unique('UQ_identity_user_provider', ['userId', 'providerType'])
@Index('IDX_identity_provider_userid', ['providerType', 'providerUserId'])
export class IdentityEntity extends BaseUUIDMixin('identity') {
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  user!: UserEntity;

  @Column({ type: 'uuid', comment: 'User ID' })
  @RelationId((identity: IdentityEntity) => identity.user)
  userId!: string;

  @Column({
    type: 'enum',
    enum: OAuthProviderType,
    enumName: 'OAuthProviderType',
    comment: 'OAuth provider type',
  })
  providerType!: OAuthProviderType;

  @Column({ type: 'varchar', length: 255, comment: 'Provider user ID' })
  providerUserId!: string;

  @Column({ type: 'text', nullable: true, comment: 'OAuth access token' })
  accessToken?: string;

  @Column({ type: 'text', nullable: true, comment: 'OAuth refresh token' })
  refreshToken?: string;

  @Column({ type: 'timestamptz', nullable: true, comment: 'Token expiration timestamp' })
  tokenExpiresAt?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'Email from OAuth provider' })
  providerEmail?: string;

  @Column({ type: 'text', nullable: true, comment: 'Avatar URL from provider' })
  avatarUrl?: string;

  @Column({ type: 'jsonb', nullable: true, comment: 'Additional metadata from provider' })
  metadata?: Record<string, any>;
}
