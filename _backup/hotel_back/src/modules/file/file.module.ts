import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { StorageService } from '@providers/storage/storage.service';

@Module({
  controllers: [FileController],
  providers: [StorageService],
})
export class FileModule {}
