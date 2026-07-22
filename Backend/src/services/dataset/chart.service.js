function generateChartRecommendations(columnStats, rows) {
  const numericCols = columnStats.filter(c => c.isNumeric).map(c => c.columnName);
  const categoricalCols = columnStats.filter(c => c.isCategorical).map(c => c.columnName);
  const datetimeCols = columnStats.filter(c => c.isDatetime).map(c => c.columnName);

  const recommendations = [];

  if (numericCols.length >= 1) {
    recommendations.push({
      type: 'histogram',
      title: 'Distribution',
      columns: numericCols.slice(0, 1),
      reason: 'Show distribution of numeric values'
    });
    recommendations.push({
      type: 'boxplot',
      title: 'Box Plot',
      columns: numericCols.slice(0, 1),
      reason: 'Show quartiles and outliers'
    });
  }

  if (numericCols.length >= 2) {
    recommendations.push({
      type: 'scatter',
      title: 'Scatter Plot',
      columns: numericCols.slice(0, 2),
      reason: 'Show relationship between two numeric variables'
    });
    recommendations.push({
      type: 'heatmap',
      title: 'Correlation Heatmap',
      columns: numericCols,
      reason: 'Show correlations between numeric variables'
    });
  }

  if (categoricalCols.length >= 1 && numericCols.length >= 1) {
    recommendations.push({
      type: 'bar',
      title: 'Bar Chart',
      columns: [categoricalCols[0], numericCols[0]],
      reason: 'Compare numeric values across categories'
    });
  }

  if (categoricalCols.length >= 1) {
    recommendations.push({
      type: 'pie',
      title: 'Pie Chart',
      columns: [categoricalCols[0]],
      reason: 'Show proportion of categories'
    });
  }

  if (datetimeCols.length >= 1 && numericCols.length >= 1) {
    recommendations.push({
      type: 'line',
      title: 'Line Chart',
      columns: [datetimeCols[0], numericCols[0]],
      reason: 'Show trend over time'
    });
  }

  return recommendations;
}

module.exports = { generateChartRecommendations };