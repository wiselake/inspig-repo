import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // 프론트엔드 연동용
  await app.listen(process.env.PORT ?? 3001);
  console.log(`API Server running on http://localhost:${process.env.PORT ?? 3001}`);
}
bootstrap();
