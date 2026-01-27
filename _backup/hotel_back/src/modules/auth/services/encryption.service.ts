import { Injectable } from '@nestjs/common';
import Cryptr from 'cryptr';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionService {
  private cryptr: Cryptr;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('jwt.cryptrPhrase');
    this.cryptr = new Cryptr(secretKey);
  }

  encrypt(value: string): string {
    return this.cryptr.encrypt(value);
  }

  decrypt(value: string): string {
    return this.cryptr.decrypt(value);
  }
}
