import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTechnicianDto {
  @ApiProperty({ type: String })
  @IsString()
  name: string;

  @ApiProperty({ type: String })
  @IsString()
  email: string;

  @ApiProperty({ type: String })
  @IsString()
  phone: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsUUID()
  providerId?: string;
}
