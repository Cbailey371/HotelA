import { Injectable } from '@nestjs/common';
import { paginator, PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { Prisma, token_whitelist } from '@prisma/client';
import { PrismaService } from '@providers/prisma';

@Injectable()
export class TokenWhiteListRepository {
  private readonly paginate: PaginatorTypes.PaginateFunction;
  constructor(private prisma: PrismaService) {
    /**
     * @desc Create a paginate function
     * @param model
     * @param options
     * @returns Promise<PaginatorTypes.PaginatedResult<T>>
     */
    this.paginate = paginator({
      page: 1,
      perPage: 10,
    });
  }

  async create(
    data: Prisma.token_whitelistCreateInput,
  ): Promise<token_whitelist> {
    // console.log(data)
    return this.prisma.token_whitelist.create({
      data,
    });
  }

  //custom
  async removeMany(where: Prisma.token_whitelistWhereInput) {
    return await this.prisma.token_whitelist.deleteMany({
      where,
    });
  }

  async findOneByArgs(
    whereInput: Prisma.token_whitelistWhereInput,
  ): Promise<token_whitelist | null> {
    return this.prisma.token_whitelist.findFirst({
      where: whereInput,
    });
  }
}
