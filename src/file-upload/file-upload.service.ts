import { Injectable } from '@nestjs/common';
import { AzureQueueService } from '../queue/azure-queue.service';
import { Inject } from '@nestjs/common';

@Injectable()
export class FileUploadService {
  constructor(
    @Inject(AzureQueueService)
    private readonly azureQueueService: AzureQueueService,
  ) {}

  async enqueueFile(file: Express.Multer.File) {
    const message = JSON.stringify({
      originalname: file.originalname,
      filename: file.filename,
      path: file.path,
      uploadedAt: new Date().toISOString(),
    });
    await this.azureQueueService.sendMessage(message);
    return {
      originalname: file.originalname,
      filename: file.filename,
      path: file.path,
      status: 'enqueued',
    };
  }
}
