import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '@providers/prisma';
import { paginator, PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { Prisma, User } from '@prisma/client';
import { EncryptionService } from '@modules/auth/services/encryption.service';
import { HotelService } from '@modules/hotel/hotel.service';

@Injectable()
export class UserService {
  private readonly paginate: PaginatorTypes.PaginateFunction;

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly hotelService: HotelService,
  ) {
    this.paginate = paginator({
      page: 1,
      perPage: 10,
    });
  }
  async create(createUserDto: CreateUserDto): Promise<User> {
    const password = createUserDto.password
      ? this.encryptionService.encrypt(createUserDto.password)
      : null;
    const hotel = await this.hotelService.findFirst();
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        role: 'user',
        hotelId: hotel?.id,
        password,
      },
    });
  }

  findOne(params: Prisma.UserFindFirstArgs): Promise<User | null> {
    return this.prisma.user.findFirst(params);
  }

  findAll(
    where?: Prisma.UserWhereInput,
    orderBy?: Prisma.UserOrderByWithRelationInput,
    page: number = 1,
    perPage: number = 10,
  ): Promise<PaginatorTypes.PaginatedResult<User>> {
    return this.paginate(
      this.prisma.user,
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

  async findOneByArgs(
    whereInput: Prisma.UserWhereInput,
    include?: Prisma.UserInclude,
  ): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: whereInput,
      include,
    });
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<User> {
    return this.prisma.user.delete({ where: { id } });
  }
}
