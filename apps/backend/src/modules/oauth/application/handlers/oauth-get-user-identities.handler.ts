import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { OAuthGetUserIdentitiesQuery } from '../queries/oauth-get-user-identities.query';
import { IdentityRepository } from '@/modules/users/domain/repositories/identity.repository';
import { Identity } from '@/modules/users/domain/entities/identity.entity';

/**
 * Handler to get all OAuth identities for a user
 */
@QueryHandler(OAuthGetUserIdentitiesQuery)
export class OAuthGetUserIdentitiesHandler implements IQueryHandler<OAuthGetUserIdentitiesQuery> {
  constructor(private readonly identityRepository: IdentityRepository) {}

  async execute(query: OAuthGetUserIdentitiesQuery): Promise<Identity[]> {
    return this.identityRepository.findAllByUserId(query.userId);
  }
}
