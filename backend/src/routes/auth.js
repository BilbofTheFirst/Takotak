const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { hashPassword, comparePassword } = require('../utils/password');

const router = express.Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'alexandre_jacques@hotmail.com')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

const isAdminUser = (user) =>
  Boolean(user?.is_admin) || ADMIN_EMAILS.includes((user?.email || '').trim().toLowerCase());

const buildPublicUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  is_admin: isAdminUser(user)
});

const createToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username, email: user.email, is_admin: isAdminUser(user) },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

router.post('/register', async (req, res) => {
  try {
    const username = (req.body.username || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must contain at least 3 characters' });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must contain at least 8 characters' });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($2)',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email or username already registered' });
    }

    const passwordHash = await hashPassword(password);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, is_admin`,
      [username, email, passwordHash]
    );

    const user = result.rows[0];
    const token = createToken(user);

    res.json({ user: buildPublicUser(user), token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordMatch = await comparePassword(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = createToken(user);

    res.json({ user: buildPublicUser(user), token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
