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
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { MaintenanceEntity } from './entities/maintenance.entity';
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
import { formatDate } from '@utils/date';
import { amountFormatter } from '@utils/price';
import { MaintenanceSchedulerService } from './maintenance-scheduler.service';

@ApiTags('Maintenance')
@ApiBearerAuth()
@Controller('maintenances')
export class MaintenanceController {
  constructor(
    private readonly maintenanceService: MaintenanceService,
    private readonly maintenanceSchedulerService: MaintenanceSchedulerService,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: MaintenanceEntity })
  create(@Body() createMaintenanceDto: CreateMaintenanceDto) {
    return this.maintenanceService.create(createMaintenanceDto);
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
  @ApiOkBaseResponse({ dto: MaintenanceEntity, isArray: true, meta: true })
  findAll(
    @Query('where', CustomWherePipe) where?: Prisma.MaintenanceWhereInput,
    @Query('orderBy', CustomOrderByPipe)
    orderBy?: Prisma.MaintenanceOrderByWithRelationInput,
    @Query('page')
    page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.maintenanceService.findAll(where, orderBy, page, perPage);
  }

  @Get('download')
  @Header('Content-Disposition', 'attachment; filename="data.xlsx"')
  async download(): Promise<StreamableFile> {
    const { data } = await this.maintenanceService.findAll({}, {}, 1, 10000);
    var exportData = data.map((item) => [
      // @ts-ignore
      `${item.asset?.name || 'No aplica'}`,
      `${item.maintenanceCode || 'No aplica'}`,
      `${item.maintenanceType || 'No aplica'}`,
      `${item.description || 'No aplica'}`,
      formatDate(item.scheduledDate, 'dd/MM/yyyy HH:mm:ss'),
      `${item.frequency || 'No aplica'}`,
      `${item.priority || 'No aplica'}`,
      `${item.status || 'No aplica'}`,
      `${item.responsible || 'No aplica'}`,
      amountFormatter(item.estimatedCost),
      `${item.alertDaysBefore} días`,
      // @ts-ignore
      `${item.provider?.name || 'No aplica'}`,
      // @ts-ignore
      `${item.technician?.name || 'No aplica'}`,
    ]);

    exportData.unshift([
      'Equipo',
      'Código',
      'Tipo',
      'Descripción',
      'Fecha programada',
      'Frecuencia',
      'Prioridad',
      'Estado',
      'Responsable',
      'Costo estimado',
      'Días de aviso',
      'Proveedor',
      'Técnico',
    ]);

    const ws = utils.aoa_to_sheet(exportData as any);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Datos');
    const buf = write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new StreamableFile(buf);
  }

  @Get(':id')
  @ApiCreatedResponse({ type: MaintenanceEntity })
  findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Patch(':id')
  @ApiCreatedResponse({ type: MaintenanceEntity })
  update(
    @Param('id') id: string,
    @Body() updateMaintenanceDto: UpdateMaintenanceDto,
  ) {
    return this.maintenanceService.update(id, updateMaintenanceDto);
  }

  @Delete(':id')
  @ApiCreatedResponse({ type: MaintenanceEntity })
  remove(@Param('id') id: string) {
    return this.maintenanceService.remove(id);
  }

  @Get('schedule/process')
  @ApiCreatedResponse({ type: MaintenanceEntity })
  processSchedule() {
    return this.maintenanceSchedulerService.handleMaintenanceScheduling();
  }

  @Get('schedule/check-upcoming')
  @ApiCreatedResponse({ type: MaintenanceEntity })
  checkUpcomingSchedule() {
    return this.maintenanceSchedulerService.checkUpcomingMaintenance();
  }
}
