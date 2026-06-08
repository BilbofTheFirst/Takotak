const express = require('express');
const pool = require('../db/pool');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');
const { calculatePointsDetailed } = require('../utils/scoring');

const router = express.Router();

const isValidScore = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 20;
};

// Create result and calculate points
router.post('/', authenticateAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { match_id, team1_goals, team2_goals } = req.body;

    if (!match_id || !isValidScore(team1_goals) || !isValidScore(team2_goals)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Valid match and goals are required' });
    }

    const result = await client.query(
      `INSERT INTO results (match_id, team1_goals, team2_goals)
       VALUES ($1, $2, $3)
       ON CONFLICT (match_id)
       DO UPDATE SET
         team1_goals = EXCLUDED.team1_goals,
         team2_goals = EXCLUDED.team2_goals
       RETURNING *`,
      [match_id, Number(team1_goals), Number(team2_goals)]
    );

    await client.query(
      'UPDATE matches SET status = $1 WHERE id = $2',
      ['finished', match_id]
    );

    const predictions = await client.query(
      'SELECT * FROM predictions WHERE match_id = $1',
      [match_id]
    );

    for (const prediction of predictions.rows) {
      const scoring = calculatePointsDetailed(prediction, { team1_goals, team2_goals });

      await client.query(
        `INSERT INTO user_scores (user_id, match_id, points)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, match_id)
         DO UPDATE SET points = EXCLUDED.points`,
        [prediction.user_id, match_id, scoring.points]
      );
    }

    await client.query('COMMIT');
    res.json({
      message: 'Result saved and points calculated',
      result: result.rows[0],
      predictionsUpdated: predictions.rows.length
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create result error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Current user's stats
router.get('/user/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const statsResult = await pool.query(
      `SELECT
        COALESCE(SUM(us.points), 0)::int AS total_points,
        COUNT(us.match_id)::int AS matches_played,
        COALESCE(ROUND(AVG(us.points)::numeric, 2), 0)::float AS avg_points_per_match,
        COUNT(*) FILTER (WHERE us.points = 3)::int AS exact_scores,
        COUNT(*) FILTER (WHERE us.points = 2)::int AS correct_differences,
        COUNT(*) FILTER (WHERE us.points = 1)::int AS correct_winners,
        COUNT(*) FILTER (WHERE us.points = 0)::int AS wrong_predictions
      FROM user_scores us
      WHERE us.user_id = $1`,
      [userId]
    );

    const rankResult = await pool.query(
      `WITH leaderboard AS (
        SELECT
          u.id,
          COALESCE(SUM(us.points), 0) AS total_points,
          RANK() OVER (ORDER BY COALESCE(SUM(us.points), 0) DESC) AS rank
        FROM users u
        LEFT JOIN user_scores us ON u.id = us.user_id
        GROUP BY u.id
      )
      SELECT rank FROM leaderboard WHERE id = $1`,
      [userId]
    );

    res.json({
      ...statsResult.rows[0],
      rank: rankResult.rows[0]?.rank || null
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get leaderboard/rankings
router.get('/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.username,
        COALESCE(SUM(us.points), 0)::int as total_points,
        COUNT(us.match_id)::int as matches_predicted,
        RANK() OVER (ORDER BY COALESCE(SUM(us.points), 0) DESC) AS rank
      FROM users u
      LEFT JOIN user_scores us ON u.id = us.user_id
      GROUP BY u.id, u.username
      ORDER BY total_points DESC, u.username ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
