import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TokenWhitelistService } from './token_whitelist.service';
import { CreateTokenWhitelistDto } from './dto/create-token_whitelist.dto';
import { UpdateTokenWhitelistDto } from './dto/update-token_whitelist.dto';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller('token-whitelist')
@ApiExcludeController()
export class TokenWhitelistController {
  constructor(private readonly tokenWhitelistService: TokenWhitelistService) {}

  @Post()
  create(@Body() createTokenWhitelistDto: CreateTokenWhitelistDto) {
    return this.tokenWhitelistService.create(createTokenWhitelistDto);
  }

  @Get()
  findAll() {
    return this.tokenWhitelistService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tokenWhitelistService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTokenWhitelistDto: UpdateTokenWhitelistDto,
  ) {
    return this.tokenWhitelistService.update(+id, updateTokenWhitelistDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tokenWhitelistService.remove(+id);
  }
}
