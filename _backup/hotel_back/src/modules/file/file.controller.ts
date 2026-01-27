import {
  Controller,
  Post,
  Body,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiTags,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { StorageService } from '@providers/storage/storage.service';
import { IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class UploadFileDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}

class DeleteFileDto {
  @ApiProperty()
  @IsString()
  @IsUrl()
  url: string;
}

@ApiTags('Files')
@ApiBearerAuth()
@Controller('file')
export class FileController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFileDto })
  @ApiCreatedResponse({
    schema: {
      example: {
        url: 'https://hotel/file.mp4',
        publicId: 'uploads/abc123',
      },
    },
  })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    const url = await this.storageService.uploadFile(file);
    return { url };
  }

  @Post('delete')
  @ApiCreatedResponse({ schema: { example: { success: true } } })
  async deleteFile(@Body() body: DeleteFileDto) {
    if (!body.url) {
      throw new Error('No file url provided');
    }
    const success = await this.storageService.deleteByUrl(body.url);
    return { success };
  }
}
