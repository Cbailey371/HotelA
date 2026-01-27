import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { StorageService } from './storage.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
