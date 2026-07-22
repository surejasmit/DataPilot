const express = require('express');
const router = express.Router();

const authMiddleware = require('../auth/authMiddleware');
const signup = require('../auth/Signup');
const login = require('../auth/Login');
const { pool } = require('../config/db');

const auth = (req, res, next) => authMiddleware(req, res, next, pool);

router.post('/register', (req, res) => signup(req, res, pool));
router.post('/login', (req, res) => login(req, res, pool));
router.get('/me', auth, (req, res) => {
  res.json(req.user);
});

module.exports = router;