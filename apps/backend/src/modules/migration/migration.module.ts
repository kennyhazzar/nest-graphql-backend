import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MigrationService } from './migration.service';
import { UserSeedService } from './user-seed.service';
import { RolesSeedService } from './roles-seed.service';

@Module({
  imports: [TypeOrmModule],
  providers: [MigrationService, UserSeedService, RolesSeedService],
})
export class MigrationModule implements OnModuleInit {
  constructor(private readonly migrationService: MigrationService) {}

  async onModuleInit() {
    await this.migrationService.migrateAndSeed();
  }
}
