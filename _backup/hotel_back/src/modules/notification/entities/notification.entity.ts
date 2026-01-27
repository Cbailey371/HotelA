import { ApiProperty } from '@nestjs/swagger';
import { Notification } from '@prisma/client';

export class NotificationEntity implements Notification {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  hotelId: string;

  @ApiProperty({ type: String })
  title: string;

  @ApiProperty({ type: String })
  message: string;

  @ApiProperty({ type: Boolean })
  read: boolean;

  @ApiProperty({ type: String })
  maintenanceId: string;

  @ApiProperty({ type: String })
  sparePartId: string;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
