import { Injectable } from '@nestjs/common';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { paginator, PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { PrismaService } from '@providers/prisma';
import { Asset, Prisma } from '@prisma/client';
import { HotelService } from '@modules/hotel/hotel.service';

@Injectable()
export class AssetService {
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

  async create(createAssetDto: CreateAssetDto): Promise<Asset> {
    const hotel = await this.hotelService.findFirst();
    return this.prisma.asset.create({
      data: { ...createAssetDto, hotelId: hotel?.id },
    });
  }

  findAll(
    where?: Prisma.AssetWhereInput,
    orderBy?: Prisma.AssetOrderByWithRelationInput,
    page: number = 1,
    perPage: number = 10,
  ): Promise<PaginatorTypes.PaginatedResult<Asset>> {
    return this.paginate(
      this.prisma.asset,
      {
        where,
        orderBy,
        include: {
          provider: true,
          location: true,
        },
      },
      {
        page: page,
        perPage: perPage,
      },
    );
  }

  findOne(id: string): Promise<Asset> {
    return this.prisma.asset.findUnique({ where: { id } });
  }

  update(id: string, updateAssetDto: UpdateAssetDto): Promise<Asset> {
    return this.prisma.asset.update({
      where: { id },
      data: updateAssetDto,
    });
  }

  remove(id: string): Promise<Asset> {
    return this.prisma.asset.delete({ where: { id } });
  }
}
