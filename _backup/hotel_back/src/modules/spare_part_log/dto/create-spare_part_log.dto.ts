import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class CreateSparePartLogDto {
  @ApiProperty({ type: String })
  @IsUUID()
  maintenanceLogId: string;

  @ApiProperty({ type: String })
  @IsUUID()
  sparePartId: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  @Min(1)
  quantityUsed: number;
}
