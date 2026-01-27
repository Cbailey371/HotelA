import { Injectable } from '@nestjs/common';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { paginator, PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { PrismaService } from '@providers/prisma';
import { Prisma, Provider } from '@prisma/client';

@Injectable()
export class ProviderService {
  private readonly paginate: PaginatorTypes.PaginateFunction;

  constructor(private readonly prisma: PrismaService) {
    this.paginate = paginator({
      page: 1,
      perPage: 10,
    });
  }

  create(createProviderDto: CreateProviderDto): Promise<Provider> {
    return this.prisma.provider.create({
      data: createProviderDto,
    });
  }

  findAll(
    where?: Prisma.ProviderWhereInput,
    orderBy?: Prisma.ProviderOrderByWithRelationInput,
    page: number = 1,
    perPage: number = 10,
  ): Promise<PaginatorTypes.PaginatedResult<Provider>> {
    return this.paginate(
      this.prisma.provider,
      {
        where,
        orderBy,
      },
      {
        page: page,
        perPage: perPage,
      },
    );
  }

  findOne(id: string): Promise<Provider> {
    return this.prisma.provider.findUnique({ where: { id } });
  }

  update(id: string, updateProviderDto: UpdateProviderDto): Promise<Provider> {
    return this.prisma.provider.update({
      where: { id },
      data: updateProviderDto,
    });
  }

  remove(id: string): Promise<Provider> {
    return this.prisma.provider.delete({ where: { id } });
  }
}
