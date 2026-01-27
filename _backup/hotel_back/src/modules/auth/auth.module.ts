import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from '@modules/auth/auth.service';
import { AuthController } from '@modules/auth/auth.controller';
import { EncryptionService } from '@modules/auth/services/encryption.service';
import { JwtService } from '@nestjs/jwt';
import {
  UserActiveValidatorConstraint,
  UserPasswordValidatorConstraint,
} from '@modules/auth/auth.validator';
import { TokenService } from '@modules/auth/services/token.service';
import { TokenWhitelistModule } from '@modules/token_whitelist/token_whitelist.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { UserModule } from '@modules/user/user.module';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        timeout: 5000,
        maxRedirects: 5,
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => UserModule),
    TokenWhitelistModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserActiveValidatorConstraint,
    UserPasswordValidatorConstraint,
    TokenService,
    EncryptionService,
    JwtService,
  ],
  exports: [AuthService, EncryptionService, JwtService, TokenService],
})
export class AuthModule {}
