import { DynamicModule, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaModuleOptions } from './interfaces';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {
  static forRoot(options: PrismaModuleOptions = {}): DynamicModule {
    return {
      global: options.isGlobal,
      module: PrismaModule,
      providers: [
        {
          provide: "PRISMA_SERVICE_OPTIONS",
          useValue: options.prismaServiceOptions,
        },
      ],
    };
  }
}
