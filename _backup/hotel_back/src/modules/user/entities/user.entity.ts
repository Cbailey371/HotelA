import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';

type UserType = Omit<User, 'created_at' | 'updated_at' | 'password'>;

export class UserEntity implements UserType {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  email: string;

  @ApiProperty({ type: String })
  role: string;

  @ApiProperty({ type: String })
  hotelId: string;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
