const { pool } = require('../../config/db');
const logger = require('../../utils/logger');

async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.databaseError('transaction', err);
    throw err;
  } finally {
    client.release();
  }
}

async function createProjectDataset(client, projectId, userId, fileName, filePath, fileSize) {
  const result = await client.query(
    `UPDATE projects SET 
      dataset_name = $1, 
      dataset_path = $2, 
      dataset_size = $3, 
      status = 'UPLOADING',
      updated_at = CURRENT_TIMESTAMP
     WHERE id = $4 AND user_id = $5
     RETURNING *`,
    [fileName, filePath, fileSize, projectId, userId]
  );
  return result.rows[0];
}

async function updateProjectStatus(client, projectId, status) {
  await client.query(
    `UPDATE projects SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [status, projectId]
  );
}

async function updateProjectDatasetInfo(client, projectId, totalRows, totalColumns, fileSize) {
  await client.query(
    `UPDATE projects SET 
      dataset_rows = $1, 
      dataset_columns = $2, 
      dataset_size = $3,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = $4`,
    [totalRows, totalColumns, fileSize, projectId]
  );
}

async function insertColumnStats(client, datasetId, columns) {
  for (const col of columns) {
    await client.query(
      `INSERT INTO dataset_columns 
       (dataset_id, column_name, data_type, position, missing_count, missing_percentage, 
        unique_count, min_value, max_value, mean_value, median_value, mode_value, 
        std_dev, q1, q3, is_numeric, is_categorical, is_datetime, is_boolean)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       ON CONFLICT (dataset_id, column_name) DO UPDATE SET
        data_type = EXCLUDED.data_type,
        position = EXCLUDED.position,
        missing_count = EXCLUDED.missing_count,
        missing_percentage = EXCLUDED.missing_percentage,
        unique_count = EXCLUDED.unique_count,
        min_value = EXCLUDED.min_value,
        max_value = EXCLUDED.max_value,
        mean_value = EXCLUDED.mean_value,
        median_value = EXCLUDED.median_value,
        mode_value = EXCLUDED.mode_value,
        std_dev = EXCLUDED.std_dev,
        q1 = EXCLUDED.q1,
        q3 = EXCLUDED.q3,
        is_numeric = EXCLUDED.is_numeric,
        is_categorical = EXCLUDED.is_categorical,
        is_datetime = EXCLUDED.is_datetime,
        is_boolean = EXCLUDED.is_boolean,
        updated_at = CURRENT_TIMESTAMP`,
      [datasetId, col.columnName, col.dataType, col.position, col.missingCount,
       col.missingPercentage, col.uniqueCount, col.minValue, col.maxValue, col.meanValue,
       col.medianValue, col.modeValue, col.stdDev, col.q1, col.q3,
       col.isNumeric, col.isCategorical, col.isDatetime, col.isBoolean]
    );
  }
}

async function insertProfile(client, datasetId, profileData) {
  await client.query(
    `INSERT INTO dataset_profile 
     (dataset_id, total_rows, total_columns, missing_values_total, missing_percentage,
      duplicate_rows, duplicate_percentage, empty_columns, numeric_columns,
      categorical_columns, datetime_columns, boolean_columns, memory_usage_bytes,
      dataset_size_bytes, dataset_shape, file_encoding, processing_time_ms, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
     ON CONFLICT (dataset_id) DO UPDATE SET
      total_rows = EXCLUDED.total_rows,
      total_columns = EXCLUDED.total_columns,
      missing_values_total = EXCLUDED.missing_values_total,
      missing_percentage = EXCLUDED.missing_percentage,
      duplicate_rows = EXCLUDED.duplicate_rows,
      duplicate_percentage = EXCLUDED.duplicate_percentage,
      empty_columns = EXCLUDED.empty_columns,
      numeric_columns = EXCLUDED.numeric_columns,
      categorical_columns = EXCLUDED.categorical_columns,
      datetime_columns = EXCLUDED.datetime_columns,
      boolean_columns = EXCLUDED.boolean_columns,
      memory_usage_bytes = EXCLUDED.memory_usage_bytes,
      dataset_size_bytes = EXCLUDED.dataset_size_bytes,
      dataset_shape = EXCLUDED.dataset_shape,
      file_encoding = EXCLUDED.file_encoding,
      processing_time_ms = EXCLUDED.processing_time_ms,
      status = EXCLUDED.status,
      updated_at = CURRENT_TIMESTAMP`,
    [datasetId, profileData.totalRows, profileData.totalColumns,
     profileData.missingValuesTotal, profileData.missingPercentage,
     profileData.duplicateRows, profileData.duplicatePercentage,
     profileData.emptyColumns, profileData.numericColumns,
     profileData.categoricalColumns, profileData.datetimeColumns,
     profileData.booleanColumns, profileData.memoryUsageBytes,
     profileData.datasetSizeBytes, profileData.datasetShape,
     profileData.fileEncoding, profileData.processingTimeMs, profileData.status]
  );
}

async function insertPreviewRows(client, datasetId, rows) {
  await client.query(
    'DELETE FROM dataset_preview WHERE dataset_id = $1',
    [datasetId]
  );
  for (let i = 0; i < rows.length; i++) {
    await client.query(
      'INSERT INTO dataset_preview (dataset_id, row_index, row_data) VALUES ($1, $2, $3)',
      [datasetId, i, JSON.stringify(rows[i])]
    );
  }
}

async function insertStatistics(client, datasetId, numericColumns) {
  await client.query(
    'DELETE FROM dataset_statistics WHERE dataset_id = $1',
    [datasetId]
  );
  for (const col of numericColumns) {
    await client.query(
      `INSERT INTO dataset_statistics 
       (dataset_id, column_name, min_value, max_value, mean_value, median_value,
        mode_value, std_dev, variance, q1, q3, iqr, missing_count,
        missing_percentage, unique_count, range_value)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [datasetId, col.columnName, col.minValue, col.maxValue, col.meanValue,
       col.medianValue, col.modeValue, col.stdDev, col.variance, col.q1,
       col.q3, col.iqr, col.missingCount, col.missingPercentage,
       col.uniqueCount, col.rangeValue]
    );
  }
}

async function insertChartRecommendations(client, datasetId, recommendations) {
  await client.query(
    'DELETE FROM dataset_chart_recommendations WHERE dataset_id = $1',
    [datasetId]
  );
  for (let i = 0; i < recommendations.length; i++) {
    const rec = recommendations[i];
    await client.query(
      `INSERT INTO dataset_chart_recommendations 
       (dataset_id, chart_type, title, columns, reason, position)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [datasetId, rec.type, rec.title, JSON.stringify(rec.columns), rec.reason, i]
    );
  }
}

async function insertStatusHistory(client, datasetId, status, message) {
  await client.query(
    `INSERT INTO dataset_status (dataset_id, status, message)
     VALUES ($1, $2, $3)`,
    [datasetId, status, message || null]
  );
}

async function getDatasetById(datasetId, userId) {
  const result = await pool.query(
    'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
    [datasetId, userId]
  );
  return result.rows[0];
}

async function getProfile(datasetId) {
  const result = await pool.query(
    'SELECT * FROM dataset_profile WHERE dataset_id = $1',
    [datasetId]
  );
  return result.rows[0];
}

async function getColumns(datasetId) {
  const result = await pool.query(
    'SELECT * FROM dataset_columns WHERE dataset_id = $1 ORDER BY position',
    [datasetId]
  );
  return result.rows;
}

async function getPreview(datasetId, { page = 1, limit = 20, search = '', sortColumn = '', sortOrder = 'asc' }) {
  let query = 'SELECT * FROM dataset_preview WHERE dataset_id = $1';
  const params = [datasetId];
  let paramIndex = 2;

  if (search) {
    query += ` AND row_data::text ILIKE $${paramIndex}`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (sortColumn) {
    const sanitizedColumn = sortColumn.replace(/['"]/g, '');
    const sanitizedOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    query += ` ORDER BY row_data->>'${sanitizedColumn}' ${sanitizedOrder}`;
  } else {
    query += ' ORDER BY row_index';
  }

  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, (page - 1) * limit);

  const result = await pool.query(query, params);

  const countResult = await pool.query(
    'SELECT COUNT(*) FROM dataset_preview WHERE dataset_id = $1',
    [datasetId]
  );

  return {
    rows: result.rows.map(r => r.row_data),
    total: parseInt(countResult.rows[0].count),
    page,
    limit,
    totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
  };
}

async function getStatistics(datasetId) {
  const result = await pool.query(
    'SELECT * FROM dataset_statistics WHERE dataset_id = $1 ORDER BY column_name',
    [datasetId]
  );
  return result.rows;
}

async function getChartRecommendations(datasetId) {
  const result = await pool.query(
    'SELECT * FROM dataset_chart_recommendations WHERE dataset_id = $1 ORDER BY position',
    [datasetId]
  );
  return result.rows.map(r => ({
    type: r.chart_type,
    title: r.title,
    columns: r.columns,
    reason: r.reason
  }));
}

async function getDatasetStatus(datasetId) {
  const projectResult = await pool.query(
    'SELECT id, status, dataset_name FROM projects WHERE id = $1',
    [datasetId]
  );
  if (projectResult.rows.length === 0) return null;

  const historyResult = await pool.query(
    'SELECT * FROM dataset_status WHERE dataset_id = $1 ORDER BY created_at DESC LIMIT 1',
    [datasetId]
  );

  return {
    datasetId: projectResult.rows[0].id,
    status: projectResult.rows[0].status,
    datasetName: projectResult.rows[0].dataset_name,
    lastUpdate: historyResult.rows[0]?.created_at || null,
    message: historyResult.rows[0]?.message || null
  };
}

async function insertQualityReport(client, dataSetId, report) {
  await client.query(
    `INSERT INTO dataset_quality_report 
     (dataset_id, total_rows, missing_values, missing_percentage, duplicate_rows, duplicate_percentage,
      empty_columns, constant_columns, mixed_type_columns, outlier_columns, high_cardinality_columns,
      date_columns, categorical_columns, numeric_columns, issues)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     ON CONFLICT (dataset_id) DO UPDATE SET
      total_rows = EXCLUDED.total_rows,
      missing_values = EXCLUDED.missing_values,
      missing_percentage = EXCLUDED.missing_percentage,
      duplicate_rows = EXCLUDED.duplicate_rows,
      duplicate_percentage = EXCLUDED.duplicate_percentage,
      empty_columns = EXCLUDED.empty_columns,
      constant_columns = EXCLUDED.constant_columns,
      mixed_type_columns = EXCLUDED.mixed_type_columns,
      outlier_columns = EXCLUDED.outlier_columns,
      high_cardinality_columns = EXCLUDED.high_cardinality_columns,
      date_columns = EXCLUDED.date_columns,
      categorical_columns = EXCLUDED.categorical_columns,
      numeric_columns = EXCLUDED.numeric_columns,
      issues = EXCLUDED.issues,
      updated_at = CURRENT_TIMESTAMP`,
    [dataSetId, report.totalRows, report.missingValues, report.missingPercentage,
     report.duplicateRows, report.duplicatePercentage,
     report.emptyColumns, report.constantColumns, report.mixedTypeColumns,
     report.outlierColumns, report.highCardinalityColumns,
     report.dateColumns, report.categoricalColumns, report.numericColumns,
     JSON.stringify(report.issues)]
  );
}

async function getQualityReport(datasetId) {
  const result = await pool.query(
    'SELECT * FROM dataset_quality_report WHERE dataset_id = $1',
    [datasetId]
  );
  return result.rows[0] || null;
}

async function insertCleaningOperation(client, datasetId, operation, details, status) {
  const result = await client.query(
    `INSERT INTO dataset_cleaning_history (dataset_id, operation, details, status)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [datasetId, operation, JSON.stringify(details), status]
  );
  return result.rows[0];
}

async function getCleaningHistory(datasetId) {
  const result = await pool.query(
    'SELECT * FROM dataset_cleaning_history WHERE dataset_id = $1 ORDER BY created_at DESC',
    [datasetId]
  );
  return result.rows;
}

async function updateCleaningConfirmation(client, id) {
  await client.query(
    `UPDATE dataset_cleaning_history SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [id]
  );
}

async function insertInsights(client, datasetId, insights) {
  await client.query(
    'DELETE FROM dataset_insights WHERE dataset_id = $1',
    [datasetId]
  );
  for (const insight of insights) {
    await client.query(
      `INSERT INTO dataset_insights (dataset_id, insight_type, title, description, details, severity, confidence)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [datasetId, insight.type, insight.title, insight.description,
       JSON.stringify(insight.details || {}), insight.severity || 'info', insight.confidence || 0]
    );
  }
}

async function getInsights(datasetId) {
  const result = await pool.query(
    'SELECT * FROM dataset_insights WHERE dataset_id = $1 ORDER BY created_at DESC',
    [datasetId]
  );
  return result.rows;
}

async function insertOperationHistory(client, datasetId, userId, operation, details) {
  await client.query(
    `INSERT INTO dataset_operation_history (dataset_id, user_id, operation, details)
     VALUES ($1, $2, $3, $4)`,
    [datasetId, userId, operation, JSON.stringify(details || {})]
  );
}

async function getOperationHistory(datasetId) {
  const result = await pool.query(
    'SELECT * FROM dataset_operation_history WHERE dataset_id = $1 ORDER BY created_at DESC',
    [datasetId]
  );
  return result.rows;
}

async function getDatasetFilePath(datasetId) {
  const result = await pool.query(
    'SELECT dataset_path, dataset_name FROM projects WHERE id = $1',
    [datasetId]
  );
  return result.rows[0] || null;
}

module.exports = {
  withTransaction,
  createProjectDataset,
  updateProjectStatus,
  updateProjectDatasetInfo,
  insertColumnStats,
  insertProfile,
  insertPreviewRows,
  insertStatistics,
  insertChartRecommendations,
  insertStatusHistory,
  getDatasetById,
  getProfile,
  getColumns,
  getPreview,
  getStatistics,
  getChartRecommendations,
  getDatasetStatus,
  insertQualityReport,
  getQualityReport,
  insertCleaningOperation,
  getCleaningHistory,
  updateCleaningConfirmation,
  insertInsights,
  getInsights,
  insertOperationHistory,
  getOperationHistory,
  getDatasetFilePath,
  pool
};