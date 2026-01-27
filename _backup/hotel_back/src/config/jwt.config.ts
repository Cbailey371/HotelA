import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  cryptrPhrase:
    process.env.CRYPTR_PHRASE ||
    process.env.JWT_CRYPTR_PHRASE ||
    'hotel_secret_key',

  secret: process.env.JWT_SECRET || 'breakout',
  accessToken: process.env.ACCESS_TOKEN || 'accessToken_breakout',
  refreshToken: process.env.REFRESH_TOKEN || 'refreshToken_breakout',

  jwtExpAccessToken: process.env.ACCESS_TOKEN_EXP || '30m', // 30m
  jwtExpRefreshToken: process.env.REFRESH_TOKEN_EXP || '1d', // 1d
  jwtLinkExpAccessToken: process.env.LINK_TOKEN_EXP || '2d', // 2d
}));
