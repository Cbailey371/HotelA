import { IS_SKIP_AUTH_KEY } from '@modules/auth/guards/skip-auth.guard';
import { TokenWhitelistService } from '@modules/token_whitelist/token_whitelist.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { token_whitelist } from '@prisma/client';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenWhitelistService: TokenWhitelistService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    const isSkipAuth = this.reflector.getAllAndOverride<boolean>(
      IS_SKIP_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isSkipAuth) {
      return true;
    }
    if (!token) {
      throw new ForbiddenException('Token invalido');
    }

    const tokenData = await this.getTokenData(token);

    if (!tokenData) {
      throw new ForbiddenException('Token invalido');
    }

    try {
      const user = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.accessToken'),
      });

      request['user'] = user;
      request['user']._meta = {
        accessToken: token,
      };
    } catch {
      if (tokenData) {
        this.tokenWhitelistService.removeMany({
          user_id: tokenData.user_id,
        });
      }
      //this.cacheManager.del(token);

      throw new ForbiddenException('Token invalido');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async getTokenData(token: string): Promise<token_whitelist | null> {
    /* const tokenDataCache: TokenWhiteList | null =
      await this.cacheManager.get(token);
    if (tokenDataCache) return tokenDataCache; */
    const tokenData = await this.tokenWhitelistService.findOneByArgs({
      access_token: token,
    });
    /* await this.cacheManager.set(
      token,
      tokenData,
      this.configService.get<number>('jwt.cacheTtl'),
    ); */
    return tokenData;
  }
}
