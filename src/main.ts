import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import * as serveStatic from 'serve-static';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(serveStatic(join(__dirname, '..', 'web')));
  await app.listen(3000);
}
bootstrap();
