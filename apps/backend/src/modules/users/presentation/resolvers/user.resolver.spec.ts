import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { UserResolver } from './user.resolver';
import { AuthServiceAdapter } from '../../infrastructure/adapters';
import { UserLoginInput, UserCreateInput, AuthResponseDto, UserDto } from '../dtos';
import { UserLoginCommand, UserCreateCommand } from '../../application/commands';
import { UsersGetQuery, UserGetByIdQuery } from '../../application/queries';
import { Gender } from '@/enums/gender.enum';
import { RoleType } from '@/enums/role-type.enum';
import { Theme } from '@/enums/theme.enum';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { PoliciesGuard } from '@/guards/policies.guard';

describe('UserResolver (Integration)', () => {
  let resolver: UserResolver;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let authService: jest.Mocked<AuthServiceAdapter>;

  beforeEach(async () => {
    const mockCommandBus = {
      execute: jest.fn(),
    };

    const mockQueryBus = {
      execute: jest.fn(),
    };

    const mockAuthService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
      generateCsrfToken: jest.fn().mockReturnValue('mock-csrf-token'),
      setAuthCookies: jest.fn(),
      clearAuthCookies: jest.fn(),
    };

    const mockI18nService = {
      translate: jest.fn().mockImplementation((key: string) => Promise.resolve(key)),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('HYBRID'),
      getOrThrow: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn((context: ExecutionContext) => true),
    };

    const mockPoliciesGuard = {
      canActivate: jest.fn((context: ExecutionContext) => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserResolver,
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: AuthServiceAdapter,
          useValue: mockAuthService,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(PoliciesGuard)
      .useValue(mockPoliciesGuard)
      .compile();

    resolver = module.get<UserResolver>(UserResolver);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
    authService = module.get(AuthServiceAdapter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login user and return auth response', async () => {
      // Arrange
      const loginInput: UserLoginInput = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
      };

      const mockUser: UserDto = {
        id: 'user-uuid-123',
        email: loginInput.email,
        name: 'John',
        surname: 'Doe',
        middleName: undefined,
        phone: undefined,
        gender: Gender.MALE,
        birthday: undefined,
        verified: true,
        blocked: false,
        country: "US",
        language: "en",
        locale: "en-US",
        theme: "light" as any,
        role: {
          id: 'role-uuid',
          name: 'User',
          type: RoleType.USER,
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const mockAccessToken = 'access_token_123';
      const mockRefreshToken = 'refresh_token_123';

      const mockContext = {
        req: {},
        reply: {
          setCookie: jest.fn(),
        },
      };

      commandBus.execute.mockResolvedValue(mockUser);
      authService.generateAccessToken.mockResolvedValue(mockAccessToken);
      authService.generateRefreshToken.mockResolvedValue(mockRefreshToken);

      // Act
      const result = await resolver.login(loginInput, mockContext as any);

      // Assert
      expect(commandBus.execute).toHaveBeenCalledWith(new UserLoginCommand(loginInput));
      expect(authService.generateAccessToken).toHaveBeenCalled();
      expect(authService.generateRefreshToken).toHaveBeenCalledWith(mockUser, mockContext.req);
      expect(authService.generateCsrfToken).toHaveBeenCalled();
      expect(authService.setAuthCookies).toHaveBeenCalledWith(
        mockContext.reply,
        mockAccessToken,
        mockRefreshToken,
        'mock-csrf-token',
      );
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        csrfToken: 'mock-csrf-token',
        user: mockUser,
      } satisfies AuthResponseDto);
    });

    it('should pass UserLoginCommand with correct input', async () => {
      // Arrange
      const loginInput: UserLoginInput = {
        email: 'admin@example.com',
        password: 'AdminPassword!',
      };

      const mockUser: UserDto = {
        id: 'admin-uuid',
        email: loginInput.email,
        name: 'Admin',
        surname: 'User',
        middleName: undefined,
        phone: undefined,
        gender: Gender.MALE,
        birthday: undefined,
        verified: true,
        blocked: false,
        country: "US",
        language: "en",
        locale: "en-US",
        theme: "light" as any,
        role: {
          id: 'admin-role-uuid',
          name: 'Administrator',
          type: RoleType.ADMIN,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      commandBus.execute.mockResolvedValue(mockUser);
      authService.generateAccessToken.mockResolvedValue('token');
      authService.generateRefreshToken.mockResolvedValue('refresh');

      const mockContext = {
        req: {},
        reply: {
          setCookie: jest.fn(),
        },
      };

      // Act
      await resolver.login(loginInput, mockContext as any);

      // Assert
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const executedCommand = commandBus.execute.mock.calls[0][0];
      expect(executedCommand).toBeInstanceOf(UserLoginCommand);
      expect((executedCommand as UserLoginCommand).payload).toEqual(loginInput);
    });
  });

  describe('userCreate', () => {
    it('should create a new user', async () => {
      // Arrange
      const createInput: UserCreateInput = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'Jane',
        surname: 'Smith',
        middleName: undefined,
        phone: '+1234567890',
        gender: Gender.MALE,
        birthday: undefined,
        roleId: 'role-uuid-123',
      };

      const mockCreatedUser: UserDto = {
        id: 'new-user-uuid',
        email: createInput.email,
        name: createInput.name,
        surname: createInput.surname,
        middleName: createInput.middleName,
        phone: createInput.phone,
        gender: createInput.gender ?? Gender.MALE,
        birthday: createInput.birthday,
        verified: true,
        blocked: false,
        country: "US",
        language: "en",
        locale: "en-US",
        theme: "light" as any,
        role: {
          id: createInput.roleId,
          name: 'User',
          type: RoleType.USER,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      commandBus.execute.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await resolver.userCreate(createInput);

      // Assert
      expect(commandBus.execute).toHaveBeenCalledWith(new UserCreateCommand(createInput));
      expect(result).toEqual(mockCreatedUser);
    });
  });

  describe('users', () => {
    it('should return list of users', async () => {
      // Arrange
      const mockUsers = {
        items: [
          {
            id: 'user-1',
            email: 'user1@example.com',
            name: 'User',
            surname: 'One',
            middleName: undefined,
            phone: undefined,
            gender: Gender.MALE,
            birthday: undefined,
            verified: true,
            role: { id: 'role-1', name: 'User', type: RoleType.USER },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'user-2',
            email: 'user2@example.com',
            name: 'User',
            surname: 'Two',
            middleName: undefined,
            phone: undefined,
            gender: Gender.MALE,
            birthday: undefined,
            verified: true,
            role: { id: 'role-2', name: 'Admin', type: RoleType.ADMIN },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        totalCount: 2,
      };

      queryBus.execute.mockResolvedValue(mockUsers);

      // Act
      const result = await resolver.users();

      // Assert
      expect(queryBus.execute).toHaveBeenCalledWith(new UsersGetQuery());
      expect(result).toEqual(mockUsers);
      expect(result.nodes).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });
  });

  describe('user', () => {
    it('should return user by ID', async () => {
      // Arrange
      const userId = 'user-uuid-123';
      const mockUser: UserDto = {
        id: userId,
        email: 'test@example.com',
        name: 'John',
        surname: 'Doe',
        middleName: undefined,
        phone: undefined,
        gender: Gender.MALE,
        birthday: undefined,
        verified: true,
        blocked: false,
        country: "US",
        language: "en",
        locale: "en-US",
        theme: "light" as any,
        role: {
          id: 'role-uuid',
          name: 'User',
          type: RoleType.USER,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryBus.execute.mockResolvedValue(mockUser);

      // Act
      const result = await resolver.user(userId);

      // Assert
      expect(queryBus.execute).toHaveBeenCalledWith(new UserGetByIdQuery(userId));
      expect(result).toEqual(mockUser);
    });
  });
});
