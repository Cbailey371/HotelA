import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceSchedulerService } from './maintenance-scheduler.service';
import { NotificationModule } from '@modules/notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, MaintenanceSchedulerService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
