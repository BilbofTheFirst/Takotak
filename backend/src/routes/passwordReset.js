const crypto = require('crypto');
const express = require('express');
const pool = require('../db/pool');
const { hashPassword } = require('../utils/password');

const router = express.Router();
const RESET_TOKEN_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 60);
let passwordResetTableReady = false;

const ensurePasswordResetTable = async () => {
  if (passwordResetTableReady) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(128) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user
    ON password_reset_tokens(user_id)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash
    ON password_reset_tokens(token_hash)
  `);

  passwordResetTableReady = true;
};

const hashToken = (token) => crypto
  .createHash('sha256')
  .update(token)
  .digest('hex');

const getFrontendUrl = () =>
  (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

const shouldReturnResetLink = () =>
  process.env.NODE_ENV !== 'production' || process.env.RETURN_PASSWORD_RESET_LINK === 'true';

router.post('/request', async (req, res) => {
  try {
    await ensurePasswordResetTable();

    const email = (req.body.email || '').trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const genericMessage = 'Si un compte existe avec cet email, un lien de réinitialisation a été généré.';
    const userResult = await pool.query(
      'SELECT id, email FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.json({ message: genericMessage });
    }

    const user = userResult.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const ttlMinutes = Number.isFinite(RESET_TOKEN_TTL_MINUTES) && RESET_TOKEN_TTL_MINUTES > 0
      ? RESET_TOKEN_TTL_MINUTES
      : 60;

    await pool.query(
      `UPDATE password_reset_tokens
       SET used_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND used_at IS NULL`,
      [user.id]
    );

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP + ($3 * INTERVAL '1 minute'))`,
      [user.id, tokenHash, ttlMinutes]
    );

    const resetUrl = `${getFrontendUrl()}/reset-password?token=${token}`;
    console.log(`Password reset link for ${user.email}: ${resetUrl}`);

    const payload = { message: genericMessage };
    if (shouldReturnResetLink()) {
      payload.reset_url = resetUrl;
      payload.reset_token = token;
    }

    res.json(payload);
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/confirm', async (req, res) => {
  try {
    await ensurePasswordResetTable();

    const token = (req.body.token || '').trim();
    const { newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password confirmation does not match' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must contain at least 8 characters' });
    }

    const tokenHash = hashToken(token);
    const tokenResult = await pool.query(
      `SELECT prt.id, prt.user_id
       FROM password_reset_tokens prt
       WHERE prt.token_hash = $1
         AND prt.used_at IS NULL
         AND prt.expires_at > CURRENT_TIMESTAMP`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    const resetToken = tokenResult.rows[0];
    const passwordHash = await hashPassword(newPassword);

    await pool.query('BEGIN');
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, resetToken.user_id]
    );
    await pool.query(
      'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1',
      [resetToken.id]
    );
    await pool.query(
      `UPDATE password_reset_tokens
       SET used_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND used_at IS NULL`,
      [resetToken.user_id]
    );
    await pool.query('COMMIT');

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('Password reset confirm error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
