import { Injectable } from '@nestjs/common';
import { CreateMaintenanceLogDto } from './dto/create-maintenance_log.dto';
import { UpdateMaintenanceLogDto } from './dto/update-maintenance_log.dto';
import { paginator, PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { PrismaService } from '@providers/prisma';
import { MaintenanceLog, Prisma } from '@prisma/client';

@Injectable()
export class MaintenanceLogService {
  private readonly paginate: PaginatorTypes.PaginateFunction;

  constructor(private readonly prisma: PrismaService) {
    this.paginate = paginator({
      page: 1,
      perPage: 10,
    });
  }

  create(
    createMaintenanceLogDto: CreateMaintenanceLogDto,
  ): Promise<MaintenanceLog> {
    return this.prisma.maintenanceLog.create({
      data: createMaintenanceLogDto,
    });
  }

  findAll(
    where?: Prisma.MaintenanceLogWhereInput,
    orderBy?: Prisma.MaintenanceLogOrderByWithRelationInput,
    page: number = 1,
    perPage: number = 10,
  ): Promise<PaginatorTypes.PaginatedResult<MaintenanceLog>> {
    return this.paginate(
      this.prisma.maintenanceLog,
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

  findOne(id: string): Promise<MaintenanceLog> {
    return this.prisma.maintenanceLog.findUnique({ where: { id } });
  }

  update(
    id: string,
    updateMaintenanceLogDto: UpdateMaintenanceLogDto,
  ): Promise<MaintenanceLog> {
    return this.prisma.maintenanceLog.update({
      where: { id },
      data: updateMaintenanceLogDto,
    });
  }

  remove(id: string): Promise<MaintenanceLog> {
    return this.prisma.maintenanceLog.delete({ where: { id } });
  }
}
