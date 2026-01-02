import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';

import { MagicLinkTokenRepository } from '../../domain/repositories/magic-link-token.repository';
import { MagicLinkToken } from '../../domain/entities/magic-link-token.entity';
import { MagicLinkTokenEntity } from '../entity/magic-link-token.entity';

/**
 * TypeORM implementation of MagicLinkTokenRepository
 */
@Injectable()
export class MagicLinkTokenRepositoryImpl implements MagicLinkTokenRepository {
  constructor(
    @InjectRepository(MagicLinkTokenEntity)
    private readonly repository: Repository<MagicLinkTokenEntity>,
  ) {}

  async create(data: Omit<MagicLinkToken, 'id' | 'createdAt'>): Promise<MagicLinkToken> {
    const entity = this.repository.create(data);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findByToken(token: string): Promise<MagicLinkToken | null> {
    const entity = await this.repository.findOne({
      where: { token },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<MagicLinkToken[]> {
    const entities = await this.repository.find({
      where: { email },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async markAsUsed(id: string): Promise<void> {
    await this.repository.update(id, { isUsed: true });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.repository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }

  async deleteByEmail(email: string): Promise<void> {
    await this.repository.delete({ email });
  }

  /**
   * Convert TypeORM entity to domain entity
   */
  private toDomain(entity: MagicLinkTokenEntity): MagicLinkToken {
    return new MagicLinkToken(
      entity.id,
      entity.email,
      entity.token,
      entity.expiresAt,
      entity.isUsed,
      entity.fingerprint,
      entity.userAgent,
      entity.createdAt ?? new Date(),
    );
  }
}
