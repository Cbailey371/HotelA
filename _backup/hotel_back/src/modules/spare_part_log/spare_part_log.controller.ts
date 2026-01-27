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
import { SparePartLogService } from './spare_part_log.service';
import { CreateSparePartLogDto } from './dto/create-spare_part_log.dto';
import { UpdateSparePartLogDto } from './dto/update-spare_part_log.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SparePartLogEntity } from './entities/spare_part_log.entity';
import ApiOkBaseResponse from '@decorators/api-ok-base-response.decorator';
import { CustomWherePipe } from '@providers/custom-where.pipe';
import CustomOrderByPipe from '@providers/custom-order-by.pipe';
import { Prisma } from '@prisma/client';

@ApiTags('Spare Part Logs')
@ApiBearerAuth()
@Controller('spare-part-logs')
export class SparePartLogController {
  constructor(private readonly sparePartLogService: SparePartLogService) {}

  @Post()
  @ApiCreatedResponse({ type: SparePartLogEntity })
  create(@Body() createSparePartLogDto: CreateSparePartLogDto) {
    return this.sparePartLogService.create(createSparePartLogDto);
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
  @ApiOkBaseResponse({ dto: SparePartLogEntity, isArray: true, meta: true })
  findAll(
    @Query('where', CustomWherePipe) where?: Prisma.SparePartLogWhereInput,
    @Query('orderBy', CustomOrderByPipe)
    orderBy?: Prisma.SparePartLogOrderByWithRelationInput,
    @Query('page')
    page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.sparePartLogService.findAll(where, orderBy, page, perPage);
  }

  @Get(':id')
  @ApiOkBaseResponse({ dto: SparePartLogEntity })
  findOne(@Param('id') id: string) {
    return this.sparePartLogService.findOne(id);
  }

  @Patch(':id')
  @ApiCreatedResponse({ type: SparePartLogEntity })
  update(
    @Param('id') id: string,
    @Body() updateSparePartLogDto: UpdateSparePartLogDto,
  ) {
    return this.sparePartLogService.update(id, updateSparePartLogDto);
  }

  @Delete(':id')
  @ApiCreatedResponse({ type: SparePartLogEntity })
  remove(@Param('id') id: string) {
    return this.sparePartLogService.remove(id);
  }
}
