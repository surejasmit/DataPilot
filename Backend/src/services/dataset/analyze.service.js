const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const XLSX = require('xlsx');

function detectFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.csv') return 'csv';
  if (ext === '.xlsx' || ext === '.xls') return 'excel';
  if (ext === '.json') return 'json';
  return 'unknown';
}

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath, { encoding: 'utf8' })
      .on('error', reject)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet, { defval: null });
}

function parseJSON(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

function validateDataset(rows, fileName) {
  if (!rows || rows.length === 0) {
    throw new Error('Dataset is empty');
  }
  const columns = Object.keys(rows[0]);
  if (!columns || columns.length === 0) {
    throw new Error('No columns found in dataset');
  }
  const headerCounts = {};
  columns.forEach(col => {
    headerCounts[col] = (headerCounts[col] || 0) + 1;
  });
  const duplicates = Object.entries(headerCounts).filter(([_, count]) => count > 1);
  if (duplicates.length > 0) {
    throw new Error(`Duplicate column headers found: ${duplicates.map(([name]) => name).join(', ')}`);
  }
  return { rows, columns };
}

async function parseAndAnalyze(filePath, fileName) {
  const fileType = detectFileType(fileName);
  if (fileType === 'unknown') {
    throw new Error(`Unsupported file type: ${fileName}. Only CSV, Excel, and JSON files are allowed.`);
  }

  const fileStats = fs.statSync(filePath);
  if (fileStats.size === 0) {
    throw new Error('Uploaded file is empty');
  }
  if (fileStats.size > 100 * 1024 * 1024) {
    throw new Error('File size exceeds 100MB limit');
  }

  let rows;
  try {
    if (fileType === 'csv') {
      rows = await parseCSV(filePath);
    } else if (fileType === 'excel') {
      rows = parseExcel(filePath);
    } else if (fileType === 'json') {
      rows = parseJSON(filePath);
    }
  } catch (err) {
    throw new Error(`Failed to parse ${fileType.toUpperCase()} file: ${err.message}`);
  }

  return validateDataset(rows, fileName);
}

function inferDataType(values) {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNullValues.length === 0) return 'string';

  const sampleSize = Math.min(100, nonNullValues.length);
  let numericCount = 0;
  let dateCount = 0;
  let booleanCount = 0;

  for (let i = 0; i < sampleSize; i++) {
    const val = nonNullValues[i];
    if (typeof val === 'number' || (!isNaN(val) && !isNaN(parseFloat(val)))) {
      numericCount++;
    } else if (val instanceof Date || !isNaN(Date.parse(val))) {
      dateCount++;
    } else if (typeof val === 'boolean' || ['true', 'false', '1', '0', 'yes', 'no'].includes(String(val).toLowerCase())) {
      booleanCount++;
    }
  }

  const total = numericCount + dateCount + booleanCount;
  if (numericCount / sampleSize > 0.8) return 'number';
  if (dateCount / sampleSize > 0.8) return 'date';
  if (booleanCount / sampleSize > 0.8) return 'boolean';
  return 'string';
}

module.exports = {
  detectFileType,
  parseCSV,
  parseExcel,
  parseJSON,
  validateDataset,
  parseAndAnalyze,
  inferDataType
};