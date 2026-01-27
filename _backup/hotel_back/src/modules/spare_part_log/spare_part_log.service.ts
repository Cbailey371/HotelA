import { Injectable } from '@nestjs/common';
import { CreateSparePartLogDto } from './dto/create-spare_part_log.dto';
import { UpdateSparePartLogDto } from './dto/update-spare_part_log.dto';
import { paginator, PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { PrismaService } from '@providers/prisma';
import { Prisma, SparePartLog } from '@prisma/client';

@Injectable()
export class SparePartLogService {
  private readonly paginate: PaginatorTypes.PaginateFunction;

  constructor(private readonly prisma: PrismaService) {
    this.paginate = paginator({
      page: 1,
      perPage: 10,
    });
  }

  create(createSparePartLogDto: CreateSparePartLogDto): Promise<SparePartLog> {
    return this.prisma.sparePartLog.create({
      data: createSparePartLogDto,
    });
  }

  findAll(
    where?: Prisma.SparePartLogWhereInput,
    orderBy?: Prisma.SparePartLogOrderByWithRelationInput,
    page: number = 1,
    perPage: number = 10,
  ): Promise<PaginatorTypes.PaginatedResult<SparePartLog>> {
    return this.paginate(
      this.prisma.sparePartLog,
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

  findOne(id: string): Promise<SparePartLog> {
    return this.prisma.sparePartLog.findUnique({ where: { id } });
  }

  update(
    id: string,
    updateSparePartLogDto: UpdateSparePartLogDto,
  ): Promise<SparePartLog> {
    return this.prisma.sparePartLog.update({
      where: { id },
      data: updateSparePartLogDto,
    });
  }

  remove(id: string): Promise<SparePartLog> {
    return this.prisma.sparePartLog.delete({ where: { id } });
  }
}
