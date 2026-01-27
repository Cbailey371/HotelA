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
import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AssetEntity } from './entities/asset.entity';
import ApiOkBaseResponse from '@decorators/api-ok-base-response.decorator';
import { CustomWherePipe } from '@providers/custom-where.pipe';
import { Prisma } from '@prisma/client';
import CustomOrderByPipe from '@providers/custom-order-by.pipe';
import { utils, write } from 'xlsx';
import { formatDate } from '@utils/date';
import { amountFormatter } from '@utils/price';

@ApiTags('Asset')
@ApiBearerAuth()
@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  @ApiCreatedResponse({ type: AssetEntity })
  create(@Body() createAssetDto: CreateAssetDto) {
    return this.assetService.create(createAssetDto);
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
  @ApiOkBaseResponse({ dto: AssetEntity, isArray: true, meta: true })
  findAll(
    @Query('where', CustomWherePipe) where?: Prisma.AssetWhereInput,
    @Query('orderBy', CustomOrderByPipe)
    orderBy?: Prisma.AssetOrderByWithRelationInput,
    @Query('page')
    page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.assetService.findAll(where, orderBy, page, perPage);
  }

  @Get('download')
  @Header('Content-Disposition', 'attachment; filename="data.xlsx"')
  async download(): Promise<StreamableFile> {
    const { data } = await this.assetService.findAll({}, {}, 1, 10000);

    var exportData = data.map((item) => [
      `${item.name || 'No aplica'}`,
      `${item.category || 'No aplica'}`,
      `${item.assetType || 'No aplica'}`,
      `${item.locationDetail || 'No aplica'}`,
      // @ts-ignore
      `${item.location?.name || 'No aplica'}`,
      `${item.brand || 'No aplica'}`,
      `${item.model || 'No aplica'}`,
      `${item.serialNumber || 'No aplica'}`,
      `${item.year || 'No aplica'}`,
      `${item.color || 'No aplica'}`,
      `${item.engineNumber || 'No aplica'}`,
      `${item.chassisNumber || 'No aplica'}`,
      `${item.responsible || 'No aplica'}`,
      formatDate(item.acquisitionDate, 'dd/MM/yyyy HH:mm:ss'),
      formatDate(item.installationDate, 'dd/MM/yyyy HH:mm:ss'),
      formatDate(item.decommissionDate, 'dd/MM/yyyy HH:mm:ss'),
      // @ts-ignore
      `${item.provider?.name || 'No aplica'}`,
      amountFormatter(item.value),
      `${item.usefulLife} meses`,
      `${item.status || 'No aplica'}`,
      `${item.notes || 'No aplica'}`,
    ]);

    exportData.unshift([
      'Nombre',
      'Categoría',
      'Tipo de equipo',
      'Detalle de ubicación',
      'Ubicación',
      'Marca',
      'Modelo',
      'Número de serie',
      'Año',
      'Color',
      'Número de motor',
      'Número de chasis',
      'Responsable',
      'Fecha de compra',
      'Fecha de instalación',
      'Fecha de desinstalación',
      'Proveedor',
      'Costo',
      'Vida útil',
      'Estado',
      'Notas',
    ]);

    const ws = utils.aoa_to_sheet(exportData as any);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Datos');
    const buf = write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new StreamableFile(buf);
  }

  @Get(':id')
  @ApiCreatedResponse({ type: AssetEntity })
  findOne(@Param('id') id: string) {
    return this.assetService.findOne(id);
  }

  @Patch(':id')
  @ApiCreatedResponse({ type: AssetEntity })
  update(@Param('id') id: string, @Body() updateAssetDto: UpdateAssetDto) {
    return this.assetService.update(id, updateAssetDto);
  }

  @Delete(':id')
  @ApiCreatedResponse({ type: AssetEntity })
  remove(@Param('id') id: string) {
    return this.assetService.remove(id);
  }
}
