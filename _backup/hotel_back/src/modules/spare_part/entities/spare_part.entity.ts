import { ApiProperty } from '@nestjs/swagger';
import { $Enums, SparePart } from '@prisma/client';

export class SparePartEntity implements SparePart {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  assetId: string;

  @ApiProperty({ type: String })
  sparePartType: $Enums.SparePartType;

  @ApiProperty({ type: String })
  model: string;

  @ApiProperty({ type: String })
  brand: string;

  @ApiProperty({ type: Number })
  year: number;

  @ApiProperty({ type: String })
  photoUrl: string;

  @ApiProperty({ type: Number })
  availableQuantity: number;

  @ApiProperty({ type: Number })
  minimumStock: number;

  @ApiProperty({ type: Number })
  estimatedUsefulLife: number;

  @ApiProperty({ type: Date })
  lastPurchaseDate: Date;

  @ApiProperty({ type: Date })
  installationDate: Date;

  @ApiProperty({ type: Date })
  expirationDate: Date;

  @ApiProperty({ type: String })
  storageLocation: string;

  @ApiProperty({ type: String })
  exactPhysicalLocation: string;

  @ApiProperty({ type: String })
  providerId: string;

  @ApiProperty({ type: Number })
  unitCost: number;

  @ApiProperty({ type: String })
  compatibilityModels: string;

  @ApiProperty({ type: String })
  locationId: string;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
