const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');
const { calculatePointsDetailed } = require('../utils/scoring');

const router = express.Router();

const isValidScore = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 99;
};

const buildAvatarUrl = (user) => {
  if (!user?.avatar_data) return null;
  const rawVersion = user.avatar_updated_at ? new Date(user.avatar_updated_at).getTime() : Date.now();
  const version = Number.isNaN(rawVersion) ? Date.now() : rawVersion;
  return `/profile/users/${user.id}/avatar?v=${version}`;
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
      detail: error.message,
      code: error.code
    });
  } finally {
    client.release();
  }
});

// Get public predictions for a started/finished match
router.get('/match/:matchId/public', authenticateToken, async (req, res) => {
  try {
    const matchId = Number(req.params.matchId);
    if (!Number.isInteger(matchId)) {
      return res.status(400).json({ error: 'Valid match id required' });
    }

    const matchResult = await pool.query(
      `SELECT
        m.id,
        m.start_time,
        m.status,
        m.team1_id,
        m.team2_id,
        t1.name as team1,
        t2.name as team2,
        r.team1_goals,
        r.team2_goals,
        CASE
          WHEN (m.start_time AT TIME ZONE 'Europe/Brussels') <= NOW()
            OR COALESCE(m.status, 'scheduled') = 'finished'
          THEN true
          ELSE false
        END AS is_visible,
        CASE
          WHEN r.match_id IS NOT NULL
            OR COALESCE(m.status, 'scheduled') = 'finished'
          THEN true
          ELSE false
        END AS has_result
       FROM matches m
       LEFT JOIN teams t1 ON m.team1_id = t1.id
       LEFT JOIN teams t2 ON m.team2_id = t2.id
       LEFT JOIN results r ON r.match_id = m.id
       WHERE m.id = $1`,
      [matchId]
    );

    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matchResult.rows[0];
    if (!match.is_visible) {
      return res.status(403).json({ error: 'Predictions are hidden until kickoff' });
    }

    const predictionsResult = await pool.query(
      `SELECT
        p.user_id,
        p.team1_goals,
        p.team2_goals,
        u.username,
        u.avatar_data,
        u.avatar_updated_at
       FROM predictions p
       JOIN users u ON u.id = p.user_id
       WHERE p.match_id = $1
       ORDER BY u.username ASC`,
      [matchId]
    );

    const hasResult = Boolean(match.has_result && match.team1_goals !== null && match.team2_goals !== null);
    const predictions = predictionsResult.rows.map(row => {
      const scoring = hasResult
        ? calculatePointsDetailed(row, { team1_goals: match.team1_goals, team2_goals: match.team2_goals })
        : null;

      return {
        user_id: Number(row.user_id),
        username: row.username,
        avatar_url: buildAvatarUrl(row),
        team1_goals: Number(row.team1_goals),
        team2_goals: Number(row.team2_goals),
        points: scoring?.points ?? null,
        category: scoring?.category ?? null,
        label: scoring?.label ?? null
      };
    });

    res.json({
      match: {
        id: Number(match.id),
        team1: match.team1,
        team2: match.team2,
        team1_goals: hasResult ? Number(match.team1_goals) : null,
        team2_goals: hasResult ? Number(match.team2_goals) : null,
        has_result: hasResult
      },
      predictions
    });
  } catch (error) {
    console.error('Get public match predictions error:', error);
    res.status(500).json({ error: 'Server error', detail: error.message, code: error.code });
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
    res.status(500).json({ error: 'Server error', detail: error.message, code: error.code });
  }
});

module.exports = router;
