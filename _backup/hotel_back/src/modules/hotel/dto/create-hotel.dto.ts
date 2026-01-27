import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateHotelDto {
  @ApiProperty({ type: String })
  @IsString()
  name: string;

  @ApiProperty({ type: String })
  @IsString()
  address?: string;

  @ApiProperty({ type: String })
  @IsString()
  city?: string;

  @ApiProperty({ type: String })
  @IsString()
  country?: string;
}
