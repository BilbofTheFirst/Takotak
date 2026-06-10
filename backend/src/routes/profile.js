const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');
const { hashPassword, comparePassword } = require('../utils/password');

const router = express.Router();
const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE_BYTES = 3 * 1024 * 1024;
let userProfileColumnsReady = false;

const ensureUserProfileColumns = async () => {
  if (userProfileColumnsReady) return;
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_data TEXT');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_mime_type VARCHAR(80)');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_updated_at TIMESTAMP');
  userProfileColumnsReady = true;
};

const buildAvatarUrl = (user) => {
  if (!user?.avatar_data) return null;
  const rawVersion = user.avatar_updated_at ? new Date(user.avatar_updated_at).getTime() : Date.now();
  const version = Number.isNaN(rawVersion) ? Date.now() : rawVersion;
  return `/profile/users/${user.id}/avatar?v=${version}`;
};

const buildPublicUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  is_admin: Boolean(user.is_admin),
  avatar_url: buildAvatarUrl(user)
});

const parseAvatarDataUrl = (imageData) => {
  if (typeof imageData !== 'string') return null;
  const trimmed = imageData.trim();
  const match = trimmed.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) return null;

  const mimeType = match[1];
  const base64 = match[2].replace(/\s/g, '');
  if (!ALLOWED_AVATAR_MIME_TYPES.includes(mimeType)) return null;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) return null;

  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length || buffer.length > MAX_AVATAR_SIZE_BYTES) return null;

  return { mimeType, base64 };
};

router.get('/me', authenticateToken, async (req, res) => {
  try {
    await ensureUserProfileColumns();
    const result = await pool.query(
      `SELECT id, username, email, is_admin, avatar_data, avatar_updated_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: buildPublicUser(result.rows[0]) });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/me/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All password fields are required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password confirmation does not match' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must contain at least 8 characters' });
    }

    const result = await pool.query('SELECT id, password_hash FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentPasswordMatch = await comparePassword(currentPassword, result.rows[0].password_hash);
    if (!currentPasswordMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const sameAsCurrentPassword = await comparePassword(newPassword, result.rows[0].password_hash);
    if (sameAsCurrentPassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    const passwordHash = await hashPassword(newPassword);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/me/avatar', authenticateToken, async (req, res) => {
  try {
    await ensureUserProfileColumns();
    const parsedAvatar = parseAvatarDataUrl(req.body.imageData || req.body.image_data);
    if (!parsedAvatar) {
      return res.status(400).json({ error: 'Valid PNG, JPG or WebP image required (max 3 MB)' });
    }

    const result = await pool.query(
      `UPDATE users
       SET avatar_data = $1, avatar_mime_type = $2, avatar_updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, username, email, is_admin, avatar_data, avatar_updated_at`,
      [parsedAvatar.base64, parsedAvatar.mimeType, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: buildPublicUser(result.rows[0]), message: 'Avatar updated successfully' });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/me/avatar', authenticateToken, async (req, res) => {
  try {
    await ensureUserProfileColumns();
    const result = await pool.query(
      `UPDATE users
       SET avatar_data = NULL, avatar_mime_type = NULL, avatar_updated_at = NULL
       WHERE id = $1
       RETURNING id, username, email, is_admin, avatar_data, avatar_updated_at`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: buildPublicUser(result.rows[0]), message: 'Avatar removed successfully' });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/users/:userId/avatar', async (req, res) => {
  try {
    await ensureUserProfileColumns();
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const result = await pool.query(
      'SELECT avatar_data, avatar_mime_type FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].avatar_data) {
      return res.status(404).json({ error: 'Avatar not found' });
    }

    res.setHeader('Content-Type', result.rows[0].avatar_mime_type || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(result.rows[0].avatar_data, 'base64'));
  } catch (error) {
    console.error('Get avatar error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
