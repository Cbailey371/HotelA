import { ApiProperty } from '@nestjs/swagger';
import { $Enums } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateMaintenanceDto {
  @ApiProperty({ type: String })
  @IsUUID()
  assetId: string;

  @ApiProperty({ type: String })
  @IsString()
  maintenanceCode: string;

  @ApiProperty({ type: String })
  @IsEnum($Enums.MaintenanceType)
  maintenanceType: $Enums.MaintenanceType;

  @ApiProperty({ type: String })
  @IsString()
  description: string;

  @ApiProperty({ type: Date })
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  scheduledDate: Date;

  @ApiProperty({ type: String })
  @IsEnum($Enums.Frequency)
  frequency: $Enums.Frequency;

  @ApiProperty({ type: String })
  @IsEnum($Enums.Priority)
  priority: $Enums.Priority;

  @ApiProperty({ type: String })
  @IsString()
  responsible: string;

  @ApiProperty({ type: String })
  @IsEnum($Enums.MaintenanceStatus)
  status: $Enums.MaintenanceStatus;

  @ApiProperty({ type: Number })
  @IsNumber()
  @Min(0)
  estimatedCost: number;

  @ApiProperty({ type: Number })
  @IsInt()
  @Min(0)
  @Max(365)
  alertDaysBefore: number;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsUUID()
  providerId?: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsUUID()
  technicianId?: string;
}
