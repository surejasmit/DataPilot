const { pool } = require('../config/db');
const pythonService = require('../services/pythonAnalysis.service');
const db = require('../services/dataset/database.service');
const fs = require('fs');

async function fixFailedProjects() {
  console.log('=== Checking Failed Projects in Database ===');
  const res = await pool.query("SELECT * FROM projects WHERE status = 'FAILED' AND dataset_path IS NOT NULL");
  console.log(`Found ${res.rows.length} failed projects to fix.`);

  for (const proj of res.rows) {
    console.log(`\nProcessing Project #${proj.id} (${proj.name}) - ${proj.dataset_name}...`);
    try {
      await db.withTransaction(async (client) => {
        await db.updateProjectStatus(client, proj.id, 'ANALYZING');
      });

      const analysis = await pythonService.analyzeDataset(proj.dataset_path, proj.dataset_name, proj.id, proj.id, proj.user_id);
      const { profile, column_stats, statistics, chart_recommendations, insights, quality_report, preview_rows } = analysis;

      await db.withTransaction(async (client) => {
        await db.updateProjectDatasetInfo(client, proj.id, profile.total_rows ?? profile.totalRows, profile.total_columns ?? profile.totalColumns, fs.existsSync(proj.dataset_path) ? fs.statSync(proj.dataset_path).size : 0);
        await db.insertColumnStats(client, proj.id, column_stats);
        await db.insertProfile(client, proj.id, profile);
        await db.insertPreviewRows(client, proj.id, preview_rows);
        if (statistics && statistics.length > 0) await db.insertStatistics(client, proj.id, statistics);
        if (chart_recommendations && chart_recommendations.length > 0) await db.insertChartRecommendations(client, proj.id, chart_recommendations);
        if (insights && insights.length > 0) await db.insertInsights(client, proj.id, insights);
        if (quality_report) await db.insertQualityReport(client, proj.id, quality_report);
        await db.updateProjectStatus(client, proj.id, 'READY');
        await db.insertStatusHistory(client, proj.id, 'READY', 'Dataset analysis completed successfully');
      });

      console.log(`✅ SUCCESS: Project #${proj.id} is now READY with ${profile.total_rows} rows and ${profile.total_columns} columns!`);
    } catch (err) {
      console.error(`❌ ERROR fixing Project #${proj.id}:`, err.message);
    }
  }

  process.exit(0);
}

fixFailedProjects();
