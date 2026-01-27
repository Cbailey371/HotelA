import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { HotelService } from './hotel.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { HotelEntity } from './entities/hotel.entity';
import ApiOkBaseResponse from '@decorators/api-ok-base-response.decorator';
import { CustomWherePipe } from '@providers/custom-where.pipe';
import CustomOrderByPipe from '@providers/custom-order-by.pipe';
import { Prisma } from '@prisma/client';

@ApiTags('Hotel')
@ApiBearerAuth()
@Controller('hotels')
export class HotelController {
  constructor(private readonly hotelService: HotelService) {}

  @Post()
  @ApiCreatedResponse({ type: HotelEntity })
  create(@Body() createHotelDto: CreateHotelDto) {
    return this.hotelService.create(createHotelDto);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: 'number', example: 1 })
  @ApiQuery({
    name: 'where',
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'perPage',
    required: false,
    type: 'number',
    example: 10,
  })
  @ApiOkBaseResponse({ dto: HotelEntity, isArray: true, meta: true })
  findAll(
    @Query('where', CustomWherePipe) where?: Prisma.HotelWhereInput,
    @Query('orderBy', CustomOrderByPipe)
    orderBy?: Prisma.HotelOrderByWithRelationInput,
    @Query('page')
    page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.hotelService.findAll(where, orderBy, page, perPage);
  }

  @Get(':id')
  @ApiCreatedResponse({ type: HotelEntity })
  findOne(@Param('id') id: string) {
    return this.hotelService.findOne(id);
  }

  @Patch(':id')
  @ApiCreatedResponse({ type: HotelEntity })
  update(@Param('id') id: string, @Body() updateHotelDto: UpdateHotelDto) {
    return this.hotelService.update(id, updateHotelDto);
  }

  @Delete(':id')
  @ApiCreatedResponse({ type: HotelEntity })
  remove(@Param('id') id: string) {
    return this.hotelService.remove(id);
  }
}
