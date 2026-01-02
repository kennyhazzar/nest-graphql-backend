import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { OAuthProviderType } from '@/enums/oauth-provider-type.enum';
import { IdentityRepository } from '../../domain/repositories/identity.repository';
import { Identity } from '../../domain/entities/identity.entity';
import { IdentityEntity } from '../entity/identity.entity';

/**
 * TypeORM implementation of IdentityRepository
 */
@Injectable()
export class IdentityRepositoryImpl implements IdentityRepository {
  constructor(
    @InjectRepository(IdentityEntity)
    private readonly repository: Repository<IdentityEntity>,
  ) {}

  async create(data: Omit<Identity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Identity> {
    const entity = this.repository.create(data);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Identity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserIdAndProvider(
    userId: string,
    providerType: OAuthProviderType,
  ): Promise<Identity | null> {
    const entity = await this.repository.findOne({
      where: { userId, providerType },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByProviderUserId(
    providerType: OAuthProviderType,
    providerUserId: string,
  ): Promise<Identity | null> {
    const entity = await this.repository.findOne({
      where: { providerType, providerUserId },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAllByUserId(userId: string): Promise<Identity[]> {
    const entities = await this.repository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async update(id: string, data: Partial<Identity>): Promise<Identity> {
    await this.repository.update(id, data);
    const updated = await this.repository.findOne({ where: { id } });
    if (!updated) {
      throw new Error(`Identity with id ${id} not found`);
    }
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async countByUserId(userId: string): Promise<number> {
    return this.repository.count({ where: { userId } });
  }

  /**
   * Convert TypeORM entity to domain entity
   */
  private toDomain(entity: IdentityEntity): Identity {
    return new Identity(
      entity.id,
      entity.userId,
      entity.providerType,
      entity.providerUserId,
      entity.accessToken,
      entity.refreshToken,
      entity.tokenExpiresAt,
      entity.providerEmail,
      entity.avatarUrl,
      entity.metadata,
      entity.createdAt ?? new Date(),
      entity.updatedAt ?? new Date(),
    );
  }
}
