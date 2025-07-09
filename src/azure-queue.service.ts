import { Injectable, Logger } from '@nestjs/common';
import { QueueClient } from '@azure/storage-queue';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AzureQueueService {
  private readonly logger = new Logger(AzureQueueService.name);
  private queueClient: QueueClient;
  private readonly queueName = 'file-processing';

  constructor(private configService: ConfigService) {
    const connectionString = this.configService.get<string>(
      'AZURE_STORAGE_CONNECTION_STRING',
    );
    this.queueClient = new QueueClient(connectionString!, this.queueName);
  }

  async sendMessage(message: string) {
    try {
      await this.queueClient.createIfNotExists();
      await this.queueClient.sendMessage(
        Buffer.from(message).toString('base64'),
      );
      this.logger.log(`Mensagem enviada para a fila: ${this.queueName}`);
    } catch (error) {
      this.logger.error('Erro ao enviar mensagem para a fila', error);
      throw error;
    }
  }
}
