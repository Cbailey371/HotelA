import { ApiProperty } from '@nestjs/swagger';
import { $Enums, Asset } from '@prisma/client';

export class AssetEntity implements Asset {
  @ApiProperty({ type: String })
  id: string;
  @ApiProperty({ type: String })
  name: string;
  @ApiProperty({ type: String })
  code: string;
  @ApiProperty({ type: String })
  category: string;
  @ApiProperty({ type: String })
  assetType: $Enums.AssetType;
  @ApiProperty({ type: String })
  model: string;
  @ApiProperty({ type: String })
  brand: string;
  @ApiProperty({ type: String })
  serialNumber: string;
  @ApiProperty({ type: Number })
  year: number;
  @ApiProperty({ type: String })
  color: string;
  @ApiProperty({ type: String })
  engineNumber: string;
  @ApiProperty({ type: String })
  chassisNumber: string;
  @ApiProperty({ type: String })
  photoUrl: string;
  @ApiProperty({ type: String })
  manualUrl: string;
  @ApiProperty({ type: Number })
  quantity: number;
  @ApiProperty({ type: String })
  locationDetail: string;
  @ApiProperty({ type: String })
  responsible: string;
  @ApiProperty({ type: Date })
  acquisitionDate: Date;
  @ApiProperty({ type: Date })
  installationDate: Date;
  @ApiProperty({ type: Date })
  decommissionDate: Date;
  @ApiProperty({ type: String })
  providerId: string;
  @ApiProperty({ type: Number })
  value: number;
  @ApiProperty({ type: Number })
  usefulLife: number;
  @ApiProperty({ type: String })
  status: $Enums.AssetStatus;
  @ApiProperty({ type: String })
  notes: string;
  @ApiProperty({ type: String })
  hotelId: string;
  @ApiProperty({ type: String })
  locationId: string;
  @ApiProperty({ type: Date })
  createdAt: Date;
  @ApiProperty({ type: Date })
  updatedAt: Date;
}
