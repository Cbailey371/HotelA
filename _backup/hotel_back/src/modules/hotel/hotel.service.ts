import { Injectable } from '@nestjs/common';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { paginator, PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { PrismaService } from '@providers/prisma';
import { Hotel, Prisma } from '@prisma/client';

@Injectable()
export class HotelService {
  private readonly paginate: PaginatorTypes.PaginateFunction;

  constructor(private readonly prisma: PrismaService) {
    this.paginate = paginator({
      page: 1,
      perPage: 10,
    });
  }

  create(createHotelDto: CreateHotelDto): Promise<Hotel> {
    return this.prisma.hotel.create({
      data: createHotelDto,
    });
  }

  findAll(
    where?: Prisma.HotelWhereInput,
    orderBy?: Prisma.HotelOrderByWithRelationInput,
    page: number = 1,
    perPage: number = 10,
  ): Promise<PaginatorTypes.PaginatedResult<Hotel>> {
    return this.paginate(
      this.prisma.hotel,
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

  findOne(id: string): Promise<Hotel> {
    return this.prisma.hotel.findUnique({ where: { id } });
  }

  async findFirst(): Promise<Hotel | null> {
    return this.prisma.hotel.findFirst();
  }

  update(id: string, updateHotelDto: UpdateHotelDto): Promise<Hotel> {
    return this.prisma.hotel.update({
      where: { id },
      data: updateHotelDto,
    });
  }

  remove(id: string): Promise<Hotel> {
    return this.prisma.hotel.delete({ where: { id } });
  }
}
