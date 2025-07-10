# Otimizações para Upload de Arquivos Grandes

## Problemas Identificados e Soluções

### 1. Limites de Tamanho de Arquivo

**Problema**: O Express e Multer têm limites padrão muito baixos para arquivos grandes.

**Solução**: Configuramos limites adequados:

- `fileSize`: 2GB por arquivo
- `files`: 25 arquivos simultâneos
- `fieldSize`: 2GB para campos

### 2. Timeout de Upload

**Problema**: Uploads de arquivos grandes podem expirar antes de completar.

**Solução**: Configuramos timeouts adequados:

- `uploadTimeout`: 5 minutos (300.000ms)
- `processingTimeout`: 10 minutos (600.000ms)

### 3. Limite de Memória

**Problema**: Node.js pode esgotar memória com arquivos grandes.

**Solução**: Configurações de memória otimizadas:

- `--max-old-space-size=4096`: 4GB de heap
- `UV_THREADPOOL_SIZE=64`: Thread pool otimizado

### 4. Processamento Síncrono

**Problema**: Todos os arquivos eram processados simultaneamente, causando sobrecarga.

**Solução**: Processamento em lotes:

- `batchSize`: 5 arquivos por vez
- `batchDelay`: 100ms entre lotes

## Configurações Implementadas

### Arquivo: `src/config/upload.config.ts`

```typescript
export const uploadConfig = {
  maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
  maxFiles: 25,
  maxFieldSize: 2 * 1024 * 1024 * 1024, // 2GB
  batchSize: 5,
  batchDelay: 100,
  uploadTimeout: 300000, // 5 minutos
  processingTimeout: 600000, // 10 minutos
  memoryLimit: '2gb',
  allowedExtensions: ['.xlsx', '.xls', '.csv'],
  uploadDir: './uploads',
};
```

### Arquivo: `src/main.ts`

- Configuração de limites de payload
- Timeout para uploads longos
- Middleware de timeout

### Arquivo: `src/file-upload/file-upload.controller.ts`

- Processamento em lotes
- Melhor tratamento de erros
- Configurações de limite do Multer

## Scripts de Inicialização

### Windows (`start-optimized.bat`)

```batch
@echo off
set NODE_OPTIONS=--max-old-space-size=4096
set UV_THREADPOOL_SIZE=64
npm run start:dev
```

### Linux/Mac (`start-optimized.sh`)

```bash
#!/bin/bash
export NODE_OPTIONS="--max-old-space-size=4096"
export UV_THREADPOOL_SIZE=64
npm run start:dev
```

## Monitoramento e Debug

### Logs de Processamento

A aplicação agora registra:

- Número de arquivos sendo processados
- Progresso do processamento em lotes
- Erros detalhados com stack trace

### Métricas Recomendadas

- Monitorar uso de memória
- Verificar tempo de upload por arquivo
- Acompanhar taxa de sucesso/erro

## Recomendações Adicionais

### Para Produção

1. **Load Balancer**: Use um load balancer para distribuir carga
2. **CDN**: Considere usar CDN para arquivos estáticos
3. **Storage**: Use storage distribuído (S3, Azure Blob)
4. **Monitoring**: Implemente APM (Application Performance Monitoring)

### Para Desenvolvimento

1. **Teste com arquivos reais**: Teste com arquivos de diferentes tamanhos
2. **Monitor de recursos**: Use ferramentas como `htop` ou `top`
3. **Logs detalhados**: Ative logs de debug quando necessário

## Troubleshooting

### Erro: "Request Entity Too Large"

- Verifique se os limites estão configurados corretamente
- Confirme se o proxy/reverse proxy não está limitando

### Erro: "ECONNRESET"

- Aumente o timeout de upload
- Verifique a estabilidade da conexão

### Erro: "JavaScript heap out of memory"

- Aumente `--max-old-space-size`
- Reduza o `batchSize`
- Implemente streaming para arquivos muito grandes

## Performance Esperada

Com essas otimizações, a aplicação deve conseguir:

- Upload de arquivos até 2GB cada
- Processamento de 25 arquivos simultâneos
- Tempo de upload: ~5-10 minutos para arquivos de 1GB
- Uso de memória controlado (não excedendo 4GB)
