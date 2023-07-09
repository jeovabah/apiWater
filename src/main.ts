import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      allowedHeaders: '*',
      origin: '*',
      credentials: true,
      exposedHeaders: '*',
      maxAge: 600,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      optionsSuccessStatus: 204,
      preflightContinue: false,
    },
  });
  app.enableCors(); // Adicione esta linha para habilitar o CORS
  await app.listen(3000);
}
bootstrap();
