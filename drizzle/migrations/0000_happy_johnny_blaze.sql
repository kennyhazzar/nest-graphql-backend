CREATE TYPE "public"."Actions" AS ENUM('create', 'read', 'update', 'delete');--> statement-breakpoint
CREATE TYPE "public"."Gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."OAuthProviderType" AS ENUM('google', 'yandex');--> statement-breakpoint
CREATE TYPE "public"."RoleType" AS ENUM('admin', 'moderator', 'user', 'public');--> statement-breakpoint
CREATE TYPE "public"."Subjects" AS ENUM('User', 'UserAdmin', 'UserRole', 'File', 'FileAdmin', 'Notification', 'Identity', 'OAuth');--> statement-breakpoint
CREATE TYPE "public"."Theme" AS ENUM('light', 'dark', 'auto', 'system');--> statement-breakpoint
CREATE TYPE "public"."FileFrom" AS ENUM('USER', 'PUBLIC');--> statement-breakpoint
CREATE TYPE "public"."FileType" AS ENUM('USER_FILE', 'IMAGE', 'VIDEO', 'DOCUMENT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."MailStatus" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."MailTemplateType" AS ENUM('welcome', 'reset-password', 'contact-form', 'magic-link-login', 'oauth-first-login', 'oauth-account-linked');--> statement-breakpoint
CREATE TYPE "public"."NotificationType" AS ENUM('SYSTEM', 'INFO', 'WARNING', 'SUCCESS', 'ERROR');--> statement-breakpoint
CREATE TABLE "identity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"userId" uuid NOT NULL,
	"providerType" "OAuthProviderType" NOT NULL,
	"providerUserId" varchar(255) NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"tokenExpiresAt" timestamp with time zone,
	"providerEmail" varchar(255),
	"avatarUrl" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "magic_link_token" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"email" varchar(255) NOT NULL,
	"token" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"isUsed" boolean DEFAULT false,
	"fingerprint" text NOT NULL,
	"userAgent" text NOT NULL,
	CONSTRAINT "magic_link_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "refresh" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"userId" uuid NOT NULL,
	"refreshToken" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"isRevoked" boolean NOT NULL,
	"fingerprint" text NOT NULL,
	"userAgent" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"roleType" "RoleType" NOT NULL,
	"action" "Actions" NOT NULL,
	"subject" "Subjects" NOT NULL,
	"description" varchar(255),
	"isActive" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"email" varchar(100) NOT NULL,
	"forgotConfirmKey" varchar,
	"emailConfirmKey" varchar,
	"verified" boolean DEFAULT false,
	"password" varchar(255),
	"name" varchar(100) NOT NULL,
	"surname" varchar(100) NOT NULL,
	"middleName" varchar(100),
	"phone" varchar(20),
	"roleId" uuid NOT NULL,
	"gender" "Gender" DEFAULT 'male',
	"birthday" timestamp with time zone,
	"blocked" boolean DEFAULT false,
	"country" varchar(2) DEFAULT 'RU',
	"language" varchar(6) DEFAULT 'ru',
	"locale" varchar(6) DEFAULT 'ru_RU',
	"theme" "Theme" DEFAULT 'light'
);
--> statement-breakpoint
CREATE TABLE "user_role" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"name" varchar(100) NOT NULL,
	"description" varchar(255) DEFAULT '',
	"type" "RoleType" DEFAULT 'user' NOT NULL,
	CONSTRAINT "user_role_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "file" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"name" varchar(255) NOT NULL,
	"path" varchar NOT NULL,
	"module" "FileFrom" NOT NULL,
	"externalId" uuid NOT NULL,
	"description" text,
	"type" "FileType" DEFAULT 'OTHER',
	"lastVersionId" uuid,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file-version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"mimetype" varchar NOT NULL,
	"size" integer NOT NULL,
	"versionId" varchar NOT NULL,
	"fileId" uuid,
	"userId" uuid
);
--> statement-breakpoint
CREATE TABLE "mail" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"to" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"templateId" uuid NOT NULL,
	"status" "MailStatus" DEFAULT 'pending',
	"variables" jsonb NOT NULL,
	"attempts" integer DEFAULT 0,
	"errorMessage" text,
	"sentAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "mail_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"name" "MailTemplateType" NOT NULL,
	"subject" varchar(500) NOT NULL,
	"content" text,
	"isActive" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"userId" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"type" "NotificationType" DEFAULT 'INFO',
	"isRead" boolean DEFAULT false,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "notification_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"name" varchar(100) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"isActive" boolean DEFAULT true
);
--> statement-breakpoint
ALTER TABLE "identity" ADD CONSTRAINT "identity_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh" ADD CONSTRAINT "refresh_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_roleId_user_role_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."user_role"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_lastVersionId_file-version_id_fk" FOREIGN KEY ("lastVersionId") REFERENCES "public"."file-version"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file-version" ADD CONSTRAINT "file-version_fileId_file_id_fk" FOREIGN KEY ("fileId") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file-version" ADD CONSTRAINT "file-version_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail" ADD CONSTRAINT "mail_templateId_mail_template_id_fk" FOREIGN KEY ("templateId") REFERENCES "public"."mail_template"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "UQ_identity_user_provider" ON "identity" USING btree ("userId","providerType");--> statement-breakpoint
CREATE INDEX "IDX_identity_provider_userid" ON "identity" USING btree ("providerType","providerUserId");--> statement-breakpoint
CREATE INDEX "IDX_identity_createdAt" ON "identity" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "IDX_identity_updatedAt" ON "identity" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "IDX_identity_deletedAt" ON "identity" USING btree ("deletedAt");--> statement-breakpoint
CREATE INDEX "IDX_magic_link_token_email" ON "magic_link_token" USING btree ("email");--> statement-breakpoint
CREATE INDEX "IDX_magic_link_token_expires" ON "magic_link_token" USING btree ("expiresAt");--> statement-breakpoint
CREATE UNIQUE INDEX "IDX_magic_link_token_token" ON "magic_link_token" USING btree ("token");--> statement-breakpoint
CREATE INDEX "IDX_magic_link_token_createdAt" ON "magic_link_token" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "IDX_magic_link_token_updatedAt" ON "magic_link_token" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "IDX_magic_link_token_deletedAt" ON "magic_link_token" USING btree ("deletedAt");--> statement-breakpoint
CREATE INDEX "IDX_refresh_createdAt" ON "refresh" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "IDX_refresh_updatedAt" ON "refresh" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "IDX_refresh_deletedAt" ON "refresh" USING btree ("deletedAt");--> statement-breakpoint
CREATE INDEX "isactive_role_idx" ON "role_permission" USING btree ("isActive","roleType");--> statement-breakpoint
CREATE INDEX "isactive_role_permission_idx" ON "role_permission" USING btree ("isActive","roleType","action","subject");--> statement-breakpoint
CREATE INDEX "IDX_role_permission_createdAt" ON "role_permission" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "IDX_role_permission_updatedAt" ON "role_permission" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "IDX_role_permission_deletedAt" ON "role_permission" USING btree ("deletedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_user_email" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "IDX_user_createdAt" ON "user" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "IDX_user_updatedAt" ON "user" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "IDX_user_deletedAt" ON "user" USING btree ("deletedAt");--> statement-breakpoint
CREATE INDEX "idx_user_role_type" ON "user_role" USING btree ("type");--> statement-breakpoint
CREATE INDEX "IDX_user_role_createdAt" ON "user_role" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "IDX_user_role_updatedAt" ON "user_role" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "IDX_user_role_deletedAt" ON "user_role" USING btree ("deletedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "U_name_module_externalId" ON "file" USING btree ("name","module","externalId");--> statement-breakpoint
CREATE UNIQUE INDEX "U_name_path" ON "file" USING btree ("name","path");--> statement-breakpoint
CREATE INDEX "idx_file_name" ON "file" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_file_path" ON "file" USING btree ("path");--> statement-breakpoint
CREATE INDEX "idx_file_module" ON "file" USING btree ("module");--> statement-breakpoint
CREATE INDEX "idx_file_externalId" ON "file" USING btree ("externalId");--> statement-breakpoint
CREATE INDEX "IDX_file_createdAt" ON "file" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "IDX_file_updatedAt" ON "file" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "IDX_file_deletedAt" ON "file" USING btree ("deletedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_version_file" ON "file-version" USING btree ("versionId","fileId");--> statement-breakpoint
CREATE INDEX "idx_file_version_versionId" ON "file-version" USING btree ("versionId");--> statement-breakpoint
CREATE INDEX "idx_file_version_userId" ON "file-version" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "IDX_file_version_createdAt" ON "file-version" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "IDX_file_version_updatedAt" ON "file-version" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "IDX_file_version_deletedAt" ON "file-version" USING btree ("deletedAt");--> statement-breakpoint
CREATE INDEX "IDX_mail_createdAt" ON "mail" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "IDX_mail_updatedAt" ON "mail" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "IDX_mail_deletedAt" ON "mail" USING btree ("deletedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "IDX_mail_template_name" ON "mail_template" USING btree ("name");--> statement-breakpoint
CREATE INDEX "IDX_mail_template_createdAt" ON "mail_template" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "IDX_mail_template_updatedAt" ON "mail_template" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "IDX_mail_template_deletedAt" ON "mail_template" USING btree ("deletedAt");--> statement-breakpoint
CREATE INDEX "IDX_notification_userId" ON "notification" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "IDX_notification_isRead" ON "notification" USING btree ("isRead");--> statement-breakpoint
CREATE INDEX "IDX_notification_type" ON "notification" USING btree ("type");--> statement-breakpoint
CREATE INDEX "IDX_notification_createdAt" ON "notification" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "IDX_notification_updatedAt" ON "notification" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "IDX_notification_deletedAt" ON "notification" USING btree ("deletedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "IDX_notification_template_name" ON "notification_template" USING btree ("name");--> statement-breakpoint
CREATE INDEX "IDX_notification_template_createdAt" ON "notification_template" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "IDX_notification_template_updatedAt" ON "notification_template" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "IDX_notification_template_deletedAt" ON "notification_template" USING btree ("deletedAt");