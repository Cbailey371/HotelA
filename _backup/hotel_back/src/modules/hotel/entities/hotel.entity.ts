import { ApiProperty } from '@nestjs/swagger';
import { Hotel } from '@prisma/client';
import { IsDate, IsString } from 'class-validator';

export class HotelEntity implements Hotel {
  @ApiProperty({ type: String })
  @IsString()
  id: string;
  @ApiProperty({ type: String })
  @IsString()
  name: string;
  @ApiProperty({ type: String })
  @IsString()
  address: string;
  @ApiProperty({ type: String })
  @IsString()
  city: string;
  @ApiProperty({ type: String })
  @IsString()
  country: string;
  @ApiProperty({ type: Date })
  @IsDate()
  createdAt: Date;
  @ApiProperty({ type: Date })
  @IsDate()
  updatedAt: Date;
}
