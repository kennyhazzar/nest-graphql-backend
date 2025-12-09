import { Injectable, Logger } from '@nestjs/common';

import { UserSeedService } from './user-seed.service';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(private readonly userSeedService: UserSeedService) {}

  async migrateAndSeed() {
    this.logger.log('Starting migration and seeding...');
    await this.userSeedService.seedIfEmpty();
    this.logger.log('Migration and seeding completed successfully');
  }
}
