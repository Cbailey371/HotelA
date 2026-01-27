import { Module } from '@nestjs/common';
import { SparePartService } from './spare_part.service';
import { SparePartController } from './spare_part.controller';
import { SparePartSchedulerService } from './spare_part-scheduler.service';
import { NotificationModule } from '@modules/notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [SparePartController],
  providers: [SparePartService, SparePartSchedulerService],
  exports: [SparePartService],
})
export class SparePartModule {}
