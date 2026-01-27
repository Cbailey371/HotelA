import { ApiProperty } from '@nestjs/swagger';
import { $Enums } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateProviderDto {
  @ApiProperty({ type: String })
  @IsString()
  name: string;

  @ApiProperty({ type: String })
  @IsString()
  taxId: string;

  @ApiProperty({ type: String })
  @IsString()
  mainContact: string;

  @ApiProperty({ type: String })
  @IsString()
  phone: string;

  @ApiProperty({ type: String })
  @IsEmail()
  email: string;

  @ApiProperty({ type: String })
  @IsString()
  address: string;

  @ApiProperty({ type: String })
  @IsString()
  city: string;

  @ApiProperty({ type: String })
  @IsString()
  country: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  website: string;

  @ApiProperty({ type: String })
  @IsEnum($Enums.ProviderType)
  providerType: $Enums.ProviderType;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  paymentMethods: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  notes: string;
}
