const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all matches with team details
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        m.id,
        m.team1_id,
        m.team2_id,
        t1.name as team1,
        t1.groupe as groupe1,
        t2.name as team2,
        t2.groupe as groupe2,
        m.start_time,
        m.description,
        m.status,
        m.created_at,
        r.team1_goals,
        r.team2_goals,
        CASE
          WHEN m.team1_id IS NOT NULL
           AND m.team2_id IS NOT NULL
           AND m.start_time > NOW()
           AND COALESCE(m.status, 'scheduled') <> 'finished'
          THEN true
          ELSE false
        END AS can_predict,
        CASE
          WHEN m.start_time <= NOW()
            OR COALESCE(m.status, 'scheduled') = 'finished'
          THEN true
          ELSE false
        END AS is_locked
      FROM matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.id
      LEFT JOIN teams t2 ON m.team2_id = t2.id
      LEFT JOIN results r ON m.id = r.match_id
      ORDER BY m.start_time
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single match with predictions
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const matchId = req.params.id;
    const match = await pool.query(`
      SELECT
        m.id,
        m.team1_id,
        m.team2_id,
        t1.name as team1,
        t1.groupe as groupe1,
        t2.name as team2,
        t2.groupe as groupe2,
        m.start_time,
        m.description,
        m.status,
        m.created_at
      FROM matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.id
      LEFT JOIN teams t2 ON m.team2_id = t2.id
      WHERE m.id = $1
    `, [matchId]);

    if (match.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const predictions = await pool.query(
      'SELECT * FROM predictions WHERE match_id = $1',
      [matchId]
    );

    const result = await pool.query(
      'SELECT * FROM results WHERE match_id = $1',
      [matchId]
    );

    res.json({
      match: match.rows[0],
      predictions: predictions.rows,
      result: result.rows[0] || null
    });
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
