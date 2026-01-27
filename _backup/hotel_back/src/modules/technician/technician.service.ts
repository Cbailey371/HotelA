import { Injectable } from '@nestjs/common';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { paginator, PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { PrismaService } from '@providers/prisma';
import { Prisma, Technician } from '@prisma/client';

@Injectable()
export class TechnicianService {
  private readonly paginate: PaginatorTypes.PaginateFunction;

  constructor(private readonly prisma: PrismaService) {
    this.paginate = paginator({
      page: 1,
      perPage: 10,
    });
  }

  create(createTechnicianDto: CreateTechnicianDto) {
    return this.prisma.technician.create({
      data: createTechnicianDto,
    });
  }

  findAll(
    where?: Prisma.TechnicianWhereInput,
    orderBy?: Prisma.TechnicianOrderByWithRelationInput,
    page: number = 1,
    perPage: number = 10,
  ): Promise<PaginatorTypes.PaginatedResult<Technician>> {
    return this.paginate(
      this.prisma.technician,
      {
        where,
        orderBy,
        include: {
          provider: true,
        },
      },
      { page, perPage },
    );
  }

  findOne(id: string): Promise<Technician> {
    return this.prisma.technician.findUnique({
      where: { id },
      include: {
        provider: true,
      },
    });
  }

  update(
    id: string,
    updateTechnicianDto: UpdateTechnicianDto,
  ): Promise<Technician> {
    return this.prisma.technician.update({
      where: { id },
      data: updateTechnicianDto,
    });
  }

  remove(id: string): Promise<Technician> {
    return this.prisma.technician.delete({
      where: { id },
    });
  }
}
