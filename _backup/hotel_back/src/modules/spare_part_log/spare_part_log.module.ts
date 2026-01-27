import { Module } from '@nestjs/common';
import { SparePartLogService } from './spare_part_log.service';
import { SparePartLogController } from './spare_part_log.controller';

@Module({
  controllers: [SparePartLogController],
  providers: [SparePartLogService],
  exports: [SparePartLogService],
})
export class SparePartLogModule {}
