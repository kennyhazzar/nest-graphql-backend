import { Algorithm } from 'jsonwebtoken';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { CaslAbilityFactory } from '../../factories/casl-ability.factory';
import { UserEntity, RefreshEntity, UserRoleEntity, RolePermissionEntity } from './infrastructure/entity';
import { UserRepository, RolePermissionRepository, UserRoleRepository } from './domain/repositories';
import { PasswordService } from './domain/services/password.service';
import { UserRepositoryImpl, RolePermissionRepositoryImpl, UserRoleRepositoryImpl } from './infrastructure/repositories';
import { UserResolver, UserRoleResolver } from './presentation/resolvers';
import { AuthServiceAdapter } from './infrastructure/adapters/auth-service.adapter';
import { PasswordServiceAdapter } from './infrastructure/adapters/password-service.adapter';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { PoliciesService } from './infrastructure/services/policies.service';
import {
  LoginUserHandler,
  UserLogoutHandler,
  AccessFromRefreshTokenHandler,
  UserCreateHandler,
  UserUpdateHandler,
  UserDeleteHandler,
  UserUpdateThemeHandler,
  UserGetHandler,
  UserGetByIdHandler,
  UserGetByEmailHandler,
  UsersGetHandler,
  UserRoleCreateHandler,
  UserRoleUpdateHandler,
  UserRoleDeleteHandler,
  UserRoleGetByIdHandler,
  UserRolesGetHandler,
} from './application/handlers';

/**
 * Command handlers for users module
 */
const CommandHandlers = [
  LoginUserHandler,
  UserLogoutHandler,
  AccessFromRefreshTokenHandler,
  UserCreateHandler,
  UserUpdateHandler,
  UserDeleteHandler,
  UserUpdateThemeHandler,
  UserRoleCreateHandler,
  UserRoleUpdateHandler,
  UserRoleDeleteHandler,
];

/**
 * Query handlers for users module
 */
const QueryHandlers = [
  UserGetHandler,
  UserGetByIdHandler,
  UserGetByEmailHandler,
  UsersGetHandler,
  UserRoleGetByIdHandler,
  UserRolesGetHandler,
];

/**
 * Users module with authentication and authorization
 */
@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow('jwt.access.token'),
        signOptions: {
          algorithm: configService.get<Algorithm>('jwt.access.jwtAlgorithm', 'HS256'),
          expiresIn: configService.get('jwt.access.expires'),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([UserEntity, RefreshEntity, UserRoleEntity, RolePermissionEntity]),
    CqrsModule,
  ],
  providers: [
    JwtStrategy,
    CaslAbilityFactory,
    PoliciesService,
    UserResolver,
    UserRoleResolver,
    AuthServiceAdapter,
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: UserRepository,
      useClass: UserRepositoryImpl,
    },
    {
      provide: UserRoleRepository,
      useClass: UserRoleRepositoryImpl,
    },
    {
      provide: RolePermissionRepository,
      useClass: RolePermissionRepositoryImpl,
    },
    {
      provide: PasswordService,
      useClass: PasswordServiceAdapter,
    },
  ],
  exports: [
    UserRepository,
    AuthServiceAdapter,
    PasswordService,
    PoliciesService,
    CaslAbilityFactory,
    UserRoleRepository,
    RolePermissionRepository,
  ],
})
export class UsersModule {}
