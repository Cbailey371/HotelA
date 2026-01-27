import { PartialType } from '@nestjs/mapped-types';
import { CreateMaintenanceLogDto } from './create-maintenance_log.dto';

export class UpdateMaintenanceLogDto extends PartialType(CreateMaintenanceLogDto) {}
