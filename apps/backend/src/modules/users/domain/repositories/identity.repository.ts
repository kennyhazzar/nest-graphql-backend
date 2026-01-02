import { OAuthProviderType } from '@/enums/oauth-provider-type.enum';
import { Identity } from '../entities/identity.entity';

/**
 * Abstract repository for OAuth identity operations
 */
export abstract class IdentityRepository {
  /**
   * Create a new identity
   */
  abstract create(data: Omit<Identity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Identity>;

  /**
   * Find identity by ID
   */
  abstract findById(id: string): Promise<Identity | null>;

  /**
   * Find identity by user ID and provider type
   */
  abstract findByUserIdAndProvider(
    userId: string,
    providerType: OAuthProviderType,
  ): Promise<Identity | null>;

  /**
   * Find identity by provider user ID
   */
  abstract findByProviderUserId(
    providerType: OAuthProviderType,
    providerUserId: string,
  ): Promise<Identity | null>;

  /**
   * Find all identities for a user
   */
  abstract findAllByUserId(userId: string): Promise<Identity[]>;

  /**
   * Update identity
   */
  abstract update(id: string, data: Partial<Identity>): Promise<Identity>;

  /**
   * Delete identity
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Count identities for a user
   */
  abstract countByUserId(userId: string): Promise<number>;
}
