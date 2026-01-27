import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UsersController } from './user.controller';
import { AuthModule } from '@modules/auth/auth.module';
import { HotelModule } from '@modules/hotel/hotel.module';

@Module({
  imports: [forwardRef(() => AuthModule), HotelModule],
  controllers: [UsersController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
