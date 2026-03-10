import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { MigrationService } from './migration.service';
import { UserSeedService } from './user-seed.service';
import { RolesSeedService } from './roles-seed.service';
import { NotificationTemplateSeedService } from './notification-template-seed.service';
import { DrizzleMigrateService } from '@/common/drizzle';
import { TemplateSeedService } from '../mail/infrastructure/services/template-seed.service';

@Module({
  imports: [UsersModule, MailModule, TypeOrmModule],
  providers: [MigrationService, UserSeedService, RolesSeedService, NotificationTemplateSeedService, DrizzleMigrateService],
})
export class MigrationModule implements OnModuleInit {
  constructor(
    private readonly migrationService: MigrationService,
    private readonly drizzleMigrateService: DrizzleMigrateService,
    private readonly templateSeedService: TemplateSeedService,
  ) {}

  async onModuleInit() {
    await this.drizzleMigrateService.runMigrations();
    await this.migrationService.migrateAndSeed();
    await this.templateSeedService.seedTemplates();
  }
}
