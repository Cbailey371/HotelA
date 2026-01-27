import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Header,
  StreamableFile,
  Query,
} from '@nestjs/common';
import { TechnicianService } from './technician.service';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { TechnicianEntity } from './entities/technician.entity';
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

@ApiTags('Technician')
@ApiBearerAuth()
@Controller('technicians')
export class TechnicianController {
  constructor(private readonly technicianService: TechnicianService) {}

  @Post()
  @ApiCreatedResponse({ type: TechnicianEntity })
  create(@Body() createTechnicianDto: CreateTechnicianDto) {
    return this.technicianService.create(createTechnicianDto);
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
  @ApiOkBaseResponse({ dto: TechnicianEntity, isArray: true, meta: true })
  findAll(
    @Query('where', CustomWherePipe) where?: Prisma.TechnicianWhereInput,
    @Query('orderBy', CustomOrderByPipe)
    orderBy?: Prisma.TechnicianOrderByWithRelationInput,
    @Query('page')
    page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.technicianService.findAll(where, orderBy, page, perPage);
  }

  @Get('download')
  @Header('Content-Disposition', 'attachment; filename="data.xlsx"')
  async download(): Promise<StreamableFile> {
    const { data } = await this.technicianService.findAll({}, {}, 1, 10000);

    var exportData = data.map((item) => [
      `${item.name || 'No aplica'}`,
      `${item.email || 'No aplica'}`,
      `${item.phone || 'No aplica'}`,
      // @ts-ignore
      `${item.provider?.name || 'No aplica'}`,
    ]);

    exportData.unshift(['Nombre', 'Email', 'Teléfono', 'Proveedor']);

    const ws = utils.aoa_to_sheet(exportData as any);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Datos');
    const buf = write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new StreamableFile(buf);
  }

  @Get(':id')
  @ApiCreatedResponse({ type: TechnicianEntity })
  findOne(@Param('id') id: string) {
    return this.technicianService.findOne(id);
  }

  @Patch(':id')
  @ApiCreatedResponse({ type: TechnicianEntity })
  update(
    @Param('id') id: string,
    @Body() updateTechnicianDto: UpdateTechnicianDto,
  ) {
    return this.technicianService.update(id, updateTechnicianDto);
  }

  @Delete(':id')
  @ApiCreatedResponse({ type: TechnicianEntity })
  remove(@Param('id') id: string) {
    return this.technicianService.remove(id);
  }
}
