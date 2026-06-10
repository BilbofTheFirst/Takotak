const express = require('express');
const pool = require('../db/pool');
const { authenticateAdmin } = require('../middleware/auth');
const { hashPassword } = require('../utils/password');

const router = express.Router();
const TEMPORARY_PASSWORD = 'takotak';

const buildPublicUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  is_admin: Boolean(user.is_admin),
  created_at: user.created_at
});

router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, email, is_admin, created_at
      FROM users
      ORDER BY LOWER(username), LOWER(email)
    `);

    res.json(result.rows.map(buildPublicUser));
  } catch (error) {
    console.error('Admin users list error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/users/:userId/reset-password', authenticateAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const existingUser = await pool.query(
      'SELECT id, username, email, is_admin, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordHash = await hashPassword(TEMPORARY_PASSWORD);
    const result = await pool.query(
      `UPDATE users
       SET password_hash = $1
       WHERE id = $2
       RETURNING id, username, email, is_admin, created_at`,
      [passwordHash, userId]
    );

    res.json({
      user: buildPublicUser(result.rows[0]),
      temporary_password: TEMPORARY_PASSWORD,
      message: `Mot de passe réinitialisé à "${TEMPORARY_PASSWORD}".`
    });
  } catch (error) {
    console.error('Admin reset user password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
