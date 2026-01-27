import { ApiProperty } from '@nestjs/swagger';
import { Location } from '@prisma/client';

export class LocationEntity implements Location {
  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  description: string;

  @ApiProperty({ type: String })
  hotelId: string;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
