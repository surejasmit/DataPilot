const datasetService = require('../services/dataset/index.service');
const pythonAnalysis = require('../services/pythonAnalysis.service');
const logger = require('../utils/logger');

const uploadDataset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const parsedProjectId = parseInt(projectId);
    if (isNaN(parsedProjectId)) {
    }

    let validation;
    try {
      validation = await pythonAnalysis.validateDataset(req.file.path, req.file.originalname);
    } catch (e) {
      validation = { is_business: true, domain: 'general' };
    }

    if (validation && !validation.is_business) {
      const fs = require('fs');
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(400).json({
        error: 'Not a business dataset',
        message: validation.message || 'This platform currently supports only business datasets. Please upload datasets related to sales, HR, customers, finance, inventory, retail, marketing, manufacturing, logistics, or other business domains.',
        domain: validation.domain || null
      });
    }

    const result = await datasetService.uploadDataset(
      req.file.path,
      req.file.originalname,
      parsedProjectId,
      req.user.id,
      validation
    );

    res.json({ success: true, dataset: result, message: result.message });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to process dataset' });
  }
};

const getDataset = async (req, res) => {
  try {
    const dataset = await datasetService.getDatasetById(req.params.id, req.user.id);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    res.json(dataset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dataset' });
  }
};

const getProfile = async (req, res) => {
  try {
    const profile = await datasetService.getProfile(req.params.id, req.user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Dataset profile not found' });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dataset profile' });
  }
};

const getColumns = async (req, res) => {
  try {
    const columns = await datasetService.getColumns(req.params.id, req.user.id);
    if (!columns) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    res.json(columns);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dataset columns' });
  }
};

const getPreview = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const sortColumn = req.query.sortColumn || '';
    const sortOrder = req.query.sortOrder || 'asc';

    const preview = await datasetService.getPreview(req.params.id, req.user.id, {
      page, limit, search, sortColumn, sortOrder
    });

    if (!preview) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    res.json(preview);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dataset preview' });
  }
};

const getStatistics = async (req, res) => {
  try {
    const statistics = await datasetService.getStatistics(req.params.id, req.user.id);
    if (!statistics) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    res.json(statistics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dataset statistics' });
  }
};

const getChartRecommendations = async (req, res) => {
  try {
    const charts = await datasetService.getChartRecommendations(req.params.id, req.user.id);
    if (!charts) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    res.json(charts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chart recommendations' });
  }
};

const getStatus = async (req, res) => {
  try {
    const status = await datasetService.getStatus(req.params.id, req.user.id);
    if (!status) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dataset status' });
  }
};

const getQuality = async (req, res) => {
  try {
    const report = await datasetService.getQualityReportResult(req.params.id, req.user.id);
    if (!report) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quality report', details: err.message });
  }
};

const generateQuality = async (req, res) => {
  try {
    const report = await datasetService.generateQualityReport(req.params.id, req.user.id);
    if (!report) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate quality report', details: err.message });
  }
};

const getCleaningHistory = async (req, res) => {
  try {
    const history = await datasetService.getCleaningHistoryResult(req.params.id, req.user.id);
    if (!history) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cleaning history' });
  }
};

const confirmCleaning = async (req, res) => {
  try {
    const { operationId } = req.body;
    if (!operationId) {
      return res.status(400).json({ error: 'Operation ID is required' });
    }
    const result = await datasetService.confirmCleaningOperation(req.params.id, req.user.id, operationId);
    if (!result) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to confirm cleaning operation', details: err.message });
  }
};

const getInsightsForDataset = async (req, res) => {
  try {
    const insights = await datasetService.getInsightsResult(req.params.id, req.user.id);
    if (!insights) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch insights', details: err.message });
  }
};

const generateInsightsNow = async (req, res) => {
  try {
    const insights = await datasetService.generateInsightsForDataset(req.params.id, req.user.id);
    if (!insights) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate insights', details: err.message });
  }
};

const askQuestion = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const dataset = await datasetService.getDatasetById(req.params.id, req.user.id);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    const fileInfo = await datasetService.getDatasetFilePath(req.params.id);
    if (!fileInfo || !fileInfo.dataset_path) {
      return res.status(400).json({ error: 'Dataset file is not available on the server. Please select a valid dataset with an uploaded file.' });
    }

    const result = await datasetService.askQuestion(fileInfo.dataset_path, fileInfo.dataset_name, question, req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    logger.error('Error in askQuestion controller', { error: err.message, stack: err.stack });
    res.status(500).json({ error: err.message || 'Failed to answer question', details: err.message });
  }
};

const getSuggestedQuestions = async (req, res) => {
  try {
    const fileInfo = await datasetService.getDatasetFilePath(req.params.id);
    if (!fileInfo || !fileInfo.dataset_path) {
      return res.json([]);
    }
    const pythonService = require('../services/pythonAnalysis.service');
    const result = await pythonService.suggestQuestions(fileInfo.dataset_path, fileInfo.dataset_name);
    res.json(result.questions || []);
  } catch (err) {
    logger.error('Error in getSuggestedQuestions', { error: err.message });
    res.json([]);
  }
};

module.exports = {
  uploadDataset,
  getDataset,
  getProfile,
  getColumns,
  getPreview,
  getStatistics,
  getChartRecommendations,
  getStatus,
  getQuality,
  generateQuality,
  getCleaningHistory,
  confirmCleaning,
  getInsightsForDataset,
  generateInsightsNow,
  askQuestion,
  getSuggestedQuestions
};