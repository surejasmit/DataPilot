const analysisService = require('../services/analysis.service');

const getAnalysis = async (req, res) => {
  try {
    const { projectId } = req.params;
    const parsedId = parseInt(projectId);
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const result = await analysisService.getAnalysis(parsedId, req.user.id);
    if (!result) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate analysis', details: err.message });
  }
};

const getAllInsights = async (req, res) => {
  try {
    const result = await analysisService.getAllInsights(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch insights', details: err.message });
  }
};

module.exports = { getAnalysis, getAllInsights };
