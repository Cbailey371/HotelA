import { Injectable } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { paginator, PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { PrismaService } from '@providers/prisma';
import { Location, Prisma } from '@prisma/client';
import { HotelService } from '@modules/hotel/hotel.service';

@Injectable()
export class LocationService {
  private readonly paginate: PaginatorTypes.PaginateFunction;

  constructor(
    private readonly prisma: PrismaService,
    private readonly hotelService: HotelService,
  ) {
    this.paginate = paginator({
      page: 1,
      perPage: 10,
    });
  }

  async create(createLocationDto: CreateLocationDto) {
    const hotel = await this.hotelService.findFirst();
    return this.prisma.location.create({
      data: { ...createLocationDto, hotelId: hotel?.id },
    });
  }

  findAll(
    where?: Prisma.LocationWhereInput,
    orderBy?: Prisma.LocationOrderByWithRelationInput,
    page: number = 1,
    perPage: number = 10,
  ): Promise<PaginatorTypes.PaginatedResult<Location>> {
    return this.paginate(
      this.prisma.location,
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

  findOne(id: string): Promise<Location> {
    return this.prisma.location.findUnique({
      where: {
        id,
      },
    });
  }

  update(id: string, updateLocationDto: UpdateLocationDto): Promise<Location> {
    return this.prisma.location.update({
      where: {
        id,
      },
      data: updateLocationDto,
    });
  }

  remove(id: string): Promise<Location> {
    return this.prisma.location.delete({
      where: {
        id,
      },
    });
  }
}
