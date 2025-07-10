import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import { uploadConfig } from './config/upload.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurações para upload de arquivos grandes
  app.use(json({ limit: '2gb' }));
  app.use(urlencoded({ extended: true, limit: '2gb' }));

  // Configurar timeout para uploads longos
  app.use((req: any, res: any, next: any) => {
    req.setTimeout(uploadConfig.uploadTimeout);
    res.setTimeout(uploadConfig.uploadTimeout);
    next();
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
