# NestJS Backend Template

Production-ready NestJS GraphQL boilerplate with DDD architecture, CQRS pattern, and comprehensive authorization system.

## Features

- **NestJS 11** with Fastify HTTP adapter
- **GraphQL** with Mercurius driver and WebSocket subscriptions
- **TypeORM** with PostgreSQL (UUID primary keys, soft delete)
- **Domain-Driven Design (DDD)** with 4 layers:
  - Domain (entities, repositories interfaces)
  - Application (commands, queries, handlers)
  - Infrastructure (TypeORM entities, repository implementations)
  - Presentation (resolvers, DTOs, mappers)
- **CQRS** pattern with command/query handlers
- **CASL** for attribute-based access control (ABAC)
- **JWT** authentication with refresh tokens
- **Pino** logging with optional GELF support
- **BullMQ** for job queues with Redis
- **i18n** internationalization (EN/RU)
- **GraphqlSearchQuery** for dynamic filtering and pagination
- **S3 Storage** for file uploads with versioning

## Quick Start

### Prerequisites

- Node.js 22+ (check `.nvmrc`)
- PostgreSQL 17+
- Redis 8+
- Yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd nestjs-backend

# Install dependencies
yarn install

# Copy and configure environment
cp config.yaml.example config.yaml
# Edit config.yaml with your settings

# Start Docker containers (PostgreSQL + Redis)
cd docker && docker-compose up -d && cd ..

# Run the application
yarn start:dev
```

### Docker Setup

```bash
cd docker
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379

## Project Structure

```
apps/backend/src/
├── common/                    # Base utilities
│   ├── base.uuid.entity.ts   # BaseUUIDMixin with soft delete
│   ├── Paginated.ts          # Generic pagination
│   ├── graphql-search-query/ # Dynamic filtering
│   └── scalars/              # Custom GraphQL scalars
├── decorators/               # Custom decorators
├── enums/                    # Application enums
├── exceptions/               # Error handling
├── factories/                # CASL, PubSub factories
├── guards/                   # JWT, Policies guards
├── interceptors/             # Logger interceptor
├── interfaces/               # Types and interfaces
├── i18n/                     # Internationalization
├── options/                  # Module configuration
├── modules/
│   ├── users/               # User management module
│   │   ├── application/     # Commands, queries, handlers
│   │   ├── domain/          # Entities, repository interfaces
│   │   ├── infrastructure/  # TypeORM, implementations
│   │   └── presentation/    # Resolvers, DTOs
│   ├── file/                # S3 file storage module
│   │   ├── application/     # Upload, download, update commands
│   │   ├── domain/          # File entities, repository
│   │   ├── infrastructure/  # S3 adapter, TypeORM entities
│   │   └── presentation/    # REST controller, GraphQL resolver
│   └── migration/           # Database seeding
├── app.module.ts
└── main.ts
```

## Module Architecture

Each module follows DDD principles:

### Domain Layer
- **Entities**: Business objects with factory methods
- **Repositories**: Abstract interfaces for data access

### Application Layer
- **Commands**: Write operations (create, update, delete)
- **Queries**: Read operations
- **Handlers**: Command/Query handlers

### Infrastructure Layer
- **Entities**: TypeORM entities
- **Repositories**: Implementation of domain repositories
- **Adapters**: External service adapters

### Presentation Layer
- **Resolvers**: GraphQL resolvers
- **DTOs**: Data Transfer Objects
- **Mappers**: Entity to DTO mapping

## Authorization

Uses CASL for fine-grained permissions:

```typescript
@Mutation()
@Policy(Actions.CREATE, Subjects.USER)
async createUser(@Args('input') input: UserCreateInput) {
  // Only users with CREATE permission on USER subject can access
}
```

### Roles

- `ADMIN` - Full access
- `MODERATOR` - Content moderation
- `USER` - Regular user access
- `PUBLIC` - Unauthenticated access

## Configuration

Configuration is stored in `config.yaml`:

```yaml
host:
  hostname: localhost
  port: 3000
  origin: http://localhost:3000
  environment: development

database:
  type: postgres
  host: localhost
  port: 5432
  db: template
  username: postgres
  password: 12345678

redis:
  host: localhost
  port: 6379

jwt:
  algorithm: SHA512
  access:
    token: your-secret
    expires: 15min
  refresh:
    token: your-refresh-secret
    expires: 7days

# Optional: S3 Storage
s3:
  accessKey: your-access-key
  secretKey: your-secret-key
  bucket: your-bucket
  region: us-east-1
  endpoint: https://storage.example.com
```

## Scripts

```bash
# Development
yarn start:dev

# Production build
yarn build
yarn start:prod

# Tests
yarn test           # Unit tests
yarn test:e2e       # E2E tests
yarn test:cov       # Coverage

# Linting
yarn lint
yarn format
```

## CI/CD

GitLab CI pipeline is configured with:

- Test stage (unit + e2e)
- Development deployment
- Production deployment

Configure deployment paths in `.gitlab-ci.yml`:
```yaml
variables:
  DEV_DEPLOY_PATH: /var/www/development/api-gateway/
  PROD_DEPLOY_PATH: /var/www/production/api-gateway/
```

## Adding New Modules

1. Create module structure:
```
modules/your-module/
├── application/
│   ├── commands/
│   ├── queries/
│   └── handlers/
├── domain/
│   ├── entities/
│   └── repositories/
├── infrastructure/
│   ├── entity/
│   ├── repositories/
│   └── adapters/
├── presentation/
│   ├── resolvers/
│   ├── dtos/
│   └── mappers/
└── your-module.module.ts
```

2. Register in `app.module.ts`

3. Add permissions in `enums/subjects.enum.ts`

4. Configure CASL abilities in `factories/casl-ability.factory.ts`

## License

MIT
