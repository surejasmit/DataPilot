const express = require('express');
const router = express.Router();

const { upload, handleMulterError } = require('../middleware/upload.middleware');
const authMiddleware = require('../auth/authMiddleware');
const datasetController = require('../controllers/datasetController');
const { pool } = require('../config/db');

const auth = (req, res, next) => authMiddleware(req, res, next, pool);

router.post('/upload', auth, upload.single('file'), handleMulterError, datasetController.uploadDataset);
router.get('/status', auth, (req, res) => {
  const datasetId = parseInt(req.query.id);
  if (!datasetId) {
    return res.status(400).json({ error: 'Dataset ID is required' });
  }
  req.params.id = datasetId;
  datasetController.getStatus(req, res);
});
router.get('/:id', auth, datasetController.getDataset);
router.get('/:id/profile', auth, datasetController.getProfile);
router.get('/:id/columns', auth, datasetController.getColumns);
router.get('/:id/preview', auth, datasetController.getPreview);
router.get('/:id/statistics', auth, datasetController.getStatistics);
router.get('/:id/charts', auth, datasetController.getChartRecommendations);
router.get('/:id/status', auth, datasetController.getStatus);
router.get('/:id/quality', auth, datasetController.getQuality);
router.post('/:id/quality', auth, datasetController.generateQuality);
router.get('/:id/cleaning', auth, datasetController.getCleaningHistory);
router.post('/:id/cleaning/confirm', auth, datasetController.confirmCleaning);
router.get('/:id/insights', auth, datasetController.getInsightsForDataset);
router.post('/:id/insights', auth, datasetController.generateInsightsNow);
router.post('/:id/question', auth, datasetController.askQuestion);
router.get('/:id/question/suggested', auth, datasetController.getSuggestedQuestions);

module.exports = router;