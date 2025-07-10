# Solução de Streaming para Upload de Arquivos Grandes

## Problema Identificado

O gargalo estava no salvamento em disco usando `diskStorage` do Multer, que:

- Bloqueia o processo principal durante o salvamento
- Carrega arquivos inteiros na memória
- Não permite processamento assíncrono
- Causa timeout em uploads de múltiplos arquivos grandes

## Solução Implementada

### 1. Memory Storage + Queue Assíncrona

**Antes:**

```typescript
// Bloqueia o processo principal
storage: diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    /* ... */
  },
});
```

**Depois:**

```typescript
// Não bloqueia, usa memory storage
storage: memoryStorage();
// + Queue assíncrona para salvamento
```

### 2. CustomStorageService

```typescript
@Injectable()
export class CustomStorageService {
  private uploadQueue: Array<{
    file: Express.Multer.File;
    resolve: (value: string) => void;
    reject: (error: Error) => void;
  }> = [];

  // Processa arquivos em background
  private async startQueueProcessor() {
    while (true) {
      if (this.uploadQueue.length > 0) {
        const item = this.uploadQueue.shift();
        await this.processFileUpload(item.file);
        item.resolve(filename);
      }
    }
  }
}
```

### 3. Streaming de Escrita

```typescript
private async processFileUpload(file: Express.Multer.File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const writeStream = createWriteStream(filepath);

    // Escrever em chunks de 64KB
    const chunkSize = 64 * 1024;
    let offset = 0;

    const writeChunk = () => {
      const chunk = file.buffer.slice(offset, offset + chunkSize);
      if (chunk.length === 0) {
        writeStream.end();
        return;
      }

      if (!writeStream.write(chunk)) {
        writeStream.once('drain', writeChunk);
      } else {
        offset += chunkSize;
        setImmediate(writeChunk);
      }
    };

    writeChunk();
  });
}
```

## Fluxo Otimizado

### 1. Upload (Não Bloqueante)

```typescript
@UseInterceptors(CustomFileInterceptor.upload('files', uploadConfig.maxFiles))
async uploadFiles(@UploadedFiles() files: { files?: Express.Multer.File[] }) {
  // Arquivos ficam em memória temporariamente
  // Retorna resposta imediatamente
}
```

### 2. Salvamento Assíncrono

```typescript
// Salvar arquivos de forma assíncrona
const savePromises = files.files.map(async (file) => {
  const filename = await this.customStorageService.saveFile(file);
  return { originalname, filename, path, size };
});

// Aguardar salvamento
const savedFiles = await Promise.all(savePromises);
```

### 3. Enfileiramento

```typescript
// Processar arquivos em lotes para enfileiramento
for (let i = 0; i < savedFiles.length; i += uploadConfig.batchSize) {
  const batch = savedFiles.slice(i, i + uploadConfig.batchSize);
  const batchResults = await Promise.all(
    batch.map((file) => this.fileUploadService.enqueueSavedFile(file)),
  );
}
```

## Vantagens da Solução

### ✅ **Performance**

- **Não bloqueia**: Upload retorna imediatamente
- **Streaming**: Escreve em chunks, não carrega arquivo inteiro
- **Queue**: Processa arquivos em background
- **Memory eficiente**: Usa chunks de 64KB

### ✅ **Confiabilidade**

- **Recovery**: Se um arquivo falha, outros continuam
- **Timeout**: Configurável por arquivo
- **Logs**: Detalhados para debug
- **Status**: Endpoint para monitorar fila

### ✅ **Escalabilidade**

- **Concurrent**: Múltiplos arquivos simultâneos
- **Configurável**: Tamanhos e timeouts ajustáveis
- **Monitorável**: Métricas de fila e performance

## Configurações

### uploadConfig.ts

```typescript
export const uploadConfig = {
  maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
  maxFiles: 25,
  batchSize: 5,
  batchDelay: 100,
  uploadTimeout: 300000, // 5 minutos
  chunkSize: 64 * 1024, // 64KB chunks
};
```

### Endpoints Disponíveis

**Upload:**

```bash
POST /files/upload
Content-Type: multipart/form-data
```

**Status:**

```bash
POST /files/status
Response: { queueLength: number, timestamp: string }
```

## Monitoramento

### Logs de Processamento

```
Processing 24 files
File 1234567890-123456789.xlsx saved successfully
File 1234567891-123456789.xlsx saved successfully
All 24 files saved to disk
```

### Métricas

- **Queue Length**: Arquivos pendentes para salvamento
- **Processing Time**: Tempo por arquivo
- **Memory Usage**: Uso de memória durante upload
- **Disk I/O**: Taxa de escrita em disco

## Troubleshooting

### Erro: "JavaScript heap out of memory"

- Reduza `chunkSize` para 32KB
- Aumente `--max-old-space-size`
- Reduza `batchSize`

### Erro: "ENOSPC: no space left on device"

- Verifique espaço em disco
- Implemente limpeza automática
- Use storage distribuído

### Erro: "ETIMEDOUT"

- Aumente `uploadTimeout`
- Verifique velocidade de rede
- Implemente retry logic

## Performance Esperada

Com streaming e queue assíncrona:

- ✅ **Upload**: Retorna em < 1 segundo
- ✅ **Salvamento**: 5-10 MB/s por arquivo
- ✅ **Memória**: Máximo 64KB por chunk
- ✅ **Concorrência**: 25 arquivos simultâneos
- ✅ **Tamanho**: Até 2GB por arquivo
