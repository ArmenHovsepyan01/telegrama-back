import { configDotenv } from 'dotenv';
configDotenv({ path: '.env' });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transformResponse.interceptor';
import { HttpExceptionFilter } from './common/filters/httpException.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { patchNestJsSwagger } from 'nestjs-zod';
import * as cookieParser from 'cookie-parser';

async function startServer() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.use(cookieParser());

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://192.168.1.53:3000',
      'https://8a18-217-113-20-151.ngrok-free.app'
    ]
  });

  patchNestJsSwagger();
  const config = new DocumentBuilder()
    .setTitle('Telegram Backend')
    .setDescription('The Telegram Backend API description')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT || 5000, '0.0.0.0', () =>
    console.log('Server is listening on http://localhost:5000/api')
  );
}

startServer();
