const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/authMiddleware');
const analysisController = require('../controllers/analysisController');
const { pool } = require('../config/db');

const auth = (req, res, next) => authMiddleware(req, res, next, pool);
router.get('/insights/all', auth, analysisController.getAllInsights);
router.get('/:projectId/export-report', auth, analysisController.exportReport);
router.post('/ml/train', auth, analysisController.trainMLModels);
router.get('/ml/status', auth, analysisController.getMLStatus);
router.get('/:projectId', auth, analysisController.getAnalysis);

module.exports = router;
