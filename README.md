# NestJS GraphQL Backend Template

Production-ready NestJS 11 GraphQL backend template with Domain-Driven Design (DDD), CQRS patterns, and comprehensive authorization. Built on Fastify and Mercurius for optimal performance.

## Features

- **NestJS 11** with TypeScript 5.9+
- **Fastify 5.6+** web framework (higher performance than Express)
- **GraphQL** with Mercurius driver (faster than Apollo)
- **PostgreSQL 17** with TypeORM (UUID primary keys, soft delete)
- **Domain-Driven Design (DDD)** with 4 layers:
  - **Domain**: Pure business logic, entities, repository interfaces
  - **Application**: Commands, queries, CQRS handlers
  - **Infrastructure**: TypeORM entities, repository implementations, external services
  - **Presentation**: GraphQL resolvers, DTOs, mappers
- **CQRS** (Command Query Responsibility Segregation)
- **CASL** for fine-grained attribute-based access control
- **JWT Authentication** with refresh tokens
- **GraphQL Subscriptions** for real-time updates (WebSocket)
- **Redis** for caching, pub/sub, and job queues
- **BullMQ** for asynchronous task processing
- **Pino logging** with optional GELF/Graylog support
- **i18n** internationalization (EN/RU)
- **S3-compatible storage** (AWS S3, MinIO) with file versioning
- **Argon2** password hashing
- **Database seeding** and migrations
- **Docker Compose** for local development
- **Testing infrastructure** (Jest, E2E tests)

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

## Architecture

### Domain-Driven Design (DDD)

This template follows DDD principles with clear separation of concerns across 4 layers:

```
┌─────────────────────────────────────────────────────┐
│              Presentation Layer                      │
│  (GraphQL Resolvers, DTOs, Mappers)                 │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│              Application Layer                       │
│  (Commands, Queries, Handlers - CQRS)               │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│              Domain Layer                            │
│  (Entities, Repository Interfaces, Business Logic)   │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│              Infrastructure Layer                    │
│  (TypeORM Entities, Repository Implementations)      │
└─────────────────────────────────────────────────────┘
```

#### Layer Responsibilities

**1. Domain Layer** (`domain/`)
- Pure business logic
- Domain entities with factory methods
- Repository interfaces (abstract)
- No external dependencies
- Framework-agnostic

**Example:**
```typescript
// domain/entities/user.entity.ts
export class User extends UserEntity {
  static create(data: Partial<UserEntity>): User {
    const user = new User();
    Object.assign(user, data);
    return user;
  }
}

// domain/repositories/user.repository.ts
export abstract class UserRepository {
  abstract findByEmail(email: string): Promise<User | null>;
  abstract create(user: User): Promise<User>;
}
```

**2. Application Layer** (`application/`)
- **Commands**: Write operations (Create, Update, Delete)
- **Queries**: Read operations (Get, List)
- **Handlers**: Execute commands/queries using CQRS
- Orchestrates domain logic and infrastructure

**Example:**
```typescript
// application/commands/user-create.command.ts
export class UserCreateCommand {
  constructor(public readonly input: UserCreateInput) {}
}

// application/handlers/user-create.handler.ts
@CommandHandler(UserCreateCommand)
export class UserCreateHandler implements ICommandHandler<UserCreateCommand> {
  async execute(command: UserCreateCommand): Promise<UserDto> {
    const user = User.create({ ...command.input });
    return await this.userRepository.create(user);
  }
}
```

**3. Infrastructure Layer** (`infrastructure/`)
- TypeORM entities
- Repository implementations
- External service adapters (S3, Auth, Email)
- Database-specific code

**Example:**
```typescript
// infrastructure/repositories/user.repository.impl.ts
@Injectable()
export class UserRepositoryImpl extends UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { email } });
    return entity ? User.create(entity) : null;
  }
}
```

**4. Presentation Layer** (`presentation/`)
- GraphQL resolvers
- DTOs (Input/Output)
- Mappers (Entity → DTO conversion)
- HTTP/GraphQL request handling

**Example:**
```typescript
// presentation/resolvers/user.resolver.ts
@Resolver(() => UserDto)
export class UserResolver {
  @Mutation(() => UserDto)
  async userCreate(@Args('input') input: UserCreateInput): Promise<UserDto> {
    return this.commandBus.execute(new UserCreateCommand(input));
  }
}
```

### CQRS Pattern

Commands and Queries are separated for better scalability and maintainability:

```
┌──────────────┐
│   GraphQL    │
│   Resolver   │
└──────┬───────┘
       │
       ├─→ [Command] ──→ CommandHandler ──→ Repository ──→ Database
       │      (Write)         ↓
       │                   Domain Logic
       │
       └─→ [Query] ────→ QueryHandler ────→ Repository ──→ Database
              (Read)
```

**Benefits:**
- Separate read and write concerns
- Optimize queries independently
- Scale read/write operations differently
- Clear business logic organization

**Commands Example (Write):**
```typescript
@Mutation(() => UserDto)
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Policy(Actions.CREATE, Subjects.USER_ADMIN)
async userCreate(@Args('input') input: UserCreateInput): Promise<UserDto> {
  return this.commandBus.execute(new UserCreateCommand(input));
}
```

**Queries Example (Read):**
```typescript
@Query(() => UserDto)
@UseGuards(JwtAuthGuard)
async user(@Args('id') id: string): Promise<UserDto> {
  return this.queryBus.execute(new UserGetByIdQuery(id));
}
```

## Authentication & Authorization

### JWT Authentication

**Login Flow:**
1. User submits credentials → `login` mutation
2. Server validates → returns `accessToken` + `refreshToken`
3. Client stores tokens
4. Client sends `accessToken` in `Authorization: Bearer <token>` header
5. Server validates JWT → extracts `userId` → adds to GraphQL context

**Example Login:**
```graphql
mutation Login {
  login(input: {
    email: "admin@example.com"
    password: "Admin_Password1!"
  }) {
    user {
      id
      email
      role {
        name
        type
      }
    }
    accessToken
    refreshToken
  }
}
```

**Token Refresh:**
```graphql
mutation RefreshToken {
  refreshToken(refreshToken: "your-refresh-token") {
    accessToken
    refreshToken
  }
}
```

### CASL Authorization

Fine-grained permissions using **Actions** and **Subjects**:

**Actions:**
- `CREATE`, `READ`, `UPDATE`, `DELETE`

**Subjects:**
- `USER`, `USER_ADMIN`, `FILE`, `NOTIFICATION`, etc.

**Roles:**
- `ADMIN` - Full system access
- `MODERATOR` - Content management
- `USER` - Regular user access
- `PUBLIC` - Unauthenticated access

**Usage in Resolvers:**
```typescript
@Query(() => UsersDto)
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Policy(Actions.READ, Subjects.USER_ADMIN)  // Only admins can read all users
async users(): Promise<UsersDto> {
  return this.queryBus.execute(new UsersGetQuery());
}

@Mutation(() => UserDto)
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Policy(Actions.CREATE, Subjects.USER_ADMIN)
async userCreate(@Args('input') input: UserCreateInput): Promise<UserDto> {
  return this.commandBus.execute(new UserCreateCommand(input));
}
```

**Permissions are defined in:**
`apps/backend/src/modules/users/infrastructure/services/policies.service.ts`

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

## GraphQL API

### Schema

GraphQL schema is **code-first** (generated from TypeScript decorators).

Access GraphiQL IDE at: http://localhost:3000/graphiql (if enabled in config)

### Common Queries

**Get current user:**
```graphql
query Me {
  me {
    id
    email
    role {
      name
      type
    }
    createdAt
  }
}
```

**List users (admin only):**
```graphql
query Users {
  users {
    items {
      id
      email
      createdAt
    }
    totalCount
  }
}
```

**Get user by ID:**
```graphql
query User($id: UUID!) {
  user(id: $id) {
    id
    email
    role {
      name
    }
  }
}
```

### Common Mutations

**Create user:**
```graphql
mutation CreateUser {
  userCreate(input: {
    email: "newuser@example.com"
    password: "SecurePass123!"
    roleId: "uuid-of-user-role"
  }) {
    id
    email
    createdAt
  }
}
```

**Update user:**
```graphql
mutation UpdateUser($id: UUID!) {
  userUpdate(id: $id, input: {
    email: "updated@example.com"
  }) {
    id
    email
  }
}
```

**Upload file:**
```graphql
mutation UploadFile($file: Upload!) {
  uploadFile(file: $file) {
    id
    filename
    url
  }
}
```

### Subscriptions

**Real-time notifications:**
```graphql
subscription OnNotificationCreated {
  notificationCreated {
    id
    title
    message
    createdAt
  }
}
```

## Best Practices

### 1. Entity Creation

Always use factory methods:
```typescript
// Good
const user = User.create({ email, password });

// Bad
const user = new User();
user.email = email;
```

### 2. Repository Usage

Always inject repository abstractions, not implementations:
```typescript
// Good
constructor(private readonly userRepository: UserRepository) {}

// Bad
constructor(private readonly userRepository: UserRepositoryImpl) {}
```

### 3. Authorization

Use `@Policy()` decorator for fine-grained access control:
```typescript
@Mutation(() => UserDto)
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Policy(Actions.CREATE, Subjects.USER_ADMIN)
async userCreate(...) { ... }
```

### 4. Error Handling

Throw NestJS exceptions for proper GraphQL error formatting:
```typescript
if (!user) {
  throw new NotFoundException('User not found');
}
```

### 5. DTOs vs Entities

- **Entities**: Business logic and database models
- **DTOs**: GraphQL input/output types
- **Mappers**: Convert between entities and DTOs

```typescript
// Mapper example
export class UserMapper {
  static toDto(entity: User): UserDto {
    return {
      id: entity.id,
      email: entity.email,
      createdAt: entity.createdAt,
    };
  }
}
```

### 6. Soft Delete

Soft deletes are automatic via `BaseUUIDMixin`:
```typescript
await this.repository.softDelete(id);  // Sets deletedAt
await this.repository.restore(id);     // Clears deletedAt
```

### 7. Transactions

Use TypeORM transactions for multi-step operations:
```typescript
await this.dataSource.transaction(async (manager) => {
  await manager.save(user);
  await manager.save(notification);
});
```

## Scripts

```bash
# Development
yarn start:dev          # Start with hot-reload
yarn start:debug        # Start with debugger

# Production build
yarn build              # Production build
yarn start:prod         # Start production build

# Testing
yarn test               # Unit tests
yarn test:watch         # Watch mode
yarn test:cov           # Coverage report
yarn test:e2e           # E2E tests
yarn test:e2e:debug     # Debug E2E tests

# Code Quality
yarn lint               # ESLint check
yarn format             # Prettier format

# Docker
yarn docker             # Start infrastructure
yarn docker:down        # Stop and remove containers
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
