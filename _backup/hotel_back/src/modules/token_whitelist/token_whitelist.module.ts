import { Module } from '@nestjs/common';
import { TokenWhitelistService } from './token_whitelist.service';
import { TokenWhitelistController } from './token_whitelist.controller';
import { TokenWhiteListRepository } from './token_whitelist.repository';


@Module({
  controllers: [TokenWhitelistController],
  providers: [TokenWhitelistService, TokenWhiteListRepository],
  exports: [TokenWhitelistService, TokenWhiteListRepository],
})
export class TokenWhitelistModule {}
