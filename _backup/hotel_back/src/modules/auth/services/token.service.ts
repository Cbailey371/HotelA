import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) { }

  createAccessToken(payload: Auth.IPayload) {
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get<any>('jwt.jwtExpAccessToken'),
      secret: this.configService.get<string>('jwt.accessToken'),
    });
  }

  createRefreshToken(payload: Auth.IPayload) {
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get<any>('jwt.jwtExpRefreshToken'),
      secret: this.configService.get<string>('jwt.refreshToken'),
    });
  }

  sign(payload: Auth.IPayload, expiresIn: string, secret: string) {
    return this.jwtService.sign(payload, {
      expiresIn: expiresIn as any,
      secret,
    });
  }

  //no se usa por el momento
  async getAccessToken() {
    const api2ClientId = this.configService.get<string>('hotel.api2ClientId');
    const api2ClientSecret = this.configService.get<string>(
      'hotel.api2ClientSecret',
    );
    const auth = Buffer.from(
      api2ClientId + ':' + api2ClientSecret,
      'utf-8',
    ).toString('base64');
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get<string>('hotel.api2Base')}/api/v1/oauth2/token`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      throw new UnauthorizedException(`${error.message}`);
    }
  }
}
