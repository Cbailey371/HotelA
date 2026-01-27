// src/cloudinary/cloudinary.service.ts → ahora supabase.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly supabase: SupabaseClient;
  private readonly bucketName: string;
  private readonly useLocal: boolean = false;
  private readonly uploadDir: string = path.join(process.cwd(), 'uploads');
  private readonly appBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseKey = this.configService.get<string>('supabase.anonKey');
    this.bucketName =
      this.configService.get<string>('supabase.bucket') || 'uploads';
    this.appBaseUrl = this.configService.get<string>('app.url') || '';

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      this.useLocal = true;
      this.logger.warn(
        'Supabase configuration missing. StorageService will use local storage.',
      );
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }
    }
  }

  private bufferToStream(buffer: Buffer): Readable {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }

  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ url: string; path: string }> {
    try {
      if (this.useLocal) {
        const fileName = `${Date.now()}_${file.originalname}`;
        const filePath = path.join(this.uploadDir, fileName);
        fs.writeFileSync(filePath, file.buffer);
        const url = `${this.appBaseUrl}/api/v1/uploads/${fileName}`;
        return { url, path: fileName };
      }

      if (!this.supabase) {
        this.logger.warn('Storage disabled: Supabase not configured');
        return { url: '', path: '' };
      }
      const filePath = `${Date.now()}_${file.originalname}`;
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = this.supabase.storage.from(this.bucketName).getPublicUrl(data.path);

      return { url: publicUrl, path: data.path };
    } catch (error) {
      this.logger.error('Error uploading file', error);
      throw error;
    }
  }

  async deleteFile(pathFile: string): Promise<boolean> {
    try {
      if (this.useLocal) {
        const fullPath = path.join(this.uploadDir, pathFile);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
        return true;
      }

      if (!this.supabase) return false;
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([pathFile]);
      if (error) throw error;
      return true;
    } catch (error) {
      this.logger.error('Error deleting file', error);
      return false;
    }
  }

  async deleteByUrl(url: string): Promise<boolean> {
    try {
      if (this.useLocal) {
        const fileName = url.split('/').pop();
        if (fileName) return await this.deleteFile(fileName);
        return false;
      }

      const bucketUrl = `${this.configService.get<string>('supabase.url')}/storage/v1/object/public/${this.bucketName}/`;
      const pathFile = url.replace(bucketUrl, '');
      return await this.deleteFile(pathFile);
    } catch (error) {
      this.logger.error('Error deleting file by URL', error);
      return false;
    }
  }
}
