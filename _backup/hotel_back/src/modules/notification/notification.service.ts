import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { paginator, PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { PrismaService } from '@providers/prisma';
import { Notification, Prisma } from '@prisma/client';

@Injectable()
export class NotificationService {
  private readonly paginate: PaginatorTypes.PaginateFunction;

  constructor(private readonly prisma: PrismaService) {
    this.paginate = paginator({
      page: 1,
      perPage: 10,
    });
  }
  create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    return this.prisma.notification.create({
      data: createNotificationDto,
    });
  }

  findAll(
    where?: Prisma.NotificationWhereInput,
    orderBy?: Prisma.NotificationOrderByWithRelationInput,
    page: number = 1,
    perPage: number = 10,
  ): Promise<PaginatorTypes.PaginatedResult<Notification>> {
    return this.paginate(
      this.prisma.notification,
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

  findOne(id: string): Promise<Notification> {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  update(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data: updateNotificationDto,
    });
  }

  remove(id: string): Promise<Notification> {
    return this.prisma.notification.delete({ where: { id } });
  }
}
