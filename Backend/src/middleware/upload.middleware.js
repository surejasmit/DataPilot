const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.csv', '.xlsx', '.xls', '.json'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    logger.warn('Unsupported file type attempted', { 
      fileName: file.originalname, 
      extension: ext,
      userId: req.user?.id 
    });
    cb(new Error('Unsupported file type. Only CSV, Excel, and JSON files are allowed.'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      logger.warn('File size limit exceeded', { 
        fileName: req.file?.originalname,
        userId: req.user?.id 
      });
      return res.status(400).json({ error: 'File size exceeds 100MB limit' });
    }
    logger.error('Multer error', { error: err.message, code: err.code });
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    logger.error('Upload error', { error: err.message });
    return res.status(400).json({ error: err.message });
  }
  next();
};

module.exports = {
  upload,
  handleMulterError,
  uploadDir
};