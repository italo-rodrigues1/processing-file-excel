import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueueClient } from '@azure/storage-queue';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { parse } from 'csv-parse';

@Injectable()
export class QueueWorkerService implements OnModuleInit {
  private readonly logger = new Logger(QueueWorkerService.name);
  private queueClient: QueueClient;
  private readonly queueName = 'file-processing';
  private readonly pollInterval = 5000; // 5 segundos

  constructor(private configService: ConfigService) {
    const connectionString = this.configService.get<string>(
      'AZURE_STORAGE_CONNECTION_STRING',
    );
    this.queueClient = new QueueClient(connectionString!, this.queueName);
  }

  onModuleInit() {
    this.logger.log('Iniciando worker da fila...');
    this.pollQueue();
  }

  private async pollQueue() {
    while (true) {
      try {
        await this.queueClient.createIfNotExists();
        const response = await this.queueClient.receiveMessages({
          numberOfMessages: 1,
          visibilityTimeout: 30,
        });
        if (response.receivedMessageItems.length > 0) {
          for (const msg of response.receivedMessageItems) {
            const messageText = Buffer.from(
              msg.messageText,
              'base64',
            ).toString();
            const fileInfo = JSON.parse(messageText) as {
              filename: string;
              path: string;
            };
            this.logger.log(`Processando arquivo: ${fileInfo.filename}`);
            await this.processFile(fileInfo);
            await this.queueClient.deleteMessage(msg.messageId, msg.popReceipt);
            this.logger.log(
              `Arquivo processado e removido da fila: ${fileInfo.filename}`,
            );
          }
        }
      } catch (error) {
        this.logger.error('Erro ao processar fila', error);
      }
      await new Promise((res) => setTimeout(res, this.pollInterval));
    }
  }

  private async processFile(fileInfo: { filename: string; path: string }) {
    const ext = path.extname(fileInfo.filename).toLowerCase();
    if (ext === '.csv') {
      await this.processCsv(fileInfo.path);
    } else if (ext === '.xlsx' || ext === '.xls') {
      await this.processExcel(fileInfo.path);
    } else {
      this.logger.warn(`Extensão não suportada: ${ext}`);
    }
  }

  private async processCsv(filePath: string) {
    return new Promise<void>((resolve, reject) => {
      const stream = fs.createReadStream(filePath);
      const parser = parse({ delimiter: ',', columns: true });
      let rowCount = 0;
      parser.on('readable', () => {
        while (parser.read()) {
          rowCount++;
          // Aqui você pode processar cada linha
        }
      });
      parser.on('end', () => {
        this.logger.log(`CSV processado: ${rowCount} linhas`);
        resolve();
      });
      parser.on('error', (err) => {
        this.logger.error('Erro ao processar CSV', err);
        reject(err);
      });
      stream.pipe(parser);
    });
  }

  private async processExcel(filePath: string) {
    const workbook = XLSX.readFile(filePath, {
      type: 'file',
      cellDates: true,
    });
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null });
      this.logger.log(`Excel processado: ${rows.length} linhas`);
    }
  }
}
