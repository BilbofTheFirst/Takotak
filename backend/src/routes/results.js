const express = require('express');
const pool = require('../db/pool');
const { authenticateAdmin } = require('../middleware/auth');
const { calculatePoints } = require('../utils/scoring');

const router = express.Router();

// Create result and calculate points
router.post('/', authenticateAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { match_id, team1_goals, team2_goals } = req.body;

    // Insert result
    const result = await client.query(
      'INSERT INTO results (match_id, team1_goals, team2_goals) VALUES ($1, $2, $3) ON CONFLICT (match_id) DO UPDATE SET team1_goals = $2, team2_goals = $3 RETURNING *',
      [match_id, team1_goals, team2_goals]
    );

    // Update match status
    await client.query(
      'UPDATE matches SET status = $1 WHERE id = $2',
      ['finished', match_id]
    );

    // Get all predictions for this match and calculate points
    const predictions = await client.query(
      'SELECT * FROM predictions WHERE match_id = $1',
      [match_id]
    );

    for (const prediction of predictions.rows) {
      const points = calculatePoints(prediction, { team1_goals, team2_goals });
      
      await client.query(
        'INSERT INTO user_scores (user_id, match_id, points) VALUES ($1, $2, $3) ON CONFLICT (user_id, match_id) DO UPDATE SET points = $3',
        [prediction.user_id, match_id, points]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Result saved and points calculated', result: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create result error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Get leaderboard/rankings
router.get('/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        SUM(us.points) as total_points,
        COUNT(us.match_id) as matches_predicted
      FROM users u
      LEFT JOIN user_scores us ON u.id = us.user_id
      GROUP BY u.id, u.username
      ORDER BY total_points DESC NULLS LAST
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
