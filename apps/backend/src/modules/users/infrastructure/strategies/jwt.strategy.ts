import { ExtractJwt, Strategy } from 'passport-jwt';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { JwtPayloadApp, ValidateJWT } from '@/interfaces/jwt.payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secretOrKey = configService.getOrThrow<string>('jwt.access.token');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey,
    });
  }

  async validate({ sub: userId, rid: roleId, rty: roleType, lng: language }: JwtPayloadApp): Promise<ValidateJWT> {
    if (!userId || !roleId || !roleType || !language) {
      throw new BadRequestException('user.auth.invalidJwtPayload');
    }

    return { userId, roleId, roleType, language };
  }
}
