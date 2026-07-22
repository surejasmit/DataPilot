function detectQualityIssues(rows, columns) {
  const issues = [];
  const totalRows = rows.length;
  const totalCols = columns.length;

  const emptyCols = [];
  const constantCols = [];
  const mixedTypeCols = [];
  const outlierCols = [];
  const highCardinalityCols = [];
  const dateCols = [];
  const catCols = [];
  const numCols = [];
  let totalMissing = 0;
  let totalMissingCells = 0;

  for (let i = 0; i < columns.length; i++) {
    const colName = columns[i];
    const colValues = rows.map(r => r[colName]);
    const nonNullValues = colValues.filter(v => v !== null && v !== undefined && v !== '');
    const missingCount = colValues.length - nonNullValues.length;
    totalMissing += missingCount;
    totalMissingCells += missingCount;

    if (missingCount === colValues.length) {
      emptyCols.push(colName);
      issues.push({ type: 'empty_column', column: colName, severity: 'critical', message: `Column "${colName}" is completely empty` });
      continue;
    }

    const uniqueValues = new Set(nonNullValues.map(v => String(v).trim()));
    if (uniqueValues.size <= 1) {
      constantCols.push(colName);
      issues.push({ type: 'constant_column', column: colName, severity: 'warning', message: `Column "${colName}" has constant value` });
    }

    if (uniqueValues.size > 100) {
      highCardinalityCols.push(colName);
      if (totalRows > 100) {
        issues.push({ type: 'high_cardinality', column: colName, severity: 'info', message: `Column "${colName}" has high cardinality (${uniqueValues.size} unique values)` });
      }
    }

    const types = new Set();
    for (const v of nonNullValues.slice(0, 100)) {
      if (typeof v === 'number') types.add('number');
      else if (!isNaN(parseFloat(v)) && v !== null && v !== '') types.add('number');
      else if (v instanceof Date || (!isNaN(Date.parse(v)) && v !== null && v !== '')) types.add('date');
      else if (typeof v === 'boolean' || ['true', 'false', '1', '0', 'yes', 'no'].includes(String(v).toLowerCase())) types.add('boolean');
      else types.add('string');
    }
    if (types.size > 1) {
      mixedTypeCols.push(colName);
      issues.push({ type: 'mixed_types', column: colName, severity: 'warning', message: `Column "${colName}" has mixed data types` });
    }

    const isNumeric = nonNullValues.every(v => typeof v === 'number' || (!isNaN(parseFloat(v)) && v !== ''));
    const isDate = !isNumeric && nonNullValues.every(v => v instanceof Date || !isNaN(Date.parse(v)));

    if (isNumeric && nonNullValues.length > 0) {
      numCols.push(colName);
      const nums = nonNullValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
      if (nums.length >= 5) {
        nums.sort((a, b) => a - b);
        const q1 = nums[Math.floor(nums.length * 0.25)];
        const q3 = nums[Math.floor(nums.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        const outliers = nums.filter(v => v < lowerBound || v > upperBound);
        if (outliers.length > 0) {
          outlierCols.push(colName);
          issues.push({ type: 'outliers', column: colName, severity: 'warning', message: `Column "${colName}" has ${outliers.length} outliers detected (IQR method)` });
        }
      }
    } else if (isDate) {
      dateCols.push(colName);
    } else {
      catCols.push(colName);
    }

    if (missingCount > 0) {
      const pct = ((missingCount / colValues.length) * 100).toFixed(2);
      issues.push({ type: 'missing_values', column: colName, severity: missingCount > colValues.length * 0.2 ? 'critical' : 'warning', message: `Missing values in ${colName} (${missingCount} / ${pct}%)` });
    }
  }

  const duplicateRows = totalRows - new Set(rows.map(r => JSON.stringify(Object.values(r)))).size;
  if (duplicateRows > 0) {
    const dupPct = ((duplicateRows / totalRows) * 100).toFixed(2);
    issues.push({ type: 'duplicate_rows', column: null, severity: duplicateRows > totalRows * 0.1 ? 'critical' : 'warning', message: `Duplicate rows: ${duplicateRows} (${dupPct}%)` });
  }

  const missingPct = totalCols > 0 && totalRows > 0 ? ((totalMissing / (totalRows * totalCols)) * 100).toFixed(2) : '0.00';

  return {
    totalRows,
    missingValues: totalMissing,
    missingPercentage: parseFloat(missingPct),
    duplicateRows,
    duplicatePercentage: totalRows > 0 ? parseFloat(((duplicateRows / totalRows) * 100).toFixed(2)) : 0,
    emptyColumns: emptyCols,
    constantColumns: constantCols,
    mixedTypeColumns: mixedTypeCols,
    outlierColumns: outlierCols,
    highCardinalityColumns: highCardinalityCols,
    dateColumns: dateCols,
    categoricalColumns: catCols,
    numericColumns: numCols,
    issues
  };
}

module.exports = { detectQualityIssues };
