import { Injectable, Logger, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { join } from 'path';
import { DRIZZLE_CONNECTION } from './drizzle.provider';
import * as schema from './schema';

@Injectable()
export class DrizzleMigrateService {
  private readonly logger = new Logger(DrizzleMigrateService.name);

  constructor(
    @Inject(DRIZZLE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async runMigrations(): Promise<void> {
    this.logger.log('Running Drizzle migrations...');
    await migrate(this.db, {
      migrationsFolder: join(__dirname, '../../../../..', 'drizzle/migrations'),
    });
    this.logger.log('Drizzle migrations completed');
  }
}
