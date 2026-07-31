const { pool } = require('../config/db');
const pythonService = require('./pythonAnalysis.service');

/**
 * Get unified analysis data for a single project/dataset
 */
async function getAnalysisByProjectId(projectId, userId) {
  // 1. Get the project and verify ownership
  const projectResult = await pool.query(
    'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
    [projectId, userId]
  );

  if (projectResult.rows.length === 0) {
    return null;
  }

  const project = projectResult.rows[0];

  // If no dataset uploaded yet
  if (!project.dataset_name) {
    return {
      status: 'no_dataset',
      message: 'No dataset uploaded for this project',
      projectId: project.id,
    };
  }

  // If still processing
  if (project.status === 'UPLOADING' || project.status === 'ANALYZING') {
    return {
      status: project.status,
      message: 'Dataset is being processed',
      projectId: project.id,
      datasetSummary: {
        datasetName: project.dataset_name,
        fileType: project.dataset_name ? project.dataset_name.split('.').pop() : 'unknown',
        datasetSize: parseInt(project.dataset_size) || 0,
        uploadDate: project.updated_at || project.created_at,
        totalRows: parseInt(project.dataset_rows) || 0,
        totalColumns: parseInt(project.dataset_columns) || 0,
        memoryUsage: 0,
      },
    };
  }

  // 2. Fetch all related data in parallel
  const [profileResult, columnsResult, statsResult, qualityResult, chartsResult, insightsResult] = await Promise.all([
    pool.query('SELECT * FROM dataset_profile WHERE dataset_id = $1', [projectId]),
    pool.query('SELECT * FROM dataset_columns WHERE dataset_id = $1 ORDER BY position', [projectId]),
    pool.query('SELECT * FROM dataset_statistics WHERE dataset_id = $1 ORDER BY column_name', [projectId]),
    pool.query('SELECT * FROM dataset_quality_report WHERE dataset_id = $1', [projectId]),
    pool.query('SELECT * FROM dataset_chart_recommendations WHERE dataset_id = $1 ORDER BY position', [projectId]),
    pool.query('SELECT * FROM dataset_insights WHERE dataset_id = $1 ORDER BY created_at DESC', [projectId]),
  ]);

  const profile = profileResult.rows[0] || null;
  const columns = columnsResult.rows;
  const stats = statsResult.rows;
  const quality = qualityResult.rows[0] || null;
  const charts = chartsResult.rows;
  const insights = insightsResult.rows;

  // 3. Build datasetSummary
  const datasetSummary = {
    datasetName: project.dataset_name,
    fileType: project.dataset_name ? project.dataset_name.split('.').pop() : 'unknown',
    datasetSize: parseInt(project.dataset_size) || (profile ? parseInt(profile.dataset_size_bytes) : 0),
    uploadDate: project.updated_at || project.created_at,
    totalRows: profile && profile.total_rows !== null && profile.total_rows !== undefined ? parseInt(profile.total_rows) : (parseInt(project.dataset_rows) || 0),
    totalColumns: profile && profile.total_columns !== null && profile.total_columns !== undefined ? parseInt(profile.total_columns) : (parseInt(project.dataset_columns) || 0),
    memoryUsage: profile ? parseInt(profile.memory_usage_bytes) || 0 : 0,
  };

  // 4. Build columnAnalysis
  const columnAnalysis = columns.map(col => ({
    columnName: col.column_name,
    dataType: col.data_type || 'string',
    isNumeric: col.is_numeric || false,
    isCategorical: col.is_categorical || false,
    isDatetime: col.is_datetime || false,
    isBoolean: col.is_boolean || false,
    missingCount: col.missing_count || 0,
    missingPercentage: parseFloat(col.missing_percentage) || 0,
    uniqueCount: col.unique_count || 0,
    modeValue: col.mode_value || null,
  }));

  // 5. Build dataQuality
  let dataQuality = null;
  if (quality) {
    dataQuality = {
      totalRows: quality.total_rows || 0,
      missingValues: quality.missing_values || 0,
      missingPercentage: parseFloat(quality.missing_percentage) || 0,
      duplicateRows: quality.duplicate_rows || 0,
      duplicatePercentage: parseFloat(quality.duplicate_percentage) || 0,
      emptyColumns: quality.empty_columns || [],
      constantColumns: quality.constant_columns || [],
      highCardinalityColumns: quality.high_cardinality_columns || [],
      numericColumns: quality.numeric_columns || [],
      categoricalColumns: quality.categorical_columns || [],
      dateColumns: quality.date_columns || [],
    };
  } else if (profile) {
    dataQuality = {
      totalRows: profile.total_rows || 0,
      missingValues: profile.missing_values_total || 0,
      missingPercentage: parseFloat(profile.missing_percentage) || 0,
      duplicateRows: profile.duplicate_rows || 0,
      duplicatePercentage: parseFloat(profile.duplicate_percentage) || 0,
      emptyColumns: profile.empty_columns || [],
      constantColumns: [],
      highCardinalityColumns: [],
      numericColumns: profile.numeric_columns || [],
      categoricalColumns: profile.categorical_columns || [],
      dateColumns: profile.datetime_columns || [],
    };
  }

  // 6. Build statistics
  let statistics = [];
  if (stats.length > 0) {
    statistics = stats.map(s => ({
      columnName: s.column_name,
      mean: s.mean_value !== null ? parseFloat(s.mean_value) : null,
      median: s.median_value !== null ? parseFloat(s.median_value) : null,
      mode: s.mode_value || null,
      stdDev: s.std_dev !== null ? parseFloat(s.std_dev) : null,
      min: s.min_value !== null ? parseFloat(s.min_value) : null,
      max: s.max_value !== null ? parseFloat(s.max_value) : null,
      q1: s.q1 !== null ? parseFloat(s.q1) : null,
      q3: s.q3 !== null ? parseFloat(s.q3) : null,
      missingCount: s.missing_count || 0,
      uniqueCount: s.unique_count || 0,
    }));
  } else {
    statistics = columns
      .filter(c => c.is_numeric)
      .map(c => ({
        columnName: c.column_name,
        mean: c.mean_value !== null ? parseFloat(c.mean_value) : null,
        median: c.median_value !== null ? parseFloat(c.median_value) : null,
        mode: c.mode_value || null,
        stdDev: c.std_dev !== null ? parseFloat(c.std_dev) : null,
        min: c.min_value !== null ? parseFloat(c.min_value) : null,
        max: c.max_value !== null ? parseFloat(c.max_value) : null,
        q1: c.q1 !== null ? parseFloat(c.q1) : null,
        q3: c.q3 !== null ? parseFloat(c.q3) : null,
        missingCount: c.missing_count || 0,
        uniqueCount: c.unique_count || 0,
      }));
  }

  // 7. Build distribution
  const distribution = {
    uniqueValues: columns.map(c => ({ column: c.column_name, count: c.unique_count || 0 })),
    topCategories: columns
      .filter(c => c.is_categorical || !c.is_numeric)
      .map(c => ({ column: c.column_name, topValue: c.mode_value || null })),
  };

  // 8. Build chartRecommendations
  const chartRecommendations = charts.map(rec => ({
    type: rec.chart_type,
    title: rec.title,
    columns: rec.columns || [],
    reason: rec.reason || '',
  }));

  // 9. Build aiInsights
  const aiInsights = insights.map(ins => ({
    id: ins.id,
    type: ins.insight_type,
    title: ins.title,
    description: ins.description,
    details: ins.details || {},
    severity: ins.severity || 'info',
    confidence: parseFloat(ins.confidence) || 0,
  }));

  // 10. Build issues from quality report
  let issues = [];
  if (quality && quality.issues) {
    try {
      issues = typeof quality.issues === 'string' ? JSON.parse(quality.issues) : quality.issues;
    } catch {
      issues = [];
    }
  }

  return {
    status: project.status,
    projectId: project.id,
    datasetSummary,
    columnAnalysis,
    dataQuality,
    statistics,
    distribution,
    chartRecommendations,
    aiInsights,
    issues,
  };
}

/**
 * Get all insights across all projects for a user
 */
async function getAllInsights(userId) {
  const result = await pool.query(
    `SELECT di.*, p.name as project_name, p.dataset_name
     FROM dataset_insights di
     JOIN projects p ON di.dataset_id = p.id
     WHERE p.user_id = $1
     ORDER BY di.created_at DESC`,
    [userId]
  );

  return result.rows.map(row => ({
    id: row.id,
    datasetId: row.dataset_id,
    projectName: row.project_name,
    datasetName: row.dataset_name,
    type: row.insight_type,
    title: row.title,
    description: row.description,
    details: row.details || {},
    severity: row.severity,
    confidence: parseFloat(row.confidence) || 0,
    createdAt: row.created_at,
  }));
}

module.exports = {
  getAnalysisByProjectId,
  getAllInsights,
  exportReport,
};

/**
 * Export a PDF report for a project
 */
async function exportReport(projectId, userId) {
  const projectResult = await pool.query(
    'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
    [projectId, userId]
  );

  if (projectResult.rows.length === 0) {
    return null;
  }

  const project = projectResult.rows[0];

  if (!project.dataset_name || !project.dataset_path) {
    return null;
  }

  const response = await pythonService.generateReport(
    project.dataset_path,
    project.dataset_name,
    project.name,
    project.dataset_name
  );

  return {
    buffer: Buffer.from(response.data),
    filename: `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_report.pdf`,
  };
}
