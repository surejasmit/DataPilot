function generateInsights(rows, columns, columnStats) {
  const insights = [];
  const totalRows = rows.length;

  if (totalRows === 0) return insights;

  const numericCols = columnStats.filter(c => c.isNumeric || c.dataType === 'number');
  const categoricalCols = columnStats.filter(c => c.isCategorical || c.dataType === 'string');
  const datetimeCols = columnStats.filter(c => c.isDatetime || c.dataType === 'date');

  for (const col of numericCols) {
    const values = rows.map(r => parseFloat(r[col.columnName])).filter(v => !isNaN(v));
    if (values.length === 0) continue;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    values.sort((a, b) => a - b);
    const median = values.length % 2 === 0
      ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
      : values[Math.floor(values.length / 2)];

    insights.push({ type: 'statistic', title: `Average ${col.columnName}`, description: `The average value of ${col.columnName} is ${avg.toFixed(2)}`, details: { metric: `Average ${col.columnName}`, value: avg.toFixed(2) }, severity: 'info', confidence: 95 });
    insights.push({ type: 'statistic', title: `Maximum ${col.columnName}`, description: `The maximum value of ${col.columnName} is ${max.toFixed(2)}`, details: { metric: `Maximum ${col.columnName}`, value: max.toFixed(2) }, severity: 'info', confidence: 100 });
    insights.push({ type: 'statistic', title: `Minimum ${col.columnName}`, description: `The minimum value of ${col.columnName} is ${min.toFixed(2)}`, details: { metric: `Minimum ${col.columnName}`, value: min.toFixed(2) }, severity: 'info', confidence: 100 });
    insights.push({ type: 'statistic', title: `Median ${col.columnName}`, description: `The median value of ${col.columnName} is ${median.toFixed(2)}`, details: { metric: `Median ${col.columnName}`, value: median.toFixed(2) }, severity: 'info', confidence: 95 });
  }

  for (const col of categoricalCols) {
    const values = rows.map(r => String(r[col.columnName])).filter(v => v && v !== 'null' && v !== 'undefined');
    if (values.length === 0) continue;
    const freq = {};
    values.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 5);

    const uniqueCount = new Set(values).size;
    insights.push({ type: 'distribution', title: `${col.columnName} Distribution`, description: `Top categories in ${col.columnName}: ${top.map(([k, v]) => `${k} (${v})`).join(', ')}`, details: { metric: 'Unique Values', value: uniqueCount.toString() }, severity: 'info', confidence: 90 });
    insights.push({ type: 'distribution', title: `Top Values in ${col.columnName}`, description: `The most frequent value is "${sorted[0]?.[0]}" appearing ${sorted[0]?.[1]} times`, details: { metric: 'Top Value', value: `${sorted[0]?.[0]} (${sorted[0]?.[1]})` }, severity: 'info', confidence: 95 });
  }

  const missingValueCount = {};
  let totalMissing = 0;
  for (const col of columnStats) {
    const miss = rows.filter(r => r[col.columnName] === null || r[col.columnName] === undefined || r[col.columnName] === '').length;
    if (miss > 0) {
      missingValueCount[col.columnName] = miss;
      totalMissing += miss;
    }
  }
  if (Object.keys(missingValueCount).length > 0) {
    const worstCol = Object.entries(missingValueCount).sort((a, b) => b[1] - a[1])[0];
    const pct = ((worstCol[1] / totalRows) * 100).toFixed(2);
    insights.push({ type: 'quality', title: 'Missing Value Distribution', description: `${Object.keys(missingValueCount).length} columns have missing values. "${worstCol[0]}" has the most (${worstCol[1]} / ${pct}%)`, details: { metric: 'Total Missing', value: totalMissing.toString() }, severity: 'warning', confidence: 100 });
  }

  const duplicateRows = totalRows - new Set(rows.map(r => JSON.stringify(Object.values(r)))).size;
  if (duplicateRows > 0) {
    const dupPct = ((duplicateRows / totalRows) * 100).toFixed(2);
    insights.push({ type: 'quality', title: 'Duplicate Percentage', description: `${duplicateRows} duplicate rows found (${dupPct}% of total)`, details: { metric: 'Duplicate Rows', value: duplicateRows.toString() }, severity: 'warning', confidence: 100 });
  }

  const uniqueValueCounts = {};
  for (const col of columnStats) {
    const uniqueCount = new Set(rows.map(r => String(r[col.columnName]))).size;
    uniqueValueCounts[col.columnName] = uniqueCount;
  }
  const avgUnique = Object.values(uniqueValueCounts).reduce((a, b) => a + b, 0) / Object.keys(uniqueValueCounts).length || 0;
  insights.push({ type: 'summary', title: 'Unique Value Count', description: `Average unique values per column: ${avgUnique.toFixed(0)}`, details: { metric: 'Avg Unique/Column', value: avgUnique.toFixed(0) }, severity: 'info', confidence: 90 });

  const top10 = rows.slice(0, 10);
  insights.push({ type: 'preview', title: 'Top 10 Records', description: `First ${Math.min(10, totalRows)} records of the dataset`, details: { metric: 'Sample Records', value: `${Math.min(10, totalRows)} rows` }, severity: 'info', confidence: 100 });

  if (datetimeCols.length > 0 && numericCols.length > 0) {
    insights.push({ type: 'trend', title: 'Recent Trends', description: `Dataset contains time-series data (${datetimeCols[0].columnName}) with numeric metrics (${numericCols[0].columnName})`, details: { metric: 'Time Columns', value: datetimeCols.map(c => c.columnName).join(', ') }, severity: 'info', confidence: 85 });
  }

  if (numericCols.length >= 2) {
    const pairs = [];
    for (let i = 0; i < numericCols.length && pairs.length < 3; i++) {
      for (let j = i + 1; j < numericCols.length && pairs.length < 3; j++) {
        const col1 = numericCols[i].columnName;
        const col2 = numericCols[j].columnName;
        const vals1 = rows.map(r => parseFloat(r[col1])).filter(v => !isNaN(v));
        const vals2 = rows.map(r => parseFloat(r[col2])).filter(v => !isNaN(v));
        if (vals1.length > 1 && vals2.length > 1) {
          const mean1 = vals1.reduce((a, b) => a + b, 0) / vals1.length;
          const mean2 = vals2.reduce((a, b) => a + b, 0) / vals2.length;
          const std1 = Math.sqrt(vals1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0) / vals1.length);
          const std2 = Math.sqrt(vals2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0) / vals2.length);
          if (std1 > 0 && std2 > 0) {
            const n = Math.min(vals1.length, vals2.length);
            let cov = 0;
            for (let k = 0; k < n; k++) {
              cov += (vals1[k] - mean1) * (vals2[k] - mean2);
            }
            cov /= n;
            const corr = cov / (std1 * std2);
            pairs.push({ col1, col2, corr });
          }
        }
      }
    }
    for (const p of pairs) {
      const strength = Math.abs(p.corr) > 0.7 ? 'strong' : Math.abs(p.corr) > 0.4 ? 'moderate' : 'weak';
      insights.push({ type: 'correlation', title: `Correlation: ${p.col1} & ${p.col2}`, description: `${strength} ${p.corr >= 0 ? 'positive' : 'negative'} correlation (${p.corr.toFixed(4)}) between ${p.col1} and ${p.col2}`, details: { metric: 'Pearson Correlation', value: p.corr.toFixed(4) }, severity: 'info', confidence: 85 });
    }
  }

  return insights;
}

module.exports = { generateInsights };
