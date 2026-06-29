const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');
const { getStatsOverview } = require('../utils/statsOverview');

const router = express.Router();

const getRecentActivePlayerCount = async () => {
  const result = await pool.query(`
    WITH recent_finished_matches AS (
      SELECT m.id
      FROM matches m
      JOIN results r ON r.match_id = m.id
      ORDER BY m.start_time DESC NULLS LAST, m.id DESC
      LIMIT 5
    )
    SELECT COUNT(DISTINCT p.user_id)::int AS active_players
    FROM predictions p
    JOIN recent_finished_matches rfm ON rfm.id = p.match_id
  `);

  return Number(result.rows[0]?.active_players || 0);
};

router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const [overview, activePlayers] = await Promise.all([
      getStatsOverview(pool, req.user.id),
      getRecentActivePlayerCount()
    ]);

    res.json({
      ...overview,
      overview: {
        ...overview.overview,
        active_players: activePlayers,
        active_players_window: 5
      }
    });
  } catch (error) {
    console.error('Get stats overview error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
