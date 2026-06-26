const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');
const { calculatePointsDetailed } = require('../utils/scoring');
const { GROUP_CODES, ensureBonusPredictionTable, getBonusLockStatusForUser } = require('../utils/bonusScoring');
const {
  SPECIAL_PREDICTION_DEFINITIONS,
  ensureSpecialPredictionsTable,
  getFirstMatchdayStatus
} = require('../utils/specialPredictions');
const { getKnockoutPredictionAccess } = require('../utils/knockoutPredictions');

const router = express.Router();
let predictionAuditReady = false;

const isValidScore = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 99;
};

const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== '';
const isKnockoutMatchId = (matchId) => Number(matchId) > 72;

const parseJsonValue = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch (_) { return fallback; }
  }
  return value;
};

const ensurePredictionAuditTables = async (clientOrPool = pool) => {
  if (predictionAuditReady) return;

  await clientOrPool.query(`
    ALTER TABLE predictions
      ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT CURRENT_TIMESTAMP
  `);

  await clientOrPool.query(`
    CREATE TABLE IF NOT EXISTS prediction_blocked_attempts (
      id serial PRIMARY KEY,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      match_id integer NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      team1_goals integer,
      team2_goals integer,
      reason varchar(80) NOT NULL,
      attempted_at timestamp DEFAULT CURRENT_TIMESTAMP,
      ip_address varchar(80),
      user_agent text
    )
  `);

  await clientOrPool.query('CREATE INDEX IF NOT EXISTS idx_prediction_blocked_attempts_user_match ON prediction_blocked_attempts(user_id, match_id)');
  predictionAuditReady = true;
};

const recordBlockedPredictionAttempt = async (clientOrPool, req, { userId, matchId, team1Goals, team2Goals, reason }) => {
  await ensurePredictionAuditTables(clientOrPool);
  await clientOrPool.query(
    `INSERT INTO prediction_blocked_attempts (user_id, match_id, team1_goals, team2_goals, reason, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      userId,
      matchId,
      Number.isInteger(Number(team1Goals)) ? Number(team1Goals) : null,
      Number.isInteger(Number(team2Goals)) ? Number(team2Goals) : null,
      reason,
      req.ip || null,
      req.get('user-agent') || null
    ]
  );
};

const buildAvatarUrl = (user) => {
  if (!user?.avatar_data) return null;
  const userId = user.id || user.user_id;
  if (!userId) return null;
  const rawVersion = user.avatar_updated_at ? new Date(user.avatar_updated_at).getTime() : Date.now();
  const version = Number.isNaN(rawVersion) ? Date.now() : rawVersion;
  return `/profile/users/${userId}/avatar?v=${version}`;
};

const buildBonusProgress = (row) => {
  const groupWinners = parseJsonValue(row?.group_winners, {});
  const parsedSemifinalists = parseJsonValue(row?.semifinalists, []);
  const semifinalists = Array.isArray(parsedSemifinalists) ? parsedSemifinalists : [];
  const missing = [];

  GROUP_CODES.forEach(group => {
    if (!hasValue(groupWinners[group])) missing.push(`Vainqueur groupe ${group}`);
  });

  if (!hasValue(row?.champion)) missing.push('Champion');
  if (!hasValue(row?.runner_up)) missing.push('Finaliste perdant');

  const semifinalistsCompleted = semifinalists.filter(hasValue).slice(0, 4).length;
  for (let i = semifinalistsCompleted; i < 4; i += 1) {
    missing.push(`Demi-finaliste ${i + 1}`);
  }

  const total = GROUP_CODES.length + 6;
  return {
    completed: total - missing.length,
    total,
    missing,
    missing_count: missing.length,
    complete: missing.length === 0,
    updated_at: row?.updated_at || null
  };
};

const buildSpecialProgress = (rows = []) => {
  const valueByCode = new Map(rows.map(row => [row.code, row.predicted_value]));
  const missing = [];

  SPECIAL_PREDICTION_DEFINITIONS.forEach(definition => {
    if (!hasValue(valueByCode.get(definition.code))) missing.push(definition.label);
  });

  return {
    completed: SPECIAL_PREDICTION_DEFINITIONS.length - missing.length,
    total: SPECIAL_PREDICTION_DEFINITIONS.length,
    missing,
    missing_count: missing.length,
    complete: missing.length === 0
  };
};

// User attention status for next 24h and early bonus reminders
router.get('/attention-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await Promise.all([
      ensureBonusPredictionTable(pool),
      ensureSpecialPredictionsTable(pool)
    ]);

    const [matchesResult, bonusResult, specialResult, bonusLockStatus, firstMatchdayStatus] = await Promise.all([
      pool.query(
        `SELECT
          m.id,
          to_char(m.start_time, 'YYYY-MM-DD"T"HH24:MI:SS') AS start_time,
          t1.name AS team1,
          t2.name AS team2,
          t1.groupe AS groupe1,
          p.user_id AS prediction_user_id
         FROM matches m
         JOIN teams t1 ON m.team1_id = t1.id
         JOIN teams t2 ON m.team2_id = t2.id
         LEFT JOIN predictions p ON p.match_id = m.id AND p.user_id = $1
         WHERE m.team1_id IS NOT NULL
           AND m.team2_id IS NOT NULL
           AND (m.start_time AT TIME ZONE 'Europe/Brussels') > NOW()
           AND (m.start_time AT TIME ZONE 'Europe/Brussels') <= NOW() + INTERVAL '24 hours'
         ORDER BY m.start_time ASC, m.id ASC`,
        [userId]
      ),
      pool.query('SELECT * FROM bonus_predictions WHERE user_id = $1', [userId]),
      pool.query('SELECT * FROM special_predictions WHERE user_id = $1 AND code = ANY($2::varchar[])', [userId, SPECIAL_PREDICTION_DEFINITIONS.map(definition => definition.code)]),
      getBonusLockStatusForUser(pool, userId),
      getFirstMatchdayStatus(pool)
    ]);

    const next24Matches = matchesResult.rows.map(match => ({
      id: Number(match.id),
      start_time: match.start_time,
      team1: match.team1,
      team2: match.team2,
      group: match.groupe1,
      predicted: Boolean(match.prediction_user_id)
    }));

    const missingMatches = next24Matches.filter(match => !match.predicted);
    const bonusProgress = buildBonusProgress(bonusResult.rows[0]);
    const specialProgress = buildSpecialProgress(specialResult.rows);

    const bonusUrgent = !bonusLockStatus.locked && !bonusProgress.complete;
    const specialUrgent = !firstMatchdayStatus.locked && !specialProgress.complete;

    const totalMissing = missingMatches.length
      + (bonusUrgent ? bonusProgress.missing_count : 0)
      + (specialUrgent ? specialProgress.missing_count : 0);

    res.json({
      generated_at: new Date().toISOString(),
      window_hours: 24,
      has_attention: totalMissing > 0,
      total_missing: totalMissing,
      matches: {
        total: next24Matches.length,
        completed: next24Matches.length - missingMatches.length,
        missing_count: missingMatches.length,
        missing: missingMatches
      },
      bonus: {
        locked: Boolean(bonusLockStatus.locked),
        global_locked: Boolean(bonusLockStatus.global_locked),
        admin_unlocked: Boolean(bonusLockStatus.admin_unlocked),
        deadline: bonusLockStatus.first_match_time,
        urgent: bonusUrgent,
        ...bonusProgress
      },
      special: {
        locked: Boolean(firstMatchdayStatus.locked),
        deadline: firstMatchdayStatus.deadline,
        urgent: specialUrgent,
        ...specialProgress
      }
    });
  } catch (error) {
    console.error('Get prediction attention status error:', error);
    res.status(500).json({ error: 'Server error', detail: error.message, code: error.code });
  }
});

// Create/Update prediction
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const { match_id, team1_goals, team2_goals } = req.body;
    const user_id = req.user.id;
    const matchId = Number(match_id);

    if (!Number.isInteger(matchId)) {
      return res.status(400).json({ error: 'Valid match required' });
    }

    if (!isValidScore(team1_goals) || !isValidScore(team2_goals)) {
      return res.status(400).json({ error: 'Goals must be integers between 0 and 99' });
    }

    await client.query('BEGIN');
    await ensurePredictionAuditTables(client);

    const match = await client.query(
      `SELECT
        m.*,
        to_char(m.start_time, 'YYYY-MM-DD"T"HH24:MI:SS') AS start_time_label,
        CASE
          WHEN (m.start_time AT TIME ZONE 'Europe/Brussels') <= NOW()
            OR COALESCE(m.status, 'scheduled') = 'finished'
          THEN true
          ELSE false
        END AS prediction_locked
       FROM matches m
       WHERE m.id = $1`,
      [matchId]
    );

    if (match.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Match not found' });
    }

    const selectedMatch = match.rows[0];

    if (!selectedMatch.team1_id || !selectedMatch.team2_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Teams are not known yet for this match' });
    }

    const knockoutAccess = await getKnockoutPredictionAccess(client);
    if (isKnockoutMatchId(matchId) && !knockoutAccess.open) {
      await recordBlockedPredictionAttempt(client, req, {
        userId: user_id,
        matchId,
        team1Goals: team1_goals,
        team2Goals: team2_goals,
        reason: 'knockout_not_open'
      });
      await client.query('COMMIT');
      return res.status(409).json({ error: 'Phase finale pas encore ouverte aux pronostics', locked: true, reason: 'knockout_not_open' });
    }

    if (selectedMatch.prediction_locked) {
      await recordBlockedPredictionAttempt(client, req, {
        userId: user_id,
        matchId,
        team1Goals: team1_goals,
        team2Goals: team2_goals,
        reason: 'match_started'
      });
      await client.query('COMMIT');
      return res.status(409).json({ error: 'Match already started', locked: true, start_time: selectedMatch.start_time_label });
    }

    const saveResult = await client.query(
      `INSERT INTO predictions (user_id, match_id, team1_goals, team2_goals, created_at, updated_at)
       SELECT $1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       WHERE EXISTS (
         SELECT 1
         FROM matches m
         WHERE m.id = $2
           AND m.team1_id IS NOT NULL
           AND m.team2_id IS NOT NULL
           AND (m.start_time AT TIME ZONE 'Europe/Brussels') > NOW()
           AND COALESCE(m.status, 'scheduled') <> 'finished'
           AND ($5::boolean = true OR m.id <= 72)
       )
       ON CONFLICT (user_id, match_id)
       DO UPDATE SET
         team1_goals = EXCLUDED.team1_goals,
         team2_goals = EXCLUDED.team2_goals,
         updated_at = CURRENT_TIMESTAMP
       WHERE EXISTS (
         SELECT 1
         FROM matches m
         WHERE m.id = $2
           AND m.team1_id IS NOT NULL
           AND m.team2_id IS NOT NULL
           AND (m.start_time AT TIME ZONE 'Europe/Brussels') > NOW()
           AND COALESCE(m.status, 'scheduled') <> 'finished'
           AND ($5::boolean = true OR m.id <= 72)
       )
       RETURNING *`,
      [user_id, matchId, Number(team1_goals), Number(team2_goals), knockoutAccess.open]
    );

    if (saveResult.rows.length === 0) {
      await recordBlockedPredictionAttempt(client, req, {
        userId: user_id,
        matchId,
        team1Goals: team1_goals,
        team2Goals: team2_goals,
        reason: isKnockoutMatchId(matchId) && !knockoutAccess.open ? 'knockout_not_open_during_save' : 'match_started_during_save'
      });
      await client.query('COMMIT');
      return res.status(409).json({ error: 'Match already started or not open for predictions', locked: true, start_time: selectedMatch.start_time_label });
    }

    await client.query('COMMIT');
    res.json(saveResult.rows[0]);
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
