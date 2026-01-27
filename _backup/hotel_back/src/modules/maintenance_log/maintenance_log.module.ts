import { Module } from '@nestjs/common';
import { MaintenanceLogService } from './maintenance_log.service';
import { MaintenanceLogController } from './maintenance_log.controller';

@Module({
  controllers: [MaintenanceLogController],
  providers: [MaintenanceLogService],
  exports: [MaintenanceLogService],
})
export class MaintenanceLogModule {}
