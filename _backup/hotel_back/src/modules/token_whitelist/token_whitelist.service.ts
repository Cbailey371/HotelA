import { Injectable } from '@nestjs/common';
import { CreateTokenWhitelistDto } from './dto/create-token_whitelist.dto';
import { UpdateTokenWhitelistDto } from './dto/update-token_whitelist.dto';
import { TokenWhiteListRepository } from './token_whitelist.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class TokenWhitelistService {
  constructor(
    private readonly tokenWhiteListRepository: TokenWhiteListRepository,
  ) {}
  async create(createTokenWhitelistDto: CreateTokenWhitelistDto) {
    return this.tokenWhiteListRepository.create({
      ...createTokenWhitelistDto
    });
  }

  findAll() {
    return `This action returns all tokenWhitelist`;
  }

  findOne(id: number) {
    return `This action returns a #${id} tokenWhitelist`;
  }

  update(id: number, updateTokenWhitelistDto: UpdateTokenWhitelistDto) {
    return `This action updates a #${id} tokenWhitelist`;
  }

  remove(id: number) {
    return `This action removes a #${id} tokenWhitelist`;
  }

  //custom
  removeMany(where: Prisma.token_whitelistWhereInput) {
    return this.tokenWhiteListRepository.removeMany(where);
  }

  async findOneByArgs(whereInput: Prisma.token_whitelistWhereInput) {
    return await this.tokenWhiteListRepository.findOneByArgs(whereInput);
  }
}
