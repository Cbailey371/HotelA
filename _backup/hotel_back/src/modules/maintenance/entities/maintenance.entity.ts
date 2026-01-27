import { ApiProperty } from '@nestjs/swagger';
import { $Enums, Maintenance } from '@prisma/client';

export class MaintenanceEntity implements Maintenance {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  assetId: string;

  @ApiProperty({ type: String })
  maintenanceCode: string;

  @ApiProperty({ type: String })
  maintenanceType: $Enums.MaintenanceType;

  @ApiProperty({ type: String })
  description: string;

  @ApiProperty({ type: Date })
  scheduledDate: Date;

  @ApiProperty({ type: String })
  frequency: $Enums.Frequency;

  @ApiProperty({ type: String })
  priority: $Enums.Priority;

  @ApiProperty({ type: String })
  responsible: string;

  @ApiProperty({ type: String })
  status: $Enums.MaintenanceStatus;

  @ApiProperty({ type: Number })
  estimatedCost: number;

  @ApiProperty({ type: Number })
  alertDaysBefore: number;

  @ApiProperty({ type: String })
  providerId: string;

  @ApiProperty({ type: String })
  technicianId: string;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
