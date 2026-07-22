const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', '..', 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLevel = process.env.LOG_LEVEL || 'info';

function shouldLog(level) {
  return logLevels[level] <= logLevels[currentLevel];
}

function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
}

function writeLog(level, message, meta = {}) {
  if (!shouldLog(level)) return;
  
  const formatted = formatMessage(level, message, meta);
  
  if (process.env.NODE_ENV !== 'production') {
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](formatted.trim());
  }
  
  fs.appendFileSync(logFile, formatted);
}

const logger = {
  error: (message, meta) => writeLog('error', message, meta),
  warn: (message, meta) => writeLog('warn', message, meta),
  info: (message, meta) => writeLog('info', message, meta),
  debug: (message, meta) => writeLog('debug', message, meta),
  
  uploadStarted: (fileName, fileSize, userId) => 
    logger.info('Upload started', { fileName, fileSize, userId }),
  
  uploadCompleted: (fileName, datasetId, userId, durationMs) => 
    logger.info('Upload completed', { fileName, datasetId, userId, durationMs }),
  
  uploadFailed: (fileName, error, userId) => 
    logger.error('Upload failed', { fileName, error: error.message, userId }),
  
  analysisStarted: (datasetId, userId) => 
    logger.info('Analysis started', { datasetId, userId }),
  
  analysisCompleted: (datasetId, userId, durationMs) => 
    logger.info('Analysis completed', { datasetId, userId, durationMs }),
  
  analysisFailed: (datasetId, error, userId) => 
    logger.error('Analysis failed', { datasetId, error: error.message, userId }),
  
  databaseError: (operation, error, context = {}) => 
    logger.error(`Database error: ${operation}`, { error: error.message, ...context }),
  
};

module.exports = logger;