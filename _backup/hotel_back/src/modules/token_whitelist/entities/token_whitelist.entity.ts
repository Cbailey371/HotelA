import { token_whitelist } from '@prisma/client';

export class TokenWhitelistEntity implements token_whitelist {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  refresh_token_id: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}
