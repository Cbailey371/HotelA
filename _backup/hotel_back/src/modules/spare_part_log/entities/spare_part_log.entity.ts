import { ApiProperty } from '@nestjs/swagger';
import { SparePartLog } from '@prisma/client';

export class SparePartLogEntity implements SparePartLog {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  maintenanceLogId: string;

  @ApiProperty({ type: String })
  sparePartId: string;

  @ApiProperty({ type: Number })
  quantityUsed: number;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
