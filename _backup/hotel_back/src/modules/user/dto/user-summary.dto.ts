import { ApiProperty } from '@nestjs/swagger';

export class UserSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  first_name: string;

  @ApiProperty()
  last_name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  dni: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  birth_date: Date;

  @ApiProperty()
  status: string;
}
