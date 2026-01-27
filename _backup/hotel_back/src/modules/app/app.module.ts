import appConfig from '@config/app.config';
import jwtConfig from '@config/jwt.config';
import supabaseConfig from '@config/supabase.config';
import swaggerConfig from '@config/swagger.config';
import { AssetModule } from '@modules/asset/asset.module';
import { AuthModule } from '@modules/auth/auth.module';
import { AuthGuard } from '@modules/auth/guards/auth.guard';
import { FileModule } from '@modules/file/file.module';
import { HotelModule } from '@modules/hotel/hotel.module';
import { LocationModule } from '@modules/location/location.module';
import { MaintenanceModule } from '@modules/maintenance/maintenance.module';
import { MaintenanceLogModule } from '@modules/maintenance_log/maintenance_log.module';
import { NotificationModule } from '@modules/notification/notification.module';
import { ProviderModule } from '@modules/provider/provider.module';
import { SparePartModule } from '@modules/spare_part/spare_part.module';
import { SparePartLogModule } from '@modules/spare_part_log/spare_part_log.module';
import { TechnicianModule } from '@modules/technician/technician.module';
import { TokenWhiteListRepository } from '@modules/token_whitelist/token_whitelist.repository';
import { TokenWhitelistService } from '@modules/token_whitelist/token_whitelist.service';
import { UserModule } from '@modules/user/user.module';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { VersionOptions } from '@nestjs/common/interfaces';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '@providers/prisma/prisma.module';
import { StorageModule } from '@providers/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      load: [appConfig, jwtConfig, swaggerConfig, supabaseConfig],
    }),
    ScheduleModule.forRoot(),
    CacheModule.register({ isGlobal: true }),
    PrismaModule.forRoot({
      isGlobal: true,
      prismaServiceOptions: {},
    }),
    AuthModule,
    AssetModule,
    UserModule,
    HotelModule,
    LocationModule,
    MaintenanceModule,
    MaintenanceLogModule,
    NotificationModule,
    ProviderModule,
    SparePartModule,
    SparePartLogModule,
    TechnicianModule,
    FileModule,
    StorageModule,
  ],
  providers: [
    TokenWhitelistService,
    TokenWhiteListRepository,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule implements VersionOptions {
  version = '1.0';
}
