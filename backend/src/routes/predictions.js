const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create/Update prediction
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { match_id, team1_goals, team2_goals } = req.body;
    const user_id = req.user.id;

    if (team1_goals === undefined || team2_goals === undefined) {
      return res.status(400).json({ error: 'Goals required' });
    }

    // Check if match is open for predictions
    const match = await pool.query('SELECT * FROM matches WHERE id = $1', [match_id]);
    if (match.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const now = new Date();
    const matchTime = new Date(match.rows[0].start_time);
    if (now >= matchTime) {
      return res.status(400).json({ error: 'Match already started' });
    }

    const result = await pool.query(
      'INSERT INTO predictions (user_id, match_id, team1_goals, team2_goals) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, match_id) DO UPDATE SET team1_goals = $3, team2_goals = $4 RETURNING *',
      [user_id, match_id, team1_goals, team2_goals]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create prediction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user predictions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const result = await pool.query(
      'SELECT p.*, m.team1, m.team2, m.start_time FROM predictions p JOIN matches m ON p.match_id = m.id WHERE p.user_id = $1 ORDER BY m.start_time',
      [user_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get predictions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
