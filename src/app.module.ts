import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FileUploadController } from './file-upload/file-upload.controller';
import { FileUploadService } from './file-upload/file-upload.service';
import { AzureQueueService } from './queue/azure-queue.service';
import { ConfigModule } from '@nestjs/config';
import { QueueWorkerService } from './queue/queue-worker.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController, FileUploadController],
  providers: [
    AppService,
    FileUploadService,
    AzureQueueService,
    QueueWorkerService,
  ],
})
export class AppModule {}
