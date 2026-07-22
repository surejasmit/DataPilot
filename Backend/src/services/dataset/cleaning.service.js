const { parseAndAnalyze } = require('./analyze.service');
const { detectQualityIssues } = require('./quality.service');
const logger = require('../../utils/logger');

async function loadFullDataset(filePath, fileName) {
  const { rows, columns } = await parseAndAnalyze(filePath, fileName);
  return { rows, columns };
}

function removeMissingValues(rows, columns) {
  const cleaned = rows.filter(row => {
    return columns.every(col => {
      const val = row[col];
      return val !== null && val !== undefined && val !== '';
    });
  });
  const removed = rows.length - cleaned.length;
  return { cleaned, removed };
}

function fillMissingValues(rows, columns, method = 'mode') {
  const filled = rows.map(row => ({ ...row }));
  for (const col of columns) {
    const values = rows.map(r => r[col]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    if (nonNullValues.length === 0) continue;

    let fillValue;
    const nums = nonNullValues.map(v => parseFloat(v)).filter(v => !isNaN(v));

    if (method === 'mean' && nums.length > 0) {
      fillValue = nums.reduce((a, b) => a + b, 0) / nums.length;
    } else if (method === 'median' && nums.length > 0) {
      nums.sort((a, b) => a - b);
      const mid = Math.floor(nums.length / 2);
      fillValue = nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
    } else {
      const freq = {};
      nonNullValues.forEach(v => {
        const key = String(v);
        freq[key] = (freq[key] || 0) + 1;
      });
      fillValue = Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b);
    }

    for (const row of filled) {
      if (row[col] === null || row[col] === undefined || row[col] === '') {
        row[col] = fillValue;
      }
    }
  }
  return { cleaned: filled, fillValue: null };
}

function removeDuplicateRows(rows) {
  const seen = new Set();
  const cleaned = [];
  for (const row of rows) {
    const key = JSON.stringify(Object.values(row));
    if (!seen.has(key)) {
      seen.add(key);
      cleaned.push(row);
    }
  }
  const removed = rows.length - cleaned.length;
  return { cleaned, removed };
}

function trimSpaces(rows, columns) {
  const cleaned = rows.map(row => {
    const newRow = { ...row };
    for (const col of columns) {
      if (typeof newRow[col] === 'string') {
        newRow[col] = newRow[col].trim();
      }
    }
    return newRow;
  });
  return { cleaned };
}

function convertDataTypes(rows, columnTypes) {
  const cleaned = rows.map(row => ({ ...row }));
  for (const [col, targetType] of Object.entries(columnTypes)) {
    for (const row of cleaned) {
      if (targetType === 'number') {
        const val = parseFloat(row[col]);
        row[col] = isNaN(val) ? row[col] : val;
      } else {
        row[col] = String(row[col]);
      }
    }
  }
  return { cleaned };
}

function normalizeData(rows, columns) {
  const cleaned = rows.map(row => ({ ...row }));
  for (const col of columns) {
    const values = cleaned.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
    if (values.length === 0) continue;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    if (range === 0) continue;
    for (const row of cleaned) {
      const val = parseFloat(row[col]);
      if (!isNaN(val)) {
        row[col] = (val - min) / range;
      }
    }
  }
  return { cleaned };
}

function standardizeData(rows, columns) {
  const cleaned = rows.map(row => ({ ...row }));
  for (const col of columns) {
    const values = cleaned.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
    if (values.length === 0) continue;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev === 0) continue;
    for (const row of cleaned) {
      const val = parseFloat(row[col]);
      if (!isNaN(val)) {
        row[col] = (val - mean) / stdDev;
      }
    }
  }
  return { cleaned };
}

async function performCleaning(filePath, fileName, operation, params = {}) {
  const { rows, columns } = await loadFullDataset(filePath, fileName);

  let result;
  switch (operation) {
    case 'remove_missing':
      result = removeMissingValues(rows, columns);
      break;
    case 'fill_missing':
      result = fillMissingValues(rows, columns, params.method || 'mode');
      break;
    case 'remove_duplicates':
      result = removeDuplicateRows(rows);
      break;
    case 'trim_spaces':
      result = trimSpaces(rows, columns);
      break;
    case 'convert_types':
      result = convertDataTypes(rows, params.columnTypes || {});
      break;
    case 'normalize':
      result = normalizeData(rows, columns);
      break;
    case 'standardize':
      result = standardizeData(rows, columns);
      break;
    default:
      throw new Error(`Unknown cleaning operation: ${operation}`);
  }

  return { cleanedRows: result.cleaned, columns, removed: result.removed || 0 };
}

module.exports = {
  loadFullDataset,
  removeMissingValues,
  fillMissingValues,
  removeDuplicateRows,
  trimSpaces,
  convertDataTypes,
  normalizeData,
  standardizeData,
  performCleaning
};
