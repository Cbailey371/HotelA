import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTokenWhitelistDto {
  @ApiProperty({
    type: String,
    description: 'Id del usuario',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    type: String,
    description: '',
    required: false,
  })
  @IsString()
  access_token: string;

  @ApiProperty({
    type: String,
    description: '',
    required: false,
  })
  @IsString()
  refresh_token: string;

  @ApiProperty({
    type: String,
    description: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  refresh_token_id: string;
}
