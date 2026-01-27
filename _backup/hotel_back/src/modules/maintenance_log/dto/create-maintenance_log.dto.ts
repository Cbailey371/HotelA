import { ApiProperty } from '@nestjs/swagger';
import { $Enums } from '@prisma/client';
import { IsEnum, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class CreateMaintenanceLogDto {
  @ApiProperty({ type: String })
  @IsString()
  result: string;

  @ApiProperty({ type: String })
  @IsUUID()
  assetId: string;

  @ApiProperty({ type: String })
  @IsUUID()
  maintenanceId: string;

  @ApiProperty({ type: String })
  @IsEnum($Enums.MaintenanceType)
  maintenanceType: $Enums.MaintenanceType;

  @ApiProperty({ type: String })
  @IsString()
  description: string;

  @ApiProperty({ type: Date })
  performedDate: Date;

  @ApiProperty({ type: Number })
  @IsNumber()
  @Min(0)
  cost: number;

  @ApiProperty({ type: String })
  @IsString()
  responsible: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  @Min(0)
  downtimeDays: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  @Min(0)
  maintenanceDurationHrs: number;

  @ApiProperty({ type: String })
  @IsString()
  notes: string;
}
