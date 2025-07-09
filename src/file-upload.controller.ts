import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileUploadService } from './file-upload.service';

@Controller('files')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files', maxCount: 20 }], {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = ['.xlsx', '.xls', '.csv'];
        if (allowed.includes(extname(file.originalname).toLowerCase())) {
          cb(null, true);
        } else {
          cb(new Error('Only xlsx, xls, csv files are allowed!'), false);
        }
      },
    }),
  )
  async uploadFiles(@UploadedFiles() files: { files?: Express.Multer.File[] }) {
    if (!files.files || files.files.length === 0) {
      return { message: 'No files uploaded' };
    }
    // Enfileirar cada arquivo para processamento
    const results = await Promise.all(
      files.files.map((file) => this.fileUploadService.enqueueFile(file)),
    );
    return { message: 'Files uploaded and enqueued', results };
  }
}
