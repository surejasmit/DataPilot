const analysisService = require('../services/analysis.service');

const getAnalysis = async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const analysis = await analysisService.getAnalysisByProjectId(projectId, req.user.id);
    if (!analysis) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(analysis);
  } catch (err) {
    console.error('Get analysis error:', err);
    res.status(500).json({ error: 'Failed to fetch analysis data', details: err.message });
  }
};

const getAllInsights = async (req, res) => {
  try {
    const insights = await analysisService.getAllInsights(req.user.id);
    res.json(insights);
  } catch (err) {
    console.error('Get all insights error:', err);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
};

const exportReport = async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const result = await analysisService.exportReport(projectId, req.user.id);
    if (!result) {
      return res.status(404).json({ error: 'Project not found or no dataset uploaded' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  } catch (err) {
    console.error('Export report error:', err);
    res.status(500).json({ error: 'Failed to generate report', details: err.message });
  }
};

const trainMLModels = async (req, res) => {
  try {
    const pythonService = require('../services/pythonAnalysis.service');
    const result = await pythonService.trainModels();
    res.json(result);
  } catch (err) {
    console.error('Train ML models error:', err);
    res.status(500).json({ error: 'Failed to trigger ML model training', details: err.message });
  }
};

const getMLStatus = async (req, res) => {
  try {
    const pythonService = require('../services/pythonAnalysis.service');
    const status = await pythonService.getMLStatus();
    res.json(status);
  } catch (err) {
    console.error('Get ML status error:', err);
    res.status(500).json({ error: 'Failed to fetch ML status', details: err.message });
  }
};

module.exports = {
  getAnalysis,
  getAllInsights,
  exportReport,
  trainMLModels,
  getMLStatus,
};
