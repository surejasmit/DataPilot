const { inferDataType } = require('./analyze.service');

function generateProfile(rows, columns, fileSize, processingTimeMs) {
  const totalRows = rows.length;
  const totalColumns = columns.length;

  let numericColumns = 0;
  let categoricalColumns = 0;
  let datetimeColumns = 0;
  let booleanColumns = 0;
  let emptyColumns = 0;
  let totalMissing = 0;

  const columnStats = [];

  for (let i = 0; i < columns.length; i++) {
    const colName = columns[i];
    const colValues = rows.map(r => r[colName]);
    const nonNullValues = colValues.filter(v => v !== null && v !== undefined && v !== '');
    const missingCount = colValues.length - nonNullValues.length;
    const missingPercentage = colValues.length > 0 ? (missingCount / colValues.length) * 100 : 0;
    const uniqueCount = new Set(nonNullValues.map(v => String(v))).size;

    const dataType = inferDataType(nonNullValues);

    if (dataType === 'number') numericColumns++;
    else if (dataType === 'date') datetimeColumns++;
    else if (dataType === 'boolean') booleanColumns++;
    else categoricalColumns++;

    totalMissing += missingCount;
    if (missingCount === colValues.length) emptyColumns++;

    columnStats.push({
      columnName: colName,
      dataType,
      position: i,
      missingCount,
      missingPercentage: Math.round(missingPercentage * 100) / 100,
      uniqueCount,
      isNumeric: dataType === 'number',
      isCategorical: dataType === 'string',
      isDatetime: dataType === 'date',
      isBoolean: dataType === 'boolean'
    });
  }

  const duplicateRows = totalRows - new Set(rows.map(r => JSON.stringify(Object.values(r)))).size;
  const duplicatePercentage = totalRows > 0 ? (duplicateRows / totalRows) * 100 : 0;
  const missingPercentage = totalRows * totalColumns > 0 ? (totalMissing / (totalRows * totalColumns)) * 100 : 0;

  const memoryUsageBytes = Buffer.byteLength(JSON.stringify(rows));

  return {
    profile: {
      totalRows,
      totalColumns,
      missingValuesTotal: totalMissing,
      missingPercentage: Math.round(missingPercentage * 100) / 100,
      duplicateRows,
      duplicatePercentage: Math.round(duplicatePercentage * 100) / 100,
      emptyColumns,
      numericColumns,
      categoricalColumns,
      datetimeColumns,
      booleanColumns,
      memoryUsageBytes,
      datasetSizeBytes: fileSize,
      datasetShape: `${totalRows}x${totalColumns}`,
      fileEncoding: 'UTF-8',
      processingTimeMs,
      status: 'completed'
    },
    columnStats
  };
}

module.exports = { generateProfile };