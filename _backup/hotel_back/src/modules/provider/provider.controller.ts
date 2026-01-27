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
import { ProviderService } from './provider.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ProviderEntity } from './entities/provider.entity';
import ApiOkBaseResponse from '@decorators/api-ok-base-response.decorator';
import { CustomWherePipe } from '@providers/custom-where.pipe';
import { Prisma } from '@prisma/client';
import CustomOrderByPipe from '@providers/custom-order-by.pipe';
import { utils, write } from 'xlsx';

@ApiTags('Provider')
@ApiBearerAuth()
@Controller('providers')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Post()
  @ApiCreatedResponse({ type: ProviderEntity })
  create(@Body() createProviderDto: CreateProviderDto) {
    return this.providerService.create(createProviderDto);
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
  @ApiOkBaseResponse({ dto: ProviderEntity, isArray: true, meta: true })
  findAll(
    @Query('where', CustomWherePipe) where?: Prisma.ProviderWhereInput,
    @Query('orderBy', CustomOrderByPipe)
    orderBy?: Prisma.ProviderOrderByWithRelationInput,
    @Query('page')
    page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.providerService.findAll(where, orderBy, page, perPage);
  }

  @Get('download')
  @Header('Content-Disposition', 'attachment; filename="data.xlsx"')
  async download(): Promise<StreamableFile> {
    const { data } = await this.providerService.findAll({}, {}, 1, 10000);

    var exportData = data.map((item) => [
      `${item.name}`,
      `${item.taxId || 'No aplica'}`,
      `${item.mainContact || 'No aplica'}`,
      `${item.phone || 'No aplica'}`,
      `${item.email || 'No aplica'}`,
      `${item.address || 'No aplica'}`,
      `${item.city || 'No aplica'}`,
      `${item.country || 'No aplica'}`,
      `${item.website || 'No aplica'}`,
      `${item.providerType || 'No aplica'}`,
      `${item.paymentMethods || 'No aplica'}`,
      `${item.notes || 'No aplica'}`,
    ]);

    exportData.unshift([
      'Nombre',
      'RUC',
      'Contacto principal',
      'Teléfono',
      'Correo',
      'Dirección',
      'Ciudad',
      'País',
      'Sitio web',
      'Tipo de proveedor',
      'Métodos de pago',
      'Notas',
    ]);

    const ws = utils.aoa_to_sheet(exportData as any);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Datos');
    const buf = write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new StreamableFile(buf);
  }

  @Get(':id')
  @ApiCreatedResponse({ type: ProviderEntity })
  findOne(@Param('id') id: string) {
    return this.providerService.findOne(id);
  }

  @Patch(':id')
  @ApiCreatedResponse({ type: ProviderEntity })
  update(
    @Param('id') id: string,
    @Body() updateProviderDto: UpdateProviderDto,
  ) {
    return this.providerService.update(id, updateProviderDto);
  }

  @Delete(':id')
  @ApiCreatedResponse({ type: ProviderEntity })
  remove(@Param('id') id: string) {
    return this.providerService.remove(id);
  }
}
