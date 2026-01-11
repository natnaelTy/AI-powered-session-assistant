import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const origin = config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  app.enableCors({ origin });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
