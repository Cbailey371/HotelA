import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { TokenService } from './services/token.service';
import { TokenWhitelistService } from '@modules/token_whitelist/token_whitelist.service';
import { UserService } from '@modules/user/user.service';
import { LoginAuthDto } from './dto/login-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly tokenService: TokenService,
    private readonly tokenWhitelistService: TokenWhitelistService,
  ) {}

  //custom
  async login(loginAuthDto: LoginAuthDto) {
    const user = await this.usersService.findOneByArgs({
      email: loginAuthDto.email,
    });
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      hotelId: user.hotelId,
    };
    const accessToken = this.tokenService.createAccessToken(payload);
    const refreshToken = this.tokenService.createRefreshToken(payload);

    // Comentar para permitir multiple login
    //this.tokenWhitelistService.removeMany({ user_id: user.id });

    const refreshTokenData = await this.tokenWhitelistService.create({
      user_id: user.id,
      access_token: null,
      refresh_token: refreshToken,
      refresh_token_id: null,
    });

    this.tokenWhitelistService.create({
      user_id: user.id,
      access_token: accessToken,
      refresh_token: null,
      refresh_token_id: refreshTokenData.id,
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
