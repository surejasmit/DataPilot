const express = require('express');
const router = express.Router();
const project = require('../projects/Projects');
const authMiddleware = require('../auth/authMiddleware');
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  toggleFavorite,
} = require('../projects/Projects');
const { pool } = require('../config/db');

const auth = (req, res, next) => authMiddleware(req, res, next, pool);

router.get('/', auth, (req, res) => project.getProjects(req, res, pool));
router.get('/:id', auth, (req, res) => project.getProjectById(req, res, pool));
router.post('/', auth, (req, res) => project.createProject(req, res, pool));
router.put('/:id', auth, (req, res) => project.updateProject(req, res, pool));
router.delete('/:id', auth, (req, res) => project.deleteProject(req, res, pool));
router.post('/:id/favorite', auth, (req, res) => project.toggleFavorite(req, res, pool));

module.exports = router;