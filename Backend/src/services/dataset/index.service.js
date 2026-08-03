const path = require('path');
const fs = require('fs');

const logger = require('../../utils/logger');
const pythonService = require('../pythonAnalysis.service');
const db = require('./database.service');

function backgroundAnalysis(filePath, fileName, projectId, userId) {
  const startTime = Date.now();

  Promise.resolve().then(async () => {
    try {
      logger.analysisStarted(projectId, userId);

      await db.withTransaction(async (client) => {
        await db.updateProjectStatus(client, projectId, 'ANALYZING');
        await db.insertStatusHistory(client, projectId, 'ANALYZING', 'Dataset analysis started');
      });

      const analysis = await pythonService.analyzeDataset(filePath, fileName, projectId, projectId, userId);

      const { profile, column_stats, statistics, chart_recommendations, insights, quality_report, preview_rows } = analysis;

      await db.withTransaction(async (client) => {
        await db.updateProjectDatasetInfo(client, projectId, profile.total_rows, profile.total_columns, fs.statSync(filePath).size);
        await db.insertColumnStats(client, projectId, column_stats);
        await db.insertProfile(client, projectId, profile);
        await db.insertPreviewRows(client, projectId, preview_rows);

        if (statistics && statistics.length > 0) {
          await db.insertStatistics(client, projectId, statistics);
        }
        if (chart_recommendations && chart_recommendations.length > 0) {
          await db.insertChartRecommendations(client, projectId, chart_recommendations);
        }
        if (insights && insights.length > 0) {
          await db.insertInsights(client, projectId, insights);
        }
        if (quality_report) {
          await db.insertQualityReport(client, projectId, quality_report);
        }

        await db.updateProjectStatus(client, projectId, 'READY');
        await db.insertStatusHistory(client, projectId, 'READY', 'Dataset analysis completed successfully');
      });

      logger.analysisCompleted(projectId, userId, Date.now() - startTime);
    } catch (err) {
      logger.analysisFailed(projectId, err, userId);
      try {
        await db.withTransaction(async (client) => {
          await db.updateProjectStatus(client, projectId, 'FAILED');
          await db.insertStatusHistory(client, projectId, 'FAILED', err.message);
        });
      } catch (dbErr) {
        logger.databaseError('Failed to update failed status', dbErr);
      }
    }
  });
}

async function uploadDataset(filePath, fileName, projectId, userId) {
  logger.uploadStarted(fileName, 0, userId);

  const startTime = Date.now();

  if (!fs.existsSync(filePath)) {
    throw new Error('Uploaded file not found');
  }

  const fileStats = fs.statSync(filePath);
  if (fileStats.size === 0) {
    fs.unlinkSync(filePath);
    throw new Error('Uploaded file is empty');
  }
  if (fileStats.size > 100 * 1024 * 1024) {
    fs.unlinkSync(filePath);
    throw new Error('File size exceeds 100MB limit');
  }

  const ext = path.extname(fileName).toLowerCase();
  if (!['.csv', '.xlsx', '.xls', '.json'].includes(ext)) {
    fs.unlinkSync(filePath);
    throw new Error('Unsupported file type. Only CSV, Excel, and JSON files are allowed.');
  }

  const dataset = await db.withTransaction(async (client) => {
    const project = await db.createProjectDataset(client, projectId, userId, fileName, filePath, fileStats.size);
    await db.insertStatusHistory(client, projectId, 'UPLOADING', 'File uploaded, starting analysis');
    return project;
  });

  backgroundAnalysis(filePath, fileName, projectId, userId);

  logger.uploadCompleted(fileName, projectId, userId, Date.now() - startTime);

  return {
    id: dataset.id,
    name: dataset.name,
    datasetName: dataset.dataset_name,
    fileName: fileName,
    fileSize: fileStats.size,
    status: 'UPLOADING',
    message: 'Dataset uploaded successfully. Analysis is running in the background.'
  };
}

async function getDatasetById(datasetId, userId) {
  return db.getDatasetById(datasetId, userId);
}

async function getProfile(datasetId, userId) {
  const dataset = await db.getDatasetById(datasetId, userId);
  if (!dataset) return null;
  return db.getProfile(datasetId);
}

async function getColumns(datasetId, userId) {
  const dataset = await db.getDatasetById(datasetId, userId);
  if (!dataset) return null;
  return db.getColumns(datasetId);
}

async function getPreview(datasetId, userId, params) {
  const dataset = await db.getDatasetById(datasetId, userId);
  if (!dataset) return null;
  return db.getPreview(datasetId, params);
}

async function getStatistics(datasetId, userId) {
  const dataset = await db.getDatasetById(datasetId, userId);
  if (!dataset) return null;

  let stats = await db.getStatistics(datasetId);
  if (stats && stats.length > 0) {
    return {
      numericColumns: stats.map(s => ({
        columnName: s.column_name,
        min: s.min_value,
        max: s.max_value,
        mean: s.mean_value,
        median: s.median_value,
        mode: s.mode_value,
        stdDev: s.std_dev,
        q1: s.q1,
        q3: s.q3,
        missingCount: s.missing_count,
        missingPercentage: s.missing_percentage,
        uniqueCount: s.unique_count
      }))
    };
  }

  const columns = await db.getColumns(datasetId);
  const numericColumns = columns.filter(c => c.is_numeric);

  return {
    numericColumns: numericColumns.map(c => ({
      columnName: c.column_name,
      min: c.min_value,
      max: c.max_value,
      mean: c.mean_value,
      median: c.median_value,
      mode: c.mode_value,
      stdDev: c.std_dev,
      q1: c.q1,
      q3: c.q3,
      missingCount: c.missing_count,
      missingPercentage: c.missing_percentage,
      uniqueCount: c.unique_count
    }))
  };
}

async function getChartRecommendations(datasetId, userId) {
  const dataset = await db.getDatasetById(datasetId, userId);
  if (!dataset) return null;

  let recommendations = await db.getChartRecommendations(datasetId);
  if (recommendations && recommendations.length > 0) {
    return recommendations;
  }

  const fileInfo = await db.getDatasetFilePath(datasetId);
  if (fileInfo && fileInfo.dataset_path) {
    try {
      const analysis = await pythonService.analyzeDataset(fileInfo.dataset_path, fileInfo.dataset_name, datasetId, datasetId, userId);
      return analysis.chart_recommendations || [];
    } catch (err) {
      logger.warn('Failed to get chart recommendations from Python service', { error: err.message });
    }
  }

  return [];
}

async function getStatus(datasetId, userId) {
  const dataset = await db.getDatasetById(datasetId, userId);
  if (!dataset) return null;
  return db.getDatasetStatus(datasetId);
}

async function generateQualityReport(datasetId, userId) {
  const dataset = await db.getDatasetById(datasetId, userId);
  if (!dataset) return null;

  const fileInfo = await db.getDatasetFilePath(datasetId);
  if (!fileInfo || !fileInfo.dataset_path) return null;

  try {
    const analysis = await pythonService.analyzeDataset(fileInfo.dataset_path, fileInfo.dataset_name, datasetId, datasetId, userId);
    const report = analysis.quality_report;

    await db.withTransaction(async (client) => {
      await db.insertQualityReport(client, datasetId, report);
      await db.insertOperationHistory(client, datasetId, userId, 'quality_report_generated', { issues: report.issues?.length || 0 });
    });

    return report;
  } catch (err) {
    logger.error('Failed to generate quality report via Python service', { error: err.message });
    throw err;
  }
}

async function getQualityReportResult(datasetId, userId) {
  const dataset = await db.getDatasetById(datasetId, userId);
  if (!dataset) return null;

  let report = await db.getQualityReport(datasetId);
  if (!report) {
    report = await generateQualityReport(datasetId, userId);
  }
  return report;
}

async function confirmCleaningOperation(datasetId, userId, operationId) {
  const dataset = await db.getDatasetById(datasetId, userId);
  if (!dataset) return null;

  await db.withTransaction(async (client) => {
    await db.updateCleaningConfirmation(client, operationId);
  });

  const history = await db.getCleaningHistory(datasetId);
  const op = history.find(h => h.id === operationId);

  const fileInfo = await db.getDatasetFilePath(datasetId);
  if (!fileInfo || !fileInfo.dataset_path) return { confirmed: true };

  const params = op ? op.details : {};
  const result = await pythonService.cleanDataset(fileInfo.dataset_path, fileInfo.dataset_name, op.operation, params);

  const analysis = await pythonService.analyzeDataset(fileInfo.dataset_path, fileInfo.dataset_name, datasetId, datasetId, userId);
  const { profile, column_stats, statistics, chart_recommendations, preview_rows } = analysis;

  await db.withTransaction(async (client) => {
    await db.updateProjectDatasetInfo(client, datasetId, profile.total_rows, profile.total_columns, dataset.dataset_size);
    await db.insertColumnStats(client, datasetId, column_stats);
    await db.insertProfile(client, datasetId, profile);
    await db.insertPreviewRows(client, datasetId, preview_rows);
    if (statistics && statistics.length > 0) {
      await db.insertStatistics(client, datasetId, statistics);
    }
    if (chart_recommendations && chart_recommendations.length > 0) {
      await db.insertChartRecommendations(client, datasetId, chart_recommendations);
    }
    await db.insertOperationHistory(client, datasetId, userId, 'data_cleaning_completed', { operation: op.operation, rowsRemoved: result.removed || 0 });
  });

  return { confirmed: true, rowsRemoved: result.removed || 0 };
}

async function getCleaningHistoryResult(datasetId, userId) {
  const dataset = await db.getDatasetById(datasetId, userId);
  if (!dataset) return null;
  return db.getCleaningHistory(datasetId);
}

async function generateInsightsForDataset(datasetId, userId) {
  const dataset = await db.getDatasetById(datasetId, userId);
  if (!dataset) return null;

  const fileInfo = await db.getDatasetFilePath(datasetId);
  if (!fileInfo || !fileInfo.dataset_path) return [];

  try {
    const analysis = await pythonService.analyzeDataset(fileInfo.dataset_path, fileInfo.dataset_name, datasetId, datasetId, userId);
    const insights = analysis.insights || [];

    await db.withTransaction(async (client) => {
      await db.insertInsights(client, datasetId, insights);
    });

    return insights;
  } catch (err) {
    logger.error('Failed to generate insights via Python service', { error: err.message });
    throw err;
  }
}

async function getInsightsResult(datasetId, userId) {
  const dataset = await db.getDatasetById(datasetId, userId);
  if (!dataset) return null;

  let insights = await db.getInsights(datasetId);
  if (!insights || insights.length === 0) {
    insights = await generateInsightsForDataset(datasetId, userId);
  }
  return insights;
}

async function askQuestion(filePath, fileName, question, datasetId, userId) {
  try {
    const result = await pythonService.askQuestion(filePath, fileName, question, datasetId, datasetId, userId);
    return result;
  } catch (err) {
    logger.error('Failed to ask question via Python service', { error: err.message });
    throw err;
  }
}

module.exports = {
  uploadDataset,
  getDatasetById,
  getProfile,
  getColumns,
  getPreview,
  getStatistics,
  getChartRecommendations,
  getStatus,
  generateQualityReport,
  getQualityReportResult,
  confirmCleaningOperation,
  getCleaningHistoryResult,
  generateInsightsForDataset,
  getInsightsResult,
  askQuestion
};