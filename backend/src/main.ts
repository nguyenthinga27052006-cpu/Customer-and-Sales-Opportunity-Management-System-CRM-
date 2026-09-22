import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Tiền tố API toàn hệ thống
  app.setGlobalPrefix('api');

  // 2. CORS cho phép Frontend truy cập
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // 3. Validation Pipe tự động kiểm tra DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 4. Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // 5. Cấu hình Swagger / OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('CRM API Specification')
    .setDescription(
      'Hệ thống Quản lý Khách hàng và Cơ hội Bán hàng (CRM) - Tài liệu API Sprint 1 (Tài khoản, Phân quyền, Danh mục & Cấu hình)',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 CRM Backend Server đang chạy tại: http://localhost:${port}/api`);
  logger.log(`📚 Swagger API Documentation tại: http://localhost:${port}/api/docs`);
}

bootstrap();
