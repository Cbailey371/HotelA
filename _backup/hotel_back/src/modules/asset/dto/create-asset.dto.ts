import { ApiProperty } from '@nestjs/swagger';
import { $Enums } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateAssetDto {
  @ApiProperty({ type: String })
  @IsString()
  name: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  code: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  category: string;

  @ApiProperty({ type: String })
  @IsEnum($Enums.AssetType)
  assetType: $Enums.AssetType;

  @ApiProperty({ type: String })
  @IsString()
  model: string;

  @ApiProperty({ type: String })
  @IsString()
  brand: string;

  @ApiProperty({ type: String })
  @IsString()
  serialNumber: string;

  @ApiProperty({ type: Number })
  @Min(1900)
  @Max(2100)
  year: number;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  color: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  engineNumber: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  chassisNumber: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  photoUrl: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  manualUrl: string;

  @ApiProperty({ type: Number })
  @Min(1)
  quantity: number;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  locationDetail: string;

  @ApiProperty({ type: String })
  @IsString()
  responsible: string;

  @ApiProperty({ type: Date })
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsOptional()
  acquisitionDate: Date;

  @ApiProperty({ type: Date })
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsOptional()
  installationDate: Date;

  @ApiProperty({ type: Date })
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsOptional()
  decommissionDate: Date;

  @ApiProperty({ type: String })
  @IsUUID()
  providerId: string;

  @ApiProperty({ type: Number })
  @Min(0)
  value: number;

  @ApiProperty({ type: Number })
  @Min(0)
  usefulLife: number;

  @ApiProperty({ type: String })
  @IsEnum($Enums.AssetStatus)
  status: $Enums.AssetStatus;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  notes: string;

  @ApiProperty({ type: String })
  @IsUUID()
  locationId: string;
}
