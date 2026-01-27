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
import { SparePartService } from './spare_part.service';
import { CreateSparePartDto } from './dto/create-spare_part.dto';
import { UpdateSparePartDto } from './dto/update-spare_part.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import ApiOkBaseResponse from '@decorators/api-ok-base-response.decorator';
import { SparePartEntity } from './entities/spare_part.entity';
import { CustomWherePipe } from '@providers/custom-where.pipe';
import CustomOrderByPipe from '@providers/custom-order-by.pipe';
import { Prisma } from '@prisma/client';
import { utils, write } from 'xlsx';
import { formatDate } from '@utils/date';
import { amountFormatter } from '@utils/price';

@ApiTags('Spare Parts')
@ApiBearerAuth()
@Controller('spare-parts')
export class SparePartController {
  constructor(private readonly sparePartService: SparePartService) {}

  @Post()
  @ApiCreatedResponse({ type: SparePartEntity })
  create(@Body() createSparePartDto: CreateSparePartDto) {
    return this.sparePartService.create(createSparePartDto);
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
  @ApiOkBaseResponse({ dto: SparePartEntity, isArray: true, meta: true })
  findAll(
    @Query('where', CustomWherePipe) where?: Prisma.SparePartWhereInput,
    @Query('orderBy', CustomOrderByPipe)
    orderBy?: Prisma.SparePartOrderByWithRelationInput,
    @Query('page')
    page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.sparePartService.findAll(where, orderBy, page, perPage);
  }

  @Get('download')
  @Header('Content-Disposition', 'attachment; filename="data.xlsx"')
  async download(): Promise<StreamableFile> {
    const { data } = await this.sparePartService.findAll({}, {}, 1, 10000);

    var exportData = data.map((item) => [
      `${item.name}`,
      // @ts-ignore
      `${item.asset?.name || 'No aplica'}`,
      `${item.sparePartType || 'No aplica'}`,
      `${item.model || 'No aplica'}`,
      `${item.brand || 'No aplica'}`,
      `${item.year || 'No aplica'}`,
      `${item.availableQuantity || 'No aplica'}`,
      `${item.minimumStock || 'No aplica'}`,
      `${item.estimatedUsefulLife || 'No aplica'}`,
      formatDate(item.lastPurchaseDate, 'dd/MM/yyyy HH:mm:ss'),
      formatDate(item.installationDate, 'dd/MM/yyyy HH:mm:ss'),
      formatDate(item.expirationDate, 'dd/MM/yyyy HH:mm:ss'),
      `${item.storageLocation || 'No aplica'}`,
      `${item.exactPhysicalLocation || 'No aplica'}`,
      // @ts-ignore
      `${item.provider?.name || 'No aplica'}`,
      amountFormatter(item.unitCost),
      `${item.compatibilityModels || 'No aplica'}`,
    ]);

    exportData.unshift([
      'Nombre',
      'Equipo',
      'Tipo',
      'Modelo',
      'Marca',
      'Año',
      'Cantidad disponible',
      'Cantidad mínima',
      'Vida útil estimada',
      'Fecha de última compra',
      'Fecha de instalación',
      'Fecha de vencimiento',
      'Ubicación',
      'Ubicación exacta',
      'Proveedor',
      'Costo unitario',
      'Modelos compatibles',
    ]);

    const ws = utils.aoa_to_sheet(exportData as any);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Datos');
    const buf = write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new StreamableFile(buf);
  }

  @Get(':id')
  @ApiCreatedResponse({ type: SparePartEntity })
  findOne(@Param('id') id: string) {
    return this.sparePartService.findOne(id);
  }

  @Patch(':id')
  @ApiCreatedResponse({ type: SparePartEntity })
  update(
    @Param('id') id: string,
    @Body() updateSparePartDto: UpdateSparePartDto,
  ) {
    return this.sparePartService.update(id, updateSparePartDto);
  }

  @Delete(':id')
  @ApiCreatedResponse({ type: SparePartEntity })
  remove(@Param('id') id: string) {
    return this.sparePartService.remove(id);
  }
}
