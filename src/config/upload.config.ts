export const uploadConfig = {
  // Limites de tamanho
  maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
  maxFiles: 25,
  maxFieldSize: 2 * 1024 * 1024 * 1024, // 2GB

  // Configurações de processamento
  batchSize: 5, // Processar 5 arquivos por vez
  batchDelay: 100, // 100ms entre lotes

  // Timeouts
  uploadTimeout: 300000, // 5 minutos
  processingTimeout: 600000, // 10 minutos

  // Configurações de memória
  memoryLimit: '2gb',

  // Tipos de arquivo permitidos
  allowedExtensions: ['.xlsx', '.xls', '.csv'],

  // Diretório de upload
  uploadDir: './uploads',
};
