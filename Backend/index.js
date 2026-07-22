const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const authRoutes = require('./src/routes/authRoutes');
const projectRoutes = require('./src/routes/projectRoutes');
const datasetRoutes = require('./src/routes/datasetRoutes');
const analysisRoutes = require('./src/routes/analysisRoutes');

const logger = require('./src/utils/logger');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const { pool } = require('./src/config/db');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/analysis', analysisRoutes);

app.use((err, req, res, next) => {
  logger.error('Global error handler', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

pool.query('SELECT NOW()', (err) => {
  if (err) {
    logger.error('Database connection error', { error: err.message });
  } else {
    logger.info('Database connected successfully');
  }
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;