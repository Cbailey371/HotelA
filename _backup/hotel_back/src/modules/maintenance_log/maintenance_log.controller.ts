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
import { MaintenanceLogService } from './maintenance_log.service';
import { CreateMaintenanceLogDto } from './dto/create-maintenance_log.dto';
import { UpdateMaintenanceLogDto } from './dto/update-maintenance_log.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { MaintenanceLogEntity } from './entities/maintenance_log.entity';
import ApiOkBaseResponse from '@decorators/api-ok-base-response.decorator';
import { Prisma } from '@prisma/client';
import { CustomWherePipe } from '@providers/custom-where.pipe';
import CustomOrderByPipe from '@providers/custom-order-by.pipe';

@ApiTags('Maintenance Log')
@ApiBearerAuth()
@Controller('maintenance-logs')
export class MaintenanceLogController {
  constructor(private readonly maintenanceLogService: MaintenanceLogService) {}

  @Post()
  @ApiCreatedResponse({ type: MaintenanceLogEntity })
  create(@Body() createMaintenanceLogDto: CreateMaintenanceLogDto) {
    return this.maintenanceLogService.create(createMaintenanceLogDto);
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
  @ApiOkBaseResponse({ dto: MaintenanceLogEntity, isArray: true, meta: true })
  findAll(
    @Query('where', CustomWherePipe) where?: Prisma.MaintenanceLogWhereInput,
    @Query('orderBy', CustomOrderByPipe)
    orderBy?: Prisma.MaintenanceLogOrderByWithRelationInput,
    @Query('page')
    page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.maintenanceLogService.findAll(where, orderBy, page, perPage);
  }

  @Get(':id')
  @ApiCreatedResponse({ type: MaintenanceLogEntity })
  findOne(@Param('id') id: string) {
    return this.maintenanceLogService.findOne(id);
  }

  @Patch(':id')
  @ApiCreatedResponse({ type: MaintenanceLogEntity })
  update(
    @Param('id') id: string,
    @Body() updateMaintenanceLogDto: UpdateMaintenanceLogDto,
  ) {
    return this.maintenanceLogService.update(id, updateMaintenanceLogDto);
  }

  @Delete(':id')
  @ApiCreatedResponse({ type: MaintenanceLogEntity })
  remove(@Param('id') id: string) {
    return this.maintenanceLogService.remove(id);
  }
}
