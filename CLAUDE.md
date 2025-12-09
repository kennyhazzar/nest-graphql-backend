# CLAUDE.md - Project Context for AI Assistants

## Project Overview

This is a production-ready NestJS backend template with GraphQL API. It uses Domain-Driven Design (DDD) architecture with CQRS pattern.

## Technology Stack

- **Runtime**: Node.js 22+
- **Framework**: NestJS 11 with Fastify adapter (NOT Express)
- **GraphQL**: Mercurius driver (NOT Apollo)
- **Database**: PostgreSQL 17 with TypeORM
- **Cache/Queue**: Redis with BullMQ
- **Auth**: JWT with CASL for authorization
- **Storage**: S3 compatible storage (AWS S3, MinIO, etc.)
- **Logging**: Pino

## Architecture

### DDD Layers (per module)

1. **Domain** - Business logic, entities, repository interfaces
2. **Application** - CQRS commands, queries, handlers
3. **Infrastructure** - TypeORM entities, repository implementations
4. **Presentation** - GraphQL resolvers, DTOs, mappers

### Key Patterns

- **CQRS**: Separate read (queries) and write (commands) operations
- **Repository Pattern**: Abstract data access behind interfaces
- **Factory Pattern**: Entity creation through factory methods
- **Soft Delete**: All entities use `deletedAt` for soft deletion

## Important Files

- `apps/backend/src/app.module.ts` - Main module configuration
- `apps/backend/src/main.ts` - Application bootstrap with Fastify
- `config.yaml` - Application configuration (YAML format)
- `apps/backend/src/common/base.uuid.entity.ts` - Base entity mixin
- `apps/backend/src/modules/file/` - S3 file storage module

## Conventions

### Entity Creation
```typescript
// Use factory methods, not constructors
const user = UserEntity.create({
  email: 'user@example.com',
  password: hashedPassword,
  role: roleEntity,
});
```

### Commands/Queries
```typescript
// Commands for mutations
export class UserCreateCommand {
  constructor(public readonly input: UserCreateInput) {}
}

// Queries for reads
export class UserGetByIdQuery {
  constructor(public readonly id: IdType) {}
}
```

### Authorization
```typescript
// Use @Policy decorator with Actions and Subjects
@Mutation()
@Policy(Actions.CREATE, Subjects.USER_ADMIN)
async createUser(...) {}
```

## Configuration

Uses YAML config files:
- `config.yaml` - Production/Development
- `config.test.yaml` - Testing

Access via ConfigService:
```typescript
configService.getOrThrow('database.host')
```

## Common Commands

```bash
yarn start:dev      # Development server
yarn build          # Build for production
yarn test           # Unit tests
yarn test:e2e       # E2E tests
```

## Database

- PostgreSQL with `timestamptz` for dates
- UUID primary keys (auto-generated)
- Soft delete with `deletedAt` column
- TypeORM synchronize in development

## Roles System

4 base roles:
- `ADMIN` - Full system access
- `MODERATOR` - Content management
- `USER` - Regular user
- `PUBLIC` - Unauthenticated

## When Adding New Features

1. Create domain entity with factory method
2. Define repository interface in domain layer
3. Implement TypeORM entity and repository
4. Create commands/queries with handlers
5. Add GraphQL resolver with DTOs
6. Register in module and add to app.module.ts
7. Add subjects to enums if new permissions needed
