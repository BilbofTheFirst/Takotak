const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const isValidScore = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 99;
};

// Create/Update prediction
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const { match_id, team1_goals, team2_goals } = req.body;
    const user_id = req.user.id;

    if (!match_id) {
      return res.status(400).json({ error: 'Match required' });
    }

    if (!isValidScore(team1_goals) || !isValidScore(team2_goals)) {
      return res.status(400).json({ error: 'Goals must be integers between 0 and 99' });
    }

    const match = await client.query('SELECT * FROM matches WHERE id = $1', [match_id]);
    if (match.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const selectedMatch = match.rows[0];

    if (!selectedMatch.team1_id || !selectedMatch.team2_id) {
      return res.status(400).json({ error: 'Teams are not known yet for this match' });
    }

    const now = new Date();
    const matchTime = new Date(selectedMatch.start_time);
    if (now >= matchTime) {
      return res.status(400).json({ error: 'Match already started' });
    }

    await client.query('BEGIN');

    const updateResult = await client.query(
      `UPDATE predictions
       SET team1_goals = $3,
           team2_goals = $4
       WHERE user_id = $1
         AND match_id = $2
       RETURNING *`,
      [user_id, match_id, Number(team1_goals), Number(team2_goals)]
    );

    let prediction;

    if (updateResult.rows.length > 0) {
      prediction = updateResult.rows[0];
    } else {
      const insertResult = await client.query(
        `INSERT INTO predictions (user_id, match_id, team1_goals, team2_goals)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [user_id, match_id, Number(team1_goals), Number(team2_goals)]
      );
      prediction = insertResult.rows[0];
    }

    await client.query('COMMIT');
    res.json(prediction);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Create prediction error:', error);
    res.status(500).json({
      error: 'Prediction save failed',
      detail: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  } finally {
    client.release();
  }
});

// Get user predictions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const result = await pool.query(
      `SELECT
        p.*,
        m.team1_id,
        m.team2_id,
        t1.name as team1,
        t2.name as team2,
        m.start_time
      FROM predictions p
      JOIN matches m ON p.match_id = m.id
      LEFT JOIN teams t1 ON m.team1_id = t1.id
      LEFT JOIN teams t2 ON m.team2_id = t2.id
      WHERE p.user_id = $1
      ORDER BY m.start_time`,
      [user_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get predictions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
