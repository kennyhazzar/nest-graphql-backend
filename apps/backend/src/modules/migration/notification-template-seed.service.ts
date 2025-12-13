import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

import { NotificationTemplateEntity } from '@/modules/notification/infrastructure/entity/notification-template.entity';
import { NotificationTemplateType } from '@/modules/notification/domain/enums';

/**
 * Service for seeding notification templates
 *
 * Automatically creates all notification templates from the NotificationTemplateType enum.
 * Templates are stored in the database and can be edited by administrators.
 */
@Injectable()
export class NotificationTemplateSeedService {
  private readonly logger = new Logger(NotificationTemplateSeedService.name);

  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  /**
   * Returns default values for each notification template type
   */
  private getTemplateDefaults(templateType: NotificationTemplateType): {
    subject: string;
    content: string;
  } {
    const templates: Record<NotificationTemplateType, { subject: string; content: string }> = {
      // ==================== User notifications ====================
      [NotificationTemplateType.WELCOME]: {
        subject: 'Welcome to the platform!',
        content:
          'Hello {userName}! Welcome to our platform. We are glad to have you here. If you have any questions, feel free to reach out to our support team.',
      },
      [NotificationTemplateType.PASSWORD_CHANGED]: {
        subject: 'Your password has been changed',
        content:
          'Hello {userName}, your password was successfully changed on {date}. If you did not make this change, please contact support immediately.',
      },
      [NotificationTemplateType.PROFILE_UPDATED]: {
        subject: 'Profile updated successfully',
        content: 'Hello {userName}, your profile information has been updated successfully.',
      },

      // ==================== System notifications ====================
      [NotificationTemplateType.SYSTEM_MAINTENANCE]: {
        subject: 'Scheduled system maintenance',
        content:
          'Dear users, we will perform scheduled maintenance on {date}. The system may be temporarily unavailable. Expected downtime: {duration}.',
      },
      [NotificationTemplateType.SYSTEM]: {
        subject: 'System notification',
        content: '{content}',
      },
      [NotificationTemplateType.FEATURE_ANNOUNCEMENT]: {
        subject: 'New feature available: {featureName}',
        content:
          'We are excited to announce a new feature: {featureName}. {description}. Check it out in your dashboard!',
      },

      // ==================== Security notifications ====================
      [NotificationTemplateType.NEW_LOGIN]: {
        subject: 'New login to your account',
        content:
          'Hello {userName}, a new login to your account was detected on {date} from {location}. Device: {device}. If this was not you, please change your password immediately.',
      },
      [NotificationTemplateType.SECURITY_ALERT]: {
        subject: 'Security alert',
        content:
          'Hello {userName}, we detected suspicious activity on your account. {details}. Please review your account security settings.',
      },
    };

    return templates[templateType];
  }

  /**
   * Gets all values from the NotificationTemplateType enum
   */
  private getAllTemplateTypes(): NotificationTemplateType[] {
    return Object.values(NotificationTemplateType);
  }

  async seedIfEmpty(): Promise<void> {
    const enumTemplates = this.getAllTemplateTypes();
    this.logger.log(`Total notification templates in enum: ${enumTemplates.length}`);

    await this.entityManager.transaction(async (trans) => {
      let createdCount = 0;
      let skippedCount = 0;

      for (const templateType of enumTemplates) {
        const defaults = this.getTemplateDefaults(templateType);

        // Check if template with this name already exists
        const existingTemplate = await trans.findOne(NotificationTemplateEntity, {
          where: { name: templateType },
        });

        if (!existingTemplate) {
          await trans.save(NotificationTemplateEntity, {
            name: templateType,
            subject: defaults.subject,
            content: defaults.content,
            isActive: true,
          });
          this.logger.log(`✅ Created notification template: ${templateType}`);
          createdCount++;
        } else {
          // Don't update existing templates as they may have been edited by admin
          this.logger.debug(`⏭️  Skipped existing template: ${templateType}`);
          skippedCount++;
        }
      }

      this.logger.log(`\n=== Notification Templates Seed Summary ===`);
      this.logger.log(`✅ Created: ${createdCount}`);
      this.logger.log(`⏭️  Skipped (already exists): ${skippedCount}`);
      this.logger.log(`📊 Total: ${enumTemplates.length}`);
      this.logger.log(`============================================\n`);
    });
  }

  async clear(): Promise<void> {
    await this.entityManager.transaction(async (trans) => {
      const result = await trans.delete(NotificationTemplateEntity, {});
      this.logger.log(`Deleted ${result.affected || 0} notification templates`);
    });
  }
}
