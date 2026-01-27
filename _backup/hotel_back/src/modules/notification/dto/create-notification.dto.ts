import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ type: String })
  @IsUUID()
  hotelId: string;

  @ApiProperty({ type: String })
  @IsString()
  title: string;

  @ApiProperty({ type: String })
  @IsString()
  message: string;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  read: boolean;

  @ApiProperty({ type: String })
  @IsUUID()
  @IsOptional()
  maintenanceId?: string;

  @ApiProperty({ type: String })
  @IsUUID()
  @IsOptional()
  sparePartId?: string;
}
