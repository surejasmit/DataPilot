function computeStatistics(values, dataType) {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  const missingCount = values.length - nonNullValues.length;
  const missingPercentage = values.length > 0 ? (missingCount / values.length) * 100 : 0;
  const uniqueCount = new Set(nonNullValues.map(v => String(v))).size;

  const stats = {
    missingCount,
    missingPercentage: Math.round(missingPercentage * 100) / 100,
    uniqueCount,
    minValue: null,
    maxValue: null,
    meanValue: null,
    medianValue: null,
    modeValue: null,
    stdDev: null,
    variance: null,
    q1: null,
    q3: null,
    iqr: null,
    rangeValue: null
  };

  if (nonNullValues.length === 0) return stats;

  if (dataType === 'number') {
    const numValues = nonNullValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
    if (numValues.length > 0) {
      numValues.sort((a, b) => a - b);
      stats.minValue = numValues[0];
      stats.maxValue = numValues[numValues.length - 1];
      stats.rangeValue = stats.maxValue - stats.minValue;
      stats.meanValue = Math.round((numValues.reduce((a, b) => a + b, 0) / numValues.length) * 10000) / 10000;

      const mid = Math.floor(numValues.length / 2);
      stats.medianValue = numValues.length % 2 === 0
        ? (numValues[mid - 1] + numValues[mid]) / 2
        : numValues[mid];

      const q1Index = Math.floor(numValues.length * 0.25);
      const q3Index = Math.floor(numValues.length * 0.75);
      stats.q1 = numValues[q1Index];
      stats.q3 = numValues[q3Index];
      stats.iqr = stats.q3 - stats.q1;

      const freq = {};
      numValues.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
      stats.modeValue = parseFloat(Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b));

      const mean = stats.meanValue;
      const variance = numValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numValues.length;
      stats.variance = Math.round(variance * 10000) / 10000;
      stats.stdDev = Math.round(Math.sqrt(variance) * 10000) / 10000;
    }
  } else {
    stats.minValue = nonNullValues[0];
    stats.maxValue = nonNullValues[nonNullValues.length - 1];
    const freq = {};
    nonNullValues.forEach(v => { freq[String(v)] = (freq[String(v)] || 0) + 1; });
    stats.modeValue = Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b);
  }

  return stats;
}

function generateStatistics(columnStats) {
  return columnStats
    .filter(col => col.dataType === 'number')
    .map(col => ({
      columnName: col.columnName,
      minValue: col.minValue,
      maxValue: col.maxValue,
      meanValue: col.meanValue,
      medianValue: col.medianValue,
      modeValue: col.modeValue,
      stdDev: col.stdDev,
      variance: col.variance,
      q1: col.q1,
      q3: col.q3,
      iqr: col.iqr,
      rangeValue: col.rangeValue,
      missingCount: col.missingCount,
      missingPercentage: col.missingPercentage,
      uniqueCount: col.uniqueCount
    }));
}

module.exports = { computeStatistics, generateStatistics };