const express = require('express');
const pool = require('../db/pool');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');
const { calculatePointsDetailed } = require('../utils/scoring');
const {
  getThirdPlaceSnapshot,
  propagateKnockoutTeams,
  saveManualThirdPlaceOrder
} = require('../utils/knockoutPropagation');
const { getAllBonusScores } = require('../utils/bonusScoring');

const router = express.Router();
let resultExtraColumnsReady = false;
let leaderboardUserColumnsReady = false;

const isValidScore = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 20;
};

const isValidPenaltyScore = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 30;
};

const isKnockoutMatch = (matchId) => Number(matchId) >= 73;

const buildAvatarUrl = (user) => {
  if (!user?.avatar_data) return null;
  const rawVersion = user.avatar_updated_at ? new Date(user.avatar_updated_at).getTime() : Date.now();
  const version = Number.isNaN(rawVersion) ? Date.now() : rawVersion;
  return `/profile/users/${user.id}/avatar?v=${version}`;
};

const ensureLeaderboardUserColumns = async (clientOrPool = pool) => {
  if (leaderboardUserColumnsReady) return;
  await clientOrPool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_data TEXT');
  await clientOrPool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_mime_type VARCHAR(80)');
  await clientOrPool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_updated_at TIMESTAMP');
  leaderboardUserColumnsReady = true;
};

const ensureResultExtraColumns = async (clientOrPool = pool) => {
  if (resultExtraColumnsReady) return;

  await clientOrPool.query(`
    ALTER TABLE results
      ADD COLUMN IF NOT EXISTS team1_penalty_goals integer,
      ADD COLUMN IF NOT EXISTS team2_penalty_goals integer,
      ADD COLUMN IF NOT EXISTS winner_team_id integer
  `);

  resultExtraColumnsReady = true;
};

// Create/update result and calculate points
router.post('/', authenticateAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await ensureResultExtraColumns(client);

    const {
      match_id,
      team1_goals,
      team2_goals,
      team1_penalty_goals,
      team2_penalty_goals
    } = req.body;

    if (!match_id || !isValidScore(team1_goals) || !isValidScore(team2_goals)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Valid match and goals are required' });
    }

    const matchResult = await client.query(
      'SELECT id, team1_id, team2_id FROM matches WHERE id = $1',
      [match_id]
    );

    if (matchResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matchResult.rows[0];
    const isDraw = Number(team1_goals) === Number(team2_goals);
    const needsPenalties = isKnockoutMatch(match_id) && isDraw;

    let normalizedPenalty1 = null;
    let normalizedPenalty2 = null;
    let winnerTeamId = null;

    if (needsPenalties) {
      if (!isValidPenaltyScore(team1_penalty_goals) || !isValidPenaltyScore(team2_penalty_goals)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Penalty score required for a drawn knockout match' });
      }

      normalizedPenalty1 = Number(team1_penalty_goals);
      normalizedPenalty2 = Number(team2_penalty_goals);

      if (normalizedPenalty1 === normalizedPenalty2) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Penalty shootout cannot be tied' });
      }

      winnerTeamId = normalizedPenalty1 > normalizedPenalty2 ? match.team1_id : match.team2_id;
    } else if (Number(team1_goals) !== Number(team2_goals)) {
      winnerTeamId = Number(team1_goals) > Number(team2_goals) ? match.team1_id : match.team2_id;
    }

    const result = await client.query(
      `INSERT INTO results (
         match_id,
         team1_goals,
         team2_goals,
         team1_penalty_goals,
         team2_penalty_goals,
         winner_team_id
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (match_id)
       DO UPDATE SET
         team1_goals = EXCLUDED.team1_goals,
         team2_goals = EXCLUDED.team2_goals,
         team1_penalty_goals = EXCLUDED.team1_penalty_goals,
         team2_penalty_goals = EXCLUDED.team2_penalty_goals,
         winner_team_id = EXCLUDED.winner_team_id
       RETURNING *`,
      [
        match_id,
        Number(team1_goals),
        Number(team2_goals),
        normalizedPenalty1,
        normalizedPenalty2,
        winnerTeamId
      ]
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

    await propagateKnockoutTeams(client);

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

router.get('/third-places', authenticateAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const snapshot = await getThirdPlaceSnapshot(client);
    res.json(snapshot);
  } catch (error) {
    console.error('Get third places error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.post('/third-places/order', authenticateAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { group_codes } = req.body;
    if (!Array.isArray(group_codes) || group_codes.some(code => !/^[A-L]$/.test(String(code)))) {
      return res.status(400).json({ error: 'Valid group_codes array required' });
    }

    await client.query('BEGIN');
    await saveManualThirdPlaceOrder(client, group_codes.map(code => String(code)));
    await propagateKnockoutTeams(client);
    await client.query('COMMIT');

    const snapshot = await getThirdPlaceSnapshot(client);
    res.json(snapshot);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Save third places order error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Delete result and related points
router.delete('/:matchId', authenticateAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const matchId = Number(req.params.matchId);

    if (!Number.isInteger(matchId)) {
      return res.status(400).json({ error: 'Valid match id required' });
    }

    await client.query('BEGIN');
    await ensureResultExtraColumns(client);

    const deletedResult = await client.query(
      'DELETE FROM results WHERE match_id = $1 RETURNING *',
      [matchId]
    );

    await client.query('DELETE FROM user_scores WHERE match_id = $1', [matchId]);
    await client.query('UPDATE matches SET status = $1 WHERE id = $2', ['scheduled', matchId]);
    await propagateKnockoutTeams(client);

    await client.query('COMMIT');

    res.json({
      message: 'Result deleted and points cleared',
      deleted: deletedResult.rows.length > 0
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete result error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Current user's stats
router.get('/user/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { scores: bonusScores } = await getAllBonusScores(pool);
    const userBonus = bonusScores.get(Number(userId))?.points || 0;

    const statsResult = await pool.query(
      `SELECT
        COALESCE(SUM(us.points), 0)::int AS match_points,
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

    const rankRows = await pool.query(
      `SELECT
        u.id,
        COALESCE(SUM(us.points), 0)::int AS match_points
       FROM users u
       LEFT JOIN user_scores us ON u.id = us.user_id
       GROUP BY u.id`
    );

    const ranked = rankRows.rows
      .map(row => ({
        id: Number(row.id),
        total_points: Number(row.match_points || 0) + (bonusScores.get(Number(row.id))?.points || 0)
      }))
      .sort((a, b) => b.total_points - a.total_points || a.id - b.id);

    const rank = ranked.findIndex(row => row.id === Number(userId)) + 1;
    const baseStats = statsResult.rows[0];

    res.json({
      ...baseStats,
      bonus_points: userBonus,
      total_points: Number(baseStats.match_points || 0) + userBonus,
      rank: rank || null
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get leaderboard/rankings
router.get('/leaderboard', async (req, res) => {
  try {
    await ensureLeaderboardUserColumns();
    const { scores: bonusScores } = await getAllBonusScores(pool);

    const result = await pool.query(`
      SELECT
        u.id,
        u.username,
        u.avatar_data,
        u.avatar_updated_at,
        COALESCE(SUM(us.points), 0)::int as match_points,
        COUNT(us.match_id)::int as matches_predicted
      FROM users u
      LEFT JOIN user_scores us ON u.id = us.user_id
      GROUP BY u.id, u.username, u.avatar_data, u.avatar_updated_at
    `);

    const latestMatchResult = await pool.query(`
      SELECT r.match_id
      FROM results r
      JOIN matches m ON m.id = r.match_id
      ORDER BY m.start_time DESC NULLS LAST, r.match_id DESC
      LIMIT 1
    `);

    const latestMatchId = latestMatchResult.rows[0]?.match_id ? Number(latestMatchResult.rows[0].match_id) : null;
    let latestScoreByUser = new Map();

    if (latestMatchId) {
      const latestScores = await pool.query(
        'SELECT user_id, points FROM user_scores WHERE match_id = $1',
        [latestMatchId]
      );
      latestScoreByUser = new Map(latestScores.rows.map(row => [Number(row.user_id), Number(row.points || 0)]));
    }

    const rows = result.rows.map(row => {
      const id = Number(row.id);
      const matchPoints = Number(row.match_points || 0);
      const bonusPoints = bonusScores.get(id)?.points || 0;
      return {
        id,
        username: row.username,
        avatar_url: buildAvatarUrl(row),
        match_points: matchPoints,
        bonus_points: bonusPoints,
        total_points: matchPoints + bonusPoints,
        previous_total_points: latestMatchId ? matchPoints - (latestScoreByUser.get(id) || 0) + bonusPoints : matchPoints + bonusPoints,
        matches_predicted: Number(row.matches_predicted || 0)
      };
    });

    const rankedRows = [...rows]
      .sort((a, b) => b.total_points - a.total_points || a.username.localeCompare(b.username, 'fr'))
      .map((row, index) => ({ ...row, rank: index + 1 }));

    const previousRanks = new Map(
      [...rows]
        .sort((a, b) => b.previous_total_points - a.previous_total_points || a.username.localeCompare(b.username, 'fr'))
        .map((row, index) => [row.id, index + 1])
    );

    res.json(rankedRows.map(row => {
      const previousRank = previousRanks.get(row.id) || row.rank;
      const trend = previousRank - row.rank;
      return {
        ...row,
        previous_rank: previousRank,
        trend,
        latest_match_id: latestMatchId
      };
    }));
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/leaderboard/progression', async (req, res) => {
  try {
    await ensureLeaderboardUserColumns();

    const usersResult = await pool.query(`
      SELECT id, username, avatar_data, avatar_updated_at
      FROM users
      ORDER BY username ASC
    `);

    const matchesResult = await pool.query(`
      SELECT m.id, m.start_time
      FROM matches m
      JOIN results r ON r.match_id = m.id
      ORDER BY m.start_time ASC NULLS LAST, m.id ASC
    `);

    const scoresResult = await pool.query(`
      SELECT us.user_id, us.match_id, us.points
      FROM user_scores us
      JOIN results r ON r.match_id = us.match_id
    `);

    const pointsByUserAndMatch = new Map();
    scoresResult.rows.forEach(row => {
      pointsByUserAndMatch.set(`${Number(row.user_id)}:${Number(row.match_id)}`, Number(row.points || 0));
    });

    const orderedMatches = matchesResult.rows.map((match, index) => ({
      match_number: index + 1,
      match_id: Number(match.id),
      start_time: match.start_time
    }));

    const users = usersResult.rows.map(user => {
      let cumulative = 0;
      const id = Number(user.id);
      const series = [{ match_number: 0, match_id: null, points: 0 }];

      orderedMatches.forEach(match => {
        cumulative += pointsByUserAndMatch.get(`${id}:${match.match_id}`) || 0;
        series.push({
          match_number: match.match_number,
          match_id: match.match_id,
          points: cumulative
        });
      });

      return {
        id,
        username: user.username,
        avatar_url: buildAvatarUrl(user),
        total_match_points: cumulative,
        series
      };
    });

    res.json({
      matches: [{ match_number: 0, match_id: null, start_time: null }, ...orderedMatches],
      users
    });
  } catch (error) {
    console.error('Get leaderboard progression error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
