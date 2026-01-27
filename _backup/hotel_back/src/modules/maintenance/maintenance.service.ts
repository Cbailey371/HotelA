import { Injectable } from '@nestjs/common';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { paginator, PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { PrismaService } from '@providers/prisma';
import { Maintenance, Prisma } from '@prisma/client';

@Injectable()
export class MaintenanceService {
  private readonly paginate: PaginatorTypes.PaginateFunction;

  constructor(private readonly prisma: PrismaService) {
    this.paginate = paginator({
      page: 1,
      perPage: 10,
    });
  }

  create(createMaintenanceDto: CreateMaintenanceDto) {
    return this.prisma.maintenance.create({
      data: createMaintenanceDto,
    });
  }

  findAll(
    where?: Prisma.MaintenanceWhereInput,
    orderBy?: Prisma.MaintenanceOrderByWithRelationInput,
    page: number = 1,
    perPage: number = 10,
  ): Promise<PaginatorTypes.PaginatedResult<Maintenance>> {
    return this.paginate(
      this.prisma.maintenance,
      {
        where,
        orderBy,
        include: {
          asset: true,
          provider: true,
          technician: true,
        },
      },
      {
        page: page,
        perPage: perPage,
      },
    );
  }

  findOne(id: string): Promise<Maintenance> {
    return this.prisma.maintenance.findUnique({ where: { id } });
  }

  update(
    id: string,
    updateMaintenanceDto: UpdateMaintenanceDto,
  ): Promise<Maintenance> {
    return this.prisma.maintenance.update({
      where: { id },
      data: updateMaintenanceDto,
    });
  }

  remove(id: string): Promise<Maintenance> {
    return this.prisma.maintenance.delete({ where: { id } });
  }
}
