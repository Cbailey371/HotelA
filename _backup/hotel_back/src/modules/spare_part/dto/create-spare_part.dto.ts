import { ApiProperty } from '@nestjs/swagger';
import { $Enums } from '@prisma/client';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateSparePartDto {
  @ApiProperty({ type: String })
  @IsString()
  name: string;

  @ApiProperty({ type: String })
  @IsUUID()
  assetId: string;

  @ApiProperty({ type: String })
  @IsEnum($Enums.SparePartType)
  sparePartType: $Enums.SparePartType;

  @ApiProperty({ type: String })
  @IsString()
  model: string;

  @ApiProperty({ type: String })
  @IsString()
  brand: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  @IsOptional()
  year?: number;

  @ApiProperty({ type: String })
  @IsUrl()
  @IsOptional()
  photoUrl?: string;

  @ApiProperty({ type: Number })
  @Min(0)
  availableQuantity: number;

  @ApiProperty({ type: Number })
  @Min(0)
  minimumStock: number;

  @ApiProperty({ type: Number })
  @Min(0)
  estimatedUsefulLife: number;

  @ApiProperty({ type: Date })
  @IsDate()
  lastPurchaseDate: Date;

  @ApiProperty({ type: Date })
  @IsDate()
  installationDate: Date;

  @ApiProperty({ type: Date })
  @IsDate()
  expirationDate: Date;

  @ApiProperty({ type: String })
  @IsString()
  storageLocation: string;

  @ApiProperty({ type: String })
  @IsString()
  exactPhysicalLocation: string;

  @ApiProperty({ type: String })
  @IsUUID()
  providerId: string;

  @ApiProperty({ type: Number })
  @Min(0)
  unitCost: number;

  @ApiProperty({ type: String })
  @IsString()
  compatibilityModels: string;
}
