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
const {
  getAllSpecialPredictionScores,
  recalculateAllSpecialPredictionPoints
} = require('../utils/specialPredictions');
const { invalidateStatsOverviewCache, warmStatsOverviewCache } = require('../utils/statsOverview');

const router = express.Router();
let resultExtraColumnsReady = false;
let leaderboardUserColumnsReady = false;

const refreshStatsOverviewCache = () => {
  invalidateStatsOverviewCache();
  warmStatsOverviewCache(pool).catch(error => {
    console.warn('Stats overview cache warm failed:', error.message || error);
  });
};

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

    await client.query('UPDATE matches SET status = $1 WHERE id = $2', ['finished', match_id]);

    const predictions = await client.query('SELECT * FROM predictions WHERE match_id = $1', [match_id]);

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
    await recalculateAllSpecialPredictionPoints(client);

    await client.query('COMMIT');
    refreshStatsOverviewCache();
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

    const deletedResult = await client.query('DELETE FROM results WHERE match_id = $1 RETURNING *', [matchId]);

    await client.query('DELETE FROM user_scores WHERE match_id = $1', [matchId]);
    await client.query('UPDATE matches SET status = $1 WHERE id = $2', ['scheduled', matchId]);
    await propagateKnockoutTeams(client);
    await recalculateAllSpecialPredictionPoints(client);

    await client.query('COMMIT');
    refreshStatsOverviewCache();

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

// Leaderboard
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    await ensureLeaderboardUserColumns(pool);
    const [scoresResult, bonusScoresResult, specialScoresResult, usersResult] = await Promise.all([
      pool.query(`
        SELECT
          u.id,
          u.username,
          COALESCE(SUM(us.points), 0) as total_points,
          COUNT(us.match_id) as predictions_count,
          COUNT(CASE WHEN us.points = 3 THEN 1 END) as exact_scores,
          COUNT(CASE WHEN us.points = 2 THEN 1 END) as goal_differences,
          COUNT(CASE WHEN us.points = 1 THEN 1 END) as tendencies
        FROM users u
        LEFT JOIN user_scores us ON u.id = us.user_id
        GROUP BY u.id, u.username
      `),
      getAllBonusScores(pool),
      getAllSpecialPredictionScores(pool),
      pool.query('SELECT id, avatar_data, avatar_updated_at FROM users')
    ]);

    const avatarByUser = new Map(usersResult.rows.map(user => [Number(user.id), user]));
    const leaderboard = scoresResult.rows.map(row => {
      const userId = Number(row.id);
      const bonusScore = bonusScoresResult.scores.get(userId)?.points || 0;
      const specialScore = specialScoresResult.scores.get(userId)?.points || 0;
      const avatarUser = avatarByUser.get(userId);

      return {
        id: userId,
        username: row.username,
        total_points: Number(row.total_points) + bonusScore + specialScore,
        match_points: Number(row.total_points),
        bonus_points: bonusScore,
        special_points: specialScore,
        predictions_count: Number(row.predictions_count),
        exact_scores: Number(row.exact_scores),
        goal_differences: Number(row.goal_differences),
        tendencies: Number(row.tendencies),
        avatar_url: buildAvatarUrl(avatarUser)
      };
    });

    leaderboard.sort((a, b) => b.total_points - a.total_points || a.username.localeCompare(b.username, 'fr'));

    res.json(leaderboard.map((row, index) => ({ ...row, rank: index + 1 })));
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
