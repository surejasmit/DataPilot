const db = require('./dataset/database.service');
const { detectQualityIssues } = require('./dataset/quality.service');
const { parseAndAnalyze } = require('./dataset/analyze.service');
const { generateInsights } = require('./dataset/insight.service');

async function getAnalysis(projectId, userId) {
  const dataset = await db.getDatasetById(projectId, userId);
  if (!dataset) return null;

  if (!dataset.dataset_name || !dataset.dataset_path) {
    return { status: 'no_dataset', message: 'No dataset file found. Please upload a dataset file.', projectId: dataset.id };
  }

  const existing = await getStoredAnalysis(projectId, dataset);
  if (existing) return existing;

  if (dataset.status !== 'READY' && dataset.status !== 'completed') {
    try {
      return await generateAndStoreAnalysis(projectId, userId, dataset);
    } catch (err) {
      return { status: dataset.status, message: `Dataset is ${dataset.status}. Analysis could not be generated: ${err.message}` };
    }
  }

  return await generateAndStoreAnalysis(projectId, userId, dataset);
}

async function getStoredAnalysis(datasetId, project) {
  const [profile, columns, statistics, chartRecs, qualityReport, insights] = await Promise.all([
    db.getProfile(datasetId),
    db.getColumns(datasetId),
    db.getStatistics(datasetId),
    db.getChartRecommendations(datasetId),
    db.getQualityReport(datasetId),
    db.getInsights(datasetId),
  ]);

  if (!profile) return null;

  return buildAnalysisResponse(datasetId, profile, columns, statistics, chartRecs, qualityReport, insights, project);
}

async function generateAndStoreAnalysis(datasetId, userId, dataset) {
  const { rows, columns: colNames } = await parseAndAnalyze(dataset.dataset_path, dataset.dataset_name);

  const columnStats = await db.getColumns(datasetId);
  const qualityReportData = detectQualityIssues(rows, colNames);
  const insightsData = generateInsights(rows, colNames, columnStats);

  await db.withTransaction(async (client) => {
    await db.insertQualityReport(client, datasetId, qualityReportData);
    await db.insertInsights(client, datasetId, insightsData);
  });

  const profile = await db.getProfile(datasetId);
  const statistics = await db.getStatistics(datasetId);
  const chartRecs = await db.getChartRecommendations(datasetId);

  return buildAnalysisResponse(datasetId, profile, columnStats, statistics, chartRecs, qualityReportData, insightsData, dataset);
}

function buildAnalysisResponse(datasetId, profile, columns, statistics, chartRecs, qualityReport, insights, project) {
  const datasetSummary = {
    datasetName: project ? project.dataset_name : null,
    fileType: project && project.dataset_name ? project.dataset_name.split('.').pop().toUpperCase() : (profile.file_encoding || 'UTF-8'),
    datasetSize: profile.dataset_size_bytes,
    uploadDate: profile.created_at,
    totalRows: profile.total_rows,
    totalColumns: profile.total_columns,
    memoryUsage: profile.memory_usage_bytes,
  };

  const columnAnalysis = (columns || []).map(col => ({
    columnName: col.column_name,
    dataType: col.data_type,
    isNumeric: col.is_numeric,
    isCategorical: col.is_categorical,
    isDatetime: col.is_datetime,
    isBoolean: col.is_boolean,
    missingCount: col.missing_count,
    missingPercentage: col.missing_percentage,
    uniqueCount: col.unique_count,
    modeValue: col.mode_value,
  }));

  const toNum = (v) => (v !== null && v !== undefined ? Number(v) : null);

  const statsData = (statistics || []).map(s => ({
    columnName: s.column_name,
    mean: toNum(s.mean_value),
    median: toNum(s.median_value),
    mode: s.mode_value,
    stdDev: toNum(s.std_dev),
    min: toNum(s.min_value),
    max: toNum(s.max_value),
    q1: toNum(s.q1),
    q3: toNum(s.q3),
    missingCount: s.missing_count,
    uniqueCount: s.unique_count,
  }));

  const distribution = {
    uniqueValues: (columns || []).map(c => ({ column: c.column_name, count: c.unique_count })),
    topCategories: (columns || []).filter(c => c.is_categorical).map(c => ({
      column: c.column_name,
      topValue: c.mode_value,
    })),
  };

  const chartRecommendations = (chartRecs || []).map(r => ({
    type: r.type,
    title: r.title,
    columns: r.columns,
    reason: r.reason,
  }));

  const aiInsights = (insights || []).map(i => ({
    id: i.id,
    type: i.insight_type,
    title: i.title,
    description: i.description,
    details: i.details,
    severity: i.severity,
    confidence: i.confidence,
  }));

  const issues = (qualityReport && qualityReport.issues) || [];

  return {
    datasetSummary,
    columnAnalysis,
    dataQuality: qualityReport ? {
      totalRows: qualityReport.total_rows,
      missingValues: qualityReport.missing_values,
      missingPercentage: qualityReport.missing_percentage,
      duplicateRows: qualityReport.duplicate_rows,
      duplicatePercentage: qualityReport.duplicate_percentage,
      emptyColumns: qualityReport.empty_columns,
      constantColumns: qualityReport.constant_columns,
      highCardinalityColumns: qualityReport.high_cardinality_columns,
      numericColumns: qualityReport.numeric_columns,
      categoricalColumns: qualityReport.categorical_columns,
      dateColumns: qualityReport.date_columns,
    } : null,
    statistics: statsData,
    distribution,
    chartRecommendations,
    aiInsights,
    issues,
  };
}

async function getAllInsights(userId) {
  const projectsResult = await db.pool.query(
    'SELECT id, name, dataset_name FROM projects WHERE user_id = $1 AND dataset_name IS NOT NULL ORDER BY updated_at DESC',
    [userId]
  );
  const projects = projectsResult.rows;

  const allInsights = [];
  for (const project of projects) {
    const insights = await db.getInsights(project.id);
    if (insights && insights.length > 0) {
      allInsights.push({
        projectId: project.id,
        projectName: project.name,
        datasetName: project.dataset_name,
        insights: insights.map(i => ({
          id: i.id,
          type: i.insight_type,
          title: i.title,
          description: i.description,
          details: i.details,
          severity: i.severity,
          confidence: i.confidence,
          createdAt: i.created_at,
        })),
      });
    }
  }

  return allInsights;
}

module.exports = { getAnalysis, getAllInsights };
