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

router.put('/me', auth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    if (email) {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name) { updates.push(`name = $${paramIndex}`); values.push(name); paramIndex++; }
    if (email) { updates.push(`email = $${paramIndex}`); values.push(email); paramIndex++; }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(userId);
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, name, created_at`,
      values
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.put('/me/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const bcrypt = require('bcrypt');
    const valid = await bcrypt.compare(currentPassword, user.rows[0].password);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

router.delete('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const projects = await pool.query('SELECT dataset_path FROM projects WHERE user_id = $1', [userId]);
    for (const proj of projects.rows) {
      if (proj.dataset_path) {
        try {
          const fs = require('fs');
          const path = require('path');
          const filePath = path.resolve(proj.dataset_path);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (e) {}
      }
    }

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;