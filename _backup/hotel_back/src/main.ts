import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from '@modules/app/app.module';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import {
  INestApplication,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import basicAuth from 'express-basic-auth';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import validationExceptionFactory from '@filters/validation-exception-factory';
import { BadRequestExceptionFilter } from '@filters/bad-request-exception.filter';
import { AccessExceptionFilter } from '@filters/access-exception.filter';
import { NotFoundExceptionFilter } from '@filters/not-found-exception.filter';
import { AllExceptionsFilter } from '@filters/all-exception.filter';
import { ValidationExceptionFilter } from '@filters/validation-exception.filter';
import { PrismaClientExceptionFilter } from '@providers/prisma/prisma-client-exception.filter';
import { ThrottlerExceptionsFilter } from '@filters/throttler-exception.filter';

async function bootstrap(): Promise<{ port: number }> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    bodyParser: true,
  });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const configService: ConfigService = app.get(ConfigService);
  const appConfig = configService.get('app');
  const swaggerConfig = configService.get('swagger');
  app.setGlobalPrefix('api');

  app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/api/v1/uploads/',
  });

  app.enableVersioning({
    type: VersioningType.URI,
  });

  {
    app.use(
      ['/docs'],
      basicAuth({
        challenge: true,
        users: {
          [swaggerConfig.user]: swaggerConfig.password,
        },
      }),
    );

    const options: Omit<OpenAPIObject, 'paths'> = new DocumentBuilder()
      .setTitle('Hotel Api v1')
      .setDescription('Hotel API v1')
      .setVersion('1.0')
      .addBearerAuth({ in: 'header', type: 'http' })
      .build();
    const document: OpenAPIObject = SwaggerModule.createDocument(app, options);

    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  {
    const options = {
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    };

    app.useGlobalPipes(
      new ValidationPipe({
        ...options,
        exceptionFactory: validationExceptionFactory,
      }),
    );
  }

  {
    const { httpAdapter } = app.get(HttpAdapterHost);

    app.useGlobalFilters(
      new AllExceptionsFilter(),
      new AccessExceptionFilter(httpAdapter),
      new NotFoundExceptionFilter(),
      new BadRequestExceptionFilter(),
      new PrismaClientExceptionFilter(httpAdapter),
      new ValidationExceptionFilter(),
      new ThrottlerExceptionsFilter(),
    );
  }

  await app.listen(appConfig.port || 4000);

  return appConfig;
}
bootstrap().then((appConfig) => {
  Logger.log(`Running in http://localhost:${appConfig.port}`, 'Bootstrap');
});
