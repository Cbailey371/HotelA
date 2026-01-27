import { ApiProperty } from '@nestjs/swagger';
import { $Enums, Provider } from '@prisma/client';

export class ProviderEntity implements Provider {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  taxId: string;

  @ApiProperty({ type: String })
  mainContact: string;

  @ApiProperty({ type: String })
  phone: string;

  @ApiProperty({ type: String })
  email: string;

  @ApiProperty({ type: String })
  address: string;

  @ApiProperty({ type: String })
  city: string;

  @ApiProperty({ type: String })
  country: string;

  @ApiProperty({ type: String })
  website: string;

  @ApiProperty({ type: String })
  providerType: $Enums.ProviderType;

  @ApiProperty({ type: String })
  paymentMethods: string;

  @ApiProperty({ type: String })
  notes: string;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
