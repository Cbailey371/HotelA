import { ApiProperty } from '@nestjs/swagger';
import { $Enums, MaintenanceLog } from '@prisma/client';

export class MaintenanceLogEntity implements MaintenanceLog {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  result: string;

  @ApiProperty({ type: String })
  videoUrl: string;

  @ApiProperty({ type: String })
  assetId: string;

  @ApiProperty({ type: String })
  maintenanceId: string;

  @ApiProperty({ type: String })
  maintenanceType: $Enums.MaintenanceType;

  @ApiProperty({ type: String })
  description: string;

  @ApiProperty({ type: Date })
  performedDate: Date;

  @ApiProperty({ type: Number })
  cost: number;

  @ApiProperty({ type: String })
  responsible: string;

  @ApiProperty({ type: Number })
  downtimeDays: number;

  @ApiProperty({ type: Number })
  maintenanceDurationHrs: number;

  @ApiProperty({ type: String })
  notes: string;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
