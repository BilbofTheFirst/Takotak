const express = require('express');
const pool = require('../db/pool');
const { authenticateAdmin } = require('../middleware/auth');
const { hashPassword } = require('../utils/password');
const { GROUP_CODES, ensureBonusPredictionTable } = require('../utils/bonusScoring');
const {
  SPECIAL_PREDICTION_DEFINITIONS,
  ensureSpecialPredictionsTable,
  getFirstMatchdayStatus
} = require('../utils/specialPredictions');

const router = express.Router();
const TEMPORARY_PASSWORD = 'takotak';

const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== '';

const parseJsonValue = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch (_) { return fallback; }
  }
  return value;
};

const buildPublicUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  is_admin: Boolean(user.is_admin),
  created_at: user.created_at
});

const buildBonusProgress = (row) => {
  const groupWinners = parseJsonValue(row?.group_winners, {});
  const semifinalists = Array.isArray(parseJsonValue(row?.semifinalists, []))
    ? parseJsonValue(row?.semifinalists, [])
    : [];

  const missing = [];
  let completed = 0;

  GROUP_CODES.forEach(group => {
    if (hasValue(groupWinners[group])) {
      completed += 1;
    } else {
      missing.push(`Vainqueur groupe ${group}`);
    }
  });

  if (hasValue(row?.champion)) completed += 1;
  else missing.push('Champion');

  if (hasValue(row?.runner_up)) completed += 1;
  else missing.push('Finaliste perdant');

  const semifinalistsCompleted = semifinalists.filter(hasValue).slice(0, 4).length;
  completed += semifinalistsCompleted;
  for (let i = semifinalistsCompleted; i < 4; i += 1) {
    missing.push(`Demi-finaliste ${i + 1}`);
  }

  const total = GROUP_CODES.length + 6;
  return {
    completed,
    total,
    missing,
    complete: missing.length === 0,
    updated_at: row?.updated_at || null
  };
};

const buildSpecialProgress = (rows = []) => {
  const valueByCode = new Map(rows.map(row => [row.code, row.predicted_value]));
  const missing = [];
  let completed = 0;

  SPECIAL_PREDICTION_DEFINITIONS.forEach(definition => {
    if (hasValue(valueByCode.get(definition.code))) {
      completed += 1;
    } else {
      missing.push(definition.label);
    }
  });

  return {
    completed,
    total: SPECIAL_PREDICTION_DEFINITIONS.length,
    missing,
    complete: missing.length === 0
  };
};

router.get('/monitoring', authenticateAdmin, async (req, res) => {
  try {
    await Promise.all([
      ensureBonusPredictionTable(pool),
      ensureSpecialPredictionsTable(pool)
    ]);

    const [usersResult, todayResult, bonusResult, specialResult, firstMatchdayStatus] = await Promise.all([
      pool.query(`
        SELECT id, username, email, is_admin, created_at
        FROM users
        ORDER BY LOWER(username), LOWER(email)
      `),
      pool.query(`
        SELECT
          m.id,
          to_char(m.start_time, 'YYYY-MM-DD"T"HH24:MI:SS') AS start_time,
          t1.name AS team1,
          t2.name AS team2,
          t1.groupe AS groupe1,
          COALESCE(prediction_counts.prediction_count, 0)::int AS prediction_count
        FROM matches m
        JOIN teams t1 ON m.team1_id = t1.id
        JOIN teams t2 ON m.team2_id = t2.id
        LEFT JOIN (
          SELECT match_id, COUNT(*) AS prediction_count
          FROM predictions
          GROUP BY match_id
        ) prediction_counts ON prediction_counts.match_id = m.id
        WHERE m.team1_id IS NOT NULL
          AND m.team2_id IS NOT NULL
          AND (m.start_time AT TIME ZONE 'Europe/Brussels')::date = (NOW() AT TIME ZONE 'Europe/Brussels')::date
        ORDER BY m.start_time ASC, m.id ASC
      `),
      pool.query('SELECT * FROM bonus_predictions'),
      pool.query('SELECT * FROM special_predictions WHERE code = ANY($1::varchar[])', [SPECIAL_PREDICTION_DEFINITIONS.map(definition => definition.code)]),
      getFirstMatchdayStatus(pool)
    ]);

    const users = usersResult.rows.map(buildPublicUser);
    const todayMatches = todayResult.rows.map(match => ({
      id: Number(match.id),
      start_time: match.start_time,
      team1: match.team1,
      team2: match.team2,
      groupe: match.groupe1,
      prediction_count: Number(match.prediction_count || 0),
      missing_count: Math.max(users.length - Number(match.prediction_count || 0), 0)
    }));

    const todayMatchIds = todayMatches.map(match => match.id);
    const todayPredictionsResult = todayMatchIds.length > 0
      ? await pool.query(
        'SELECT user_id, match_id FROM predictions WHERE match_id = ANY($1::int[])',
        [todayMatchIds]
      )
      : { rows: [] };

    const bonusByUser = new Map(bonusResult.rows.map(row => [Number(row.user_id), row]));
    const specialRowsByUser = new Map();
    specialResult.rows.forEach(row => {
      const userId = Number(row.user_id);
      if (!specialRowsByUser.has(userId)) specialRowsByUser.set(userId, []);
      specialRowsByUser.get(userId).push(row);
    });

    const todayPredictionsByUser = new Map();
    todayPredictionsResult.rows.forEach(row => {
      const userId = Number(row.user_id);
      if (!todayPredictionsByUser.has(userId)) todayPredictionsByUser.set(userId, new Set());
      todayPredictionsByUser.get(userId).add(Number(row.match_id));
    });

    const userMonitoring = users.map(user => {
      const predictedToday = todayPredictionsByUser.get(user.id) || new Set();
      const missingMatches = todayMatches
        .filter(match => !predictedToday.has(match.id))
        .map(match => ({
          id: match.id,
          start_time: match.start_time,
          label: `${match.team1} - ${match.team2}`,
          group: match.groupe
        }));

      const bonus = buildBonusProgress(bonusByUser.get(user.id));
      const special = buildSpecialProgress(specialRowsByUser.get(user.id));
      const urgent_missing_count = missingMatches.length + bonus.missing.length + special.missing.length;

      return {
        ...user,
        today: {
          completed: todayMatches.length - missingMatches.length,
          total: todayMatches.length,
          complete: missingMatches.length === 0,
          missing_matches: missingMatches
        },
        bonus,
        special,
        urgent_missing_count,
        should_remind: urgent_missing_count > 0
      };
    });

    const summary = {
      users_count: users.length,
      today_matches_count: todayMatches.length,
      today_predictions_required: users.length * todayMatches.length,
      today_predictions_done: userMonitoring.reduce((sum, user) => sum + user.today.completed, 0),
      users_complete_today: userMonitoring.filter(user => user.today.complete).length,
      users_missing_today: userMonitoring.filter(user => !user.today.complete).length,
      users_complete_bonus: userMonitoring.filter(user => user.bonus.complete).length,
      users_missing_bonus: userMonitoring.filter(user => !user.bonus.complete).length,
      users_complete_special: userMonitoring.filter(user => user.special.complete).length,
      users_missing_special: userMonitoring.filter(user => !user.special.complete).length,
      first_matchday_deadline: firstMatchdayStatus.deadline,
      first_matchday_locked: Boolean(firstMatchdayStatus.locked),
      generated_at: new Date().toISOString()
    };

    res.json({
      summary,
      today_matches: todayMatches,
      users: userMonitoring
    });
  } catch (error) {
    console.error('Admin monitoring error:', error);
    res.status(500).json({ error: 'Server error', detail: error.message, code: error.code });
  }
});

router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, email, is_admin, created_at
      FROM users
      ORDER BY LOWER(username), LOWER(email)
    `);

    res.json(result.rows.map(buildPublicUser));
  } catch (error) {
    console.error('Admin users list error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/users/:userId/reset-password', authenticateAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const existingUser = await pool.query(
      'SELECT id, username, email, is_admin, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordHash = await hashPassword(TEMPORARY_PASSWORD);
    const result = await pool.query(
      `UPDATE users
       SET password_hash = $1
       WHERE id = $2
       RETURNING id, username, email, is_admin, created_at`,
      [passwordHash, userId]
    );

    res.json({
      user: buildPublicUser(result.rows[0]),
      temporary_password: TEMPORARY_PASSWORD,
      message: `Mot de passe réinitialisé à "${TEMPORARY_PASSWORD}".`
    });
  } catch (error) {
    console.error('Admin reset user password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
