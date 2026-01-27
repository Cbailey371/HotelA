import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Header,
  StreamableFile,
} from '@nestjs/common';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationEntity } from './entities/location.entity';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import ApiOkBaseResponse from '@decorators/api-ok-base-response.decorator';
import { CustomWherePipe } from '@providers/custom-where.pipe';
import CustomOrderByPipe from '@providers/custom-order-by.pipe';
import { Prisma } from '@prisma/client';
import { utils, write } from 'xlsx';

@ApiTags('Location')
@ApiBearerAuth()
@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @ApiCreatedResponse({ type: LocationEntity })
  create(@Body() createLocationDto: CreateLocationDto) {
    return this.locationService.create(createLocationDto);
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
  @ApiOkBaseResponse({ dto: LocationEntity, isArray: true, meta: true })
  findAll(
    @Query('where', CustomWherePipe) where?: Prisma.LocationWhereInput,
    @Query('orderBy', CustomOrderByPipe)
    orderBy?: Prisma.LocationOrderByWithRelationInput,
    @Query('page')
    page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.locationService.findAll(where, orderBy, page, perPage);
  }

  @Get('download')
  @Header('Content-Disposition', 'attachment; filename="data.xlsx"')
  async download(): Promise<StreamableFile> {
    const { data } = await this.locationService.findAll({}, {}, 1, 10000);

    var exportData = data.map((item) => [
      `${item.name || 'No aplica'}`,
      `${item.description || 'No aplica'}`,
    ]);

    exportData.unshift(['Nombre', 'Descripción']);

    const ws = utils.aoa_to_sheet(exportData as any);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Datos');
    const buf = write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new StreamableFile(buf);
  }

  @Get(':id')
  @ApiCreatedResponse({ type: LocationEntity })
  findOne(@Param('id') id: string) {
    return this.locationService.findOne(id);
  }

  @Patch(':id')
  @ApiCreatedResponse({ type: LocationEntity })
  update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return this.locationService.update(id, updateLocationDto);
  }

  @Delete(':id')
  @ApiCreatedResponse({ type: LocationEntity })
  remove(@Param('id') id: string) {
    return this.locationService.remove(id);
  }
}
