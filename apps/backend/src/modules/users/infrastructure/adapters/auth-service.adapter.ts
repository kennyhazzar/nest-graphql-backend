import { createHmac } from 'node:crypto';
import { Algorithm } from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import * as ms from 'ms';
import { FastifyRequest } from 'fastify';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { DeepPartial, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { ValidateJWT, JWT_BASE_OPTIONS, JwtPayloadApp } from '@/interfaces/jwt.payload.interface';
import { UserRepository } from '@/modules/users/domain/repositories/user.repository';
import { RefreshEntity, UserEntity } from '../entity';

@Injectable()
export class AuthServiceAdapter {
  private readonly logger = new Logger(AuthServiceAdapter.name);
  private readonly pinoLogger = new PinoLogger({ pinoHttp: { level: 'debug' } });

  private accessTokenExpires: ms.StringValue;
  private refreshTokenExpires: ms.StringValue;
  private refreshToken = 'default_token';
  private refreshJwtAlgorithm: Algorithm = 'HS512';
  private static algorithm = 'sha256';
  private static accessToken = 'default_token';

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    @InjectRepository(RefreshEntity)
    private readonly refreshTokenRepository: Repository<RefreshEntity>,
  ) {
    this.accessTokenExpires = this.configService.getOrThrow<ms.StringValue>('jwt.access.expires');
    this.refreshTokenExpires = this.configService.getOrThrow<ms.StringValue>('jwt.refresh.expires');
    this.refreshToken = this.configService.getOrThrow<string>('jwt.refresh.token');
    this.refreshJwtAlgorithm = this.configService.getOrThrow<Algorithm>('jwt.refresh.jwtAlgorithm');
    AuthServiceAdapter.accessToken = this.configService.getOrThrow<string>('jwt.access.token');
    AuthServiceAdapter.algorithm = this.configService.getOrThrow<string>('jwt.algorithm');
  }

  async generateAccessToken({ userId, roleId, roleType, language }: ValidateJWT): Promise<string> {
    const opts: JwtSignOptions = {
      ...JWT_BASE_OPTIONS(userId),
      subject: String(userId),
      expiresIn: this.accessTokenExpires,
    };

    return this.jwtService.signAsync({ rid: roleId, rty: roleType, lng: language }, opts);
  }

  async generateRefreshToken(
    { id: userId, roleId, role, language }: UserEntity,
    request: FastifyRequest,
  ): Promise<string> {
    const opts: JwtSignOptions = {
      ...JWT_BASE_OPTIONS(userId),
      secret: this.refreshToken,
      algorithm: this.refreshJwtAlgorithm,
      jwtid: uuid(),
      subject: String(userId),
      expiresIn: this.refreshTokenExpires,
    };
    const refreshToken = await this.jwtService.signAsync({ rid: roleId, rty: role.type, lng: language }, opts);

    const expiresAt = new Date(Date.now() + ms(this.refreshTokenExpires ?? '7days'));
    const fingerprint = (request.headers['x-real-ip'] as string) ?? request.ip;
    const userAgent = request.headers['user-agent'];
    const refresh: DeepPartial<RefreshEntity> = {
      userId,
      isRevoked: false,
      fingerprint: fingerprint || 'unknown',
      userAgent: userAgent || 'unknown',
      refreshToken,
      expiresAt,
    };
    void this.refreshTokenRepository.save(this.refreshTokenRepository.create(refresh)).catch((error) => {
      this.logger.error(error);
    });

    return refreshToken;
  }

  async generateAccessTokenFromRefreshToken(refreshToken: string): Promise<string> {
    const credentials = await this.validateJwt(refreshToken, this.refreshToken);
    if (!credentials) {
      throw new UnauthorizedException('user.auth.invalidJwtPayload');
    }

    const user = await this.userRepository.findById(credentials.userId, {
      loadEagerRelations: false,
    });
    if (!user) {
      this.logger.error(`User with ID ${credentials.userId} not found`);
      throw new UnauthorizedException('user.notFound');
    }
    if (!user.verified) {
      this.logger.warn(`User with ID ${credentials.userId} is not verified`);
      throw new UnauthorizedException('user.auth.verified');
    }
    if (user.blocked) {
      this.logger.warn(`User with ID ${credentials.userId} is blocked`);
      throw new UnauthorizedException('user.auth.blocked');
    }

    return this.generateAccessToken(credentials);
  }

  async validateJwt(token: string, key?: string, req?: any): Promise<ValidateJWT | null> {
    try {
      const secret = key || AuthServiceAdapter.accessToken;
      const {
        sub: userId,
        rid: roleId,
        rty: roleType,
        lng: language,
      } = await this.jwtService.verifyAsync<JwtPayloadApp>(token, {
        secret,
      });

      if (!userId || !roleId || !roleType || !language) {
        throw new UnauthorizedException('user.auth.invalidJwtPayload');
      }

      return { userId, roleId, roleType, language };
    } catch (error: unknown) {
      this.pinoLogger.trace({
        msg: `JWT validation failed: ${error instanceof Error ? error.message : (error as any)}`,
        error,
        req,
      });
      return null;
    }
  }

  static validateCredentials(passwordToCheck: string, password: string): boolean {
    const hashedPassword = AuthServiceAdapter.hashPassword(password);
    return hashedPassword === passwordToCheck;
  }

  static hashPassword(password: string): string {
    const hmac = createHmac(AuthServiceAdapter.algorithm, AuthServiceAdapter.accessToken);
    hmac.update(password.normalize());
    return hmac.digest('hex');
  }
}
