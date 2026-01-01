import { Query } from '@nestjs/cqrs';
import { Identity } from '@/modules/users/domain/entities/identity.entity';

/**
 * Query to get all OAuth identities for a user
 */
export class OAuthGetUserIdentitiesQuery extends Query<Identity[]> {
  constructor(public readonly userId: string) {
    super();
  }
}
