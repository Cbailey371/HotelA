import { Injectable } from '@nestjs/common';
import { CreateSparePartDto } from './dto/create-spare_part.dto';
import { UpdateSparePartDto } from './dto/update-spare_part.dto';
import { paginator, PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { PrismaService } from '@providers/prisma';
import { Prisma, SparePart } from '@prisma/client';

@Injectable()
export class SparePartService {
  private readonly paginate: PaginatorTypes.PaginateFunction;

  constructor(private readonly prisma: PrismaService) {
    this.paginate = paginator({
      page: 1,
      perPage: 10,
    });
  }

  create(createSparePartDto: CreateSparePartDto): Promise<SparePart> {
    return this.prisma.sparePart.create({
      data: createSparePartDto,
    });
  }

  findAll(
    where?: Prisma.SparePartWhereInput,
    orderBy?: Prisma.SparePartOrderByWithRelationInput,
    page: number = 1,
    perPage: number = 10,
  ): Promise<PaginatorTypes.PaginatedResult<SparePart>> {
    return this.paginate(
      this.prisma.sparePart,
      {
        where,
        orderBy,
        include: {
          provider: true,
          asset: true,
        },
      },
      {
        page: page,
        perPage: perPage,
      },
    );
  }

  findOne(id: string): Promise<SparePart> {
    return this.prisma.sparePart.findUnique({ where: { id } });
  }

  update(
    id: string,
    updateSparePartDto: UpdateSparePartDto,
  ): Promise<SparePart> {
    return this.prisma.sparePart.update({
      where: { id },
      data: updateSparePartDto,
    });
  }

  remove(id: string): Promise<SparePart> {
    return this.prisma.sparePart.delete({ where: { id } });
  }
}
