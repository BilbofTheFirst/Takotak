const express = require('express');
const pool = require('../db/pool');
const { authenticateAdmin } = require('../middleware/auth');
const { hashPassword } = require('../utils/password');
const {
  GROUP_CODES,
  ensureBonusPredictionTable,
  getBonusDeadline,
  getBonusUnlocks,
  setBonusUnlockForUser
} = require('../utils/bonusScoring');
const {
  ensureSpecialPredictionsTable,
  getSpecialMatchdayDefinitions,
  getSpecialMatchdayStatus
} = require('../utils/specialPredictions');

const router = express.Router();
const TEMPORARY_PASSWORD = process.env.ADMIN_RESET_PASSWORD;
const FIRST_MATCHDAY = 1;
const SECOND_MATCHDAY = 2;
const THIRD_MATCHDAY = 3;
const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== '';
const normalizeSpecialMatchday = (value) => {
  const matchday = Number(value || FIRST_MATCHDAY);
  if (matchday === SECOND_MATCHDAY) return SECOND_MATCHDAY;
  if (matchday === THIRD_MATCHDAY) return THIRD_MATCHDAY;
  return FIRST_MATCHDAY;
};

const parseJsonValue = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch (_) { return fallback; }
  }
  return value;
};

const isDeadlineWithinReminderWindow = (deadline, locked = false) => {
  if (!deadline || locked) return false;
  const deadlineTime = new Date(`${deadline}+02:00`).getTime();
  if (Number.isNaN(deadlineTime)) return false;
  const gap = deadlineTime - Date.now();
  return gap > 0 && gap <= REMINDER_WINDOW_MS;
};

const ensureSpecialUnlockTable = async (clientOrPool = pool) => {
  await clientOrPool.query(`
    CREATE TABLE IF NOT EXISTS special_prediction_unlocks (
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      matchday integer NOT NULL,
      unlocked_by integer REFERENCES users(id) ON DELETE SET NULL,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, matchday)
    )
  `);

  await clientOrPool.query('CREATE INDEX IF NOT EXISTS idx_special_prediction_unlocks_matchday ON special_prediction_unlocks(matchday)');
};

const getSpecialUnlocks = async (clientOrPool = pool, matchday = SECOND_MATCHDAY) => {
  await ensureSpecialUnlockTable(clientOrPool);
  const normalizedMatchday = normalizeSpecialMatchday(matchday);
  const result = await clientOrPool.query('SELECT user_id FROM special_prediction_unlocks WHERE matchday = $1', [normalizedMatchday]);
  return new Set(result.rows.map(row => Number(row.user_id)));
};

const setSpecialUnlockForUser = async (clientOrPool = pool, userId, matchday = SECOND_MATCHDAY, unlocked = false, adminId = null) => {
  await ensureSpecialUnlockTable(clientOrPool);
  const normalizedMatchday = normalizeSpecialMatchday(matchday);

  if (!unlocked) {
    await clientOrPool.query('DELETE FROM special_prediction_unlocks WHERE user_id = $1 AND matchday = $2', [userId, normalizedMatchday]);
    return { user_id: userId, matchday: normalizedMatchday, admin_unlocked: false };
  }

  const result = await clientOrPool.query(
    `INSERT INTO special_prediction_unlocks (user_id, matchday, unlocked_by, updated_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, matchday)
     DO UPDATE SET unlocked_by = EXCLUDED.unlocked_by, updated_at = CURRENT_TIMESTAMP
     RETURNING user_id, matchday, unlocked_by, updated_at`,
    [userId, normalizedMatchday, adminId]
  );

  return { ...result.rows[0], admin_unlocked: true };
};

const buildPublicUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  is_admin: Boolean(user.is_admin),
  created_at: user.created_at
});

const buildBonusProgress = (row, globalLocked = false, adminUnlocked = false) => {
  const groupWinners = parseJsonValue(row?.group_winners, {});
  const semifinalists = Array.isArray(parseJsonValue(row?.semifinalists, []))
    ? parseJsonValue(row?.semifinalists, [])
    : [];

  const missing = [];
  let completed = 0;

  GROUP_CODES.forEach(group => {
    if (hasValue(groupWinners[group])) completed += 1;
    else missing.push(`Vainqueur groupe ${group}`);
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
  const locked = Boolean(globalLocked && !adminUnlocked);

  return {
    completed,
    total,
    missing,
    missing_count: missing.length,
    complete: missing.length === 0,
    global_locked: Boolean(globalLocked),
    admin_unlocked: Boolean(adminUnlocked),
    locked,
    urgent: !locked && missing.length > 0,
    updated_at: row?.updated_at || null
  };
};

const buildSpecialProgress = (definitions, rows = [], globalLocked = false, canRemind = true, adminUnlocked = false) => {
  const valueByCode = new Map(rows.map(row => [row.code, row.predicted_value]));
  const missing = [];
  let completed = 0;

  definitions.forEach(definition => {
    if (hasValue(valueByCode.get(definition.code))) completed += 1;
    else missing.push(definition.label);
  });

  const locked = Boolean(globalLocked && !adminUnlocked);

  return {
    completed,
    total: definitions.length,
    missing,
    missing_count: missing.length,
    complete: missing.length === 0,
    global_locked: Boolean(globalLocked),
    admin_unlocked: Boolean(adminUnlocked),
    locked,
    urgent: Boolean(canRemind && !locked && missing.length > 0)
  };
};

router.get('/monitoring', authenticateAdmin, async (req, res) => {
  try {
    await Promise.all([
      ensureBonusPredictionTable(pool),
      ensureSpecialPredictionsTable(pool),
      ensureSpecialUnlockTable(pool)
    ]);

    const firstDefinitions = getSpecialMatchdayDefinitions(FIRST_MATCHDAY);
    const secondDefinitions = getSpecialMatchdayDefinitions(SECOND_MATCHDAY);
    const thirdDefinitions = getSpecialMatchdayDefinitions(THIRD_MATCHDAY);
    const allSpecialCodes = [...firstDefinitions, ...secondDefinitions, ...thirdDefinitions].map(definition => definition.code);

    const [
      usersResult,
      nextMatchesResult,
      bonusResult,
      specialResult,
      bonusDeadline,
      bonusUnlocks,
      firstMatchdayStatus,
      secondMatchdayStatus,
      thirdMatchdayStatus,
      special2Unlocks,
      special3Unlocks
    ] = await Promise.all([
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
          AND (m.start_time AT TIME ZONE 'Europe/Brussels') > NOW()
          AND (m.start_time AT TIME ZONE 'Europe/Brussels') <= NOW() + INTERVAL '24 hours'
        ORDER BY m.start_time ASC, m.id ASC
      `),
      pool.query('SELECT * FROM bonus_predictions'),
      pool.query('SELECT * FROM special_predictions WHERE code = ANY($1::varchar[])', [allSpecialCodes]),
      getBonusDeadline(pool),
      getBonusUnlocks(pool),
      getSpecialMatchdayStatus(pool, FIRST_MATCHDAY),
      getSpecialMatchdayStatus(pool, SECOND_MATCHDAY),
      getSpecialMatchdayStatus(pool, THIRD_MATCHDAY),
      getSpecialUnlocks(pool, SECOND_MATCHDAY),
      getSpecialUnlocks(pool, THIRD_MATCHDAY)
    ]);

    const users = usersResult.rows.map(buildPublicUser);
    const nextMatches = nextMatchesResult.rows.map(match => ({
      id: Number(match.id),
      start_time: match.start_time,
      team1: match.team1,
      team2: match.team2,
      groupe: match.groupe1,
      prediction_count: Number(match.prediction_count || 0),
      missing_count: Math.max(users.length - Number(match.prediction_count || 0), 0)
    }));

    const nextMatchIds = nextMatches.map(match => match.id);
    const nextPredictionsResult = nextMatchIds.length > 0
      ? await pool.query('SELECT user_id, match_id FROM predictions WHERE match_id = ANY($1::int[])', [nextMatchIds])
      : { rows: [] };

    const bonusLocked = Boolean(bonusDeadline.locked);
    const specialLocked = Boolean(firstMatchdayStatus.locked);
    const special2Locked = Boolean(secondMatchdayStatus.locked);
    const special3Locked = Boolean(thirdMatchdayStatus.locked);
    const special2ReminderActive = isDeadlineWithinReminderWindow(secondMatchdayStatus.deadline, special2Locked);
    const special3ReminderActive = isDeadlineWithinReminderWindow(thirdMatchdayStatus.deadline, special3Locked);
    const firstCodeSet = new Set(firstDefinitions.map(definition => definition.code));
    const secondCodeSet = new Set(secondDefinitions.map(definition => definition.code));
    const thirdCodeSet = new Set(thirdDefinitions.map(definition => definition.code));
    const bonusByUser = new Map(bonusResult.rows.map(row => [Number(row.user_id), row]));
    const specialRowsByUser = new Map();
    const special2RowsByUser = new Map();
    const special3RowsByUser = new Map();

    specialResult.rows.forEach(row => {
      const userId = Number(row.user_id);
      const targetMap = thirdCodeSet.has(row.code)
        ? special3RowsByUser
        : secondCodeSet.has(row.code)
          ? special2RowsByUser
          : firstCodeSet.has(row.code)
            ? specialRowsByUser
            : null;
      if (!targetMap) return;
      if (!targetMap.has(userId)) targetMap.set(userId, []);
      targetMap.get(userId).push(row);
    });

    const nextPredictionsByUser = new Map();
    nextPredictionsResult.rows.forEach(row => {
      const userId = Number(row.user_id);
      if (!nextPredictionsByUser.has(userId)) nextPredictionsByUser.set(userId, new Set());
      nextPredictionsByUser.get(userId).add(Number(row.match_id));
    });

    const userMonitoring = users.map(user => {
      const predictedNext = nextPredictionsByUser.get(user.id) || new Set();
      const missingMatches = nextMatches
        .filter(match => !predictedNext.has(match.id))
        .map(match => ({
          id: match.id,
          start_time: match.start_time,
          label: `${match.team1} - ${match.team2}`,
          group: match.groupe
        }));

      const bonus = buildBonusProgress(bonusByUser.get(user.id), bonusLocked, bonusUnlocks.has(Number(user.id)));
      const special = buildSpecialProgress(firstDefinitions, specialRowsByUser.get(user.id), specialLocked);
      const special2 = buildSpecialProgress(secondDefinitions, special2RowsByUser.get(user.id), special2Locked, special2ReminderActive, special2Unlocks.has(Number(user.id)));
      const special3 = buildSpecialProgress(thirdDefinitions, special3RowsByUser.get(user.id), special3Locked, special3ReminderActive, special3Unlocks.has(Number(user.id)));
      const urgent_missing_count = missingMatches.length
        + (bonus.urgent ? bonus.missing.length : 0)
        + (special.urgent ? special.missing.length : 0)
        + (special2.urgent ? special2.missing.length : 0)
        + (special3.urgent ? special3.missing.length : 0);

      return {
        ...user,
        today: {
          completed: nextMatches.length - missingMatches.length,
          total: nextMatches.length,
          complete: missingMatches.length === 0,
          missing_matches: missingMatches
        },
        bonus,
        special,
        special2,
        special3,
        urgent_missing_count,
        should_remind: urgent_missing_count > 0
      };
    });

    const bonusIncompleteUsers = userMonitoring.filter(user => !user.bonus.complete);
    const specialIncompleteUsers = userMonitoring.filter(user => !user.special.complete);
    const special2IncompleteUsers = userMonitoring.filter(user => !user.special2.complete);
    const special2CompleteUsers = userMonitoring.filter(user => user.special2.complete);
    const special3IncompleteUsers = userMonitoring.filter(user => !user.special3.complete);
    const special3CompleteUsers = userMonitoring.filter(user => user.special3.complete);

    const summary = {
      users_count: users.length,
      today_matches_count: nextMatches.length,
      today_predictions_required: users.length * nextMatches.length,
      today_predictions_done: userMonitoring.reduce((sum, user) => sum + user.today.completed, 0),
      users_complete_today: userMonitoring.filter(user => user.today.complete).length,
      users_missing_today: userMonitoring.filter(user => !user.today.complete).length,
      users_complete_bonus: userMonitoring.filter(user => user.bonus.complete).length,
      users_missing_bonus: bonusIncompleteUsers.length,
      users_missing_bonus_urgent: bonusIncompleteUsers.filter(user => user.bonus.urgent).length,
      users_bonus_unlocked: userMonitoring.filter(user => user.bonus.admin_unlocked).length,
      users_complete_special: userMonitoring.filter(user => user.special.complete).length,
      users_missing_special: specialIncompleteUsers.length,
      users_missing_special_urgent: specialIncompleteUsers.filter(user => user.special.urgent).length,
      users_complete_special2: special2CompleteUsers.length,
      users_missing_special2: special2IncompleteUsers.length,
      users_missing_special2_urgent: special2IncompleteUsers.filter(user => user.special2.urgent).length,
      users_special2_unlocked: userMonitoring.filter(user => user.special2.admin_unlocked).length,
      users_complete_special3: special3CompleteUsers.length,
      users_missing_special3: special3IncompleteUsers.length,
      users_missing_special3_urgent: special3IncompleteUsers.filter(user => user.special3.urgent).length,
      users_special3_unlocked: userMonitoring.filter(user => user.special3.admin_unlocked).length,
      special2_reminder_active: special2ReminderActive,
      special3_reminder_active: special3ReminderActive,
      bonus_deadline: bonusDeadline.first_match_time,
      bonus_locked: bonusLocked,
      first_matchday_deadline: firstMatchdayStatus.deadline,
      first_matchday_locked: specialLocked,
      second_matchday_deadline: secondMatchdayStatus.deadline,
      second_matchday_locked: special2Locked,
      third_matchday_deadline: thirdMatchdayStatus.deadline,
      third_matchday_locked: special3Locked,
      window_hours: 24,
      generated_at: new Date().toISOString()
    };

    res.json({
      summary,
      today_matches: nextMatches,
      users: userMonitoring,
      bonus_incomplete_users: bonusIncompleteUsers,
      bonus_unlocked_users: userMonitoring.filter(user => user.bonus.admin_unlocked),
      special_incomplete_users: specialIncompleteUsers,
      special2_unlocked_users: userMonitoring.filter(user => user.special2.admin_unlocked),
      special2_complete_users: special2CompleteUsers,
      special2_incomplete_users: special2IncompleteUsers,
      special3_unlocked_users: userMonitoring.filter(user => user.special3.admin_unlocked),
      special3_complete_users: special3CompleteUsers,
      special3_incomplete_users: special3IncompleteUsers
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

router.patch('/users/:userId/bonus-unlock', authenticateAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ error: 'Invalid user id' });

    const existingUser = await pool.query('SELECT id, username, email, is_admin, created_at FROM users WHERE id = $1', [userId]);
    if (existingUser.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const unlocked = Boolean(req.body?.unlocked);
    const bonusUnlock = await setBonusUnlockForUser(pool, userId, unlocked, req.user?.id || null);

    res.json({
      user: buildPublicUser(existingUser.rows[0]),
      bonus_unlock: bonusUnlock,
      message: unlocked ? 'Pronostics bonus long terme réouverts pour ce joueur.' : 'Pronostics bonus long terme refermés pour ce joueur.'
    });
  } catch (error) {
    console.error('Admin bonus unlock error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/users/:userId/special-unlock', authenticateAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ error: 'Invalid user id' });

    const matchday = normalizeSpecialMatchday(req.body?.matchday || SECOND_MATCHDAY);
    const existingUser = await pool.query('SELECT id, username, email, is_admin, created_at FROM users WHERE id = $1', [userId]);
    if (existingUser.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const unlocked = Boolean(req.body?.unlocked);
    const specialUnlock = await setSpecialUnlockForUser(pool, userId, matchday, unlocked, req.user?.id || null);

    res.json({
      user: buildPublicUser(existingUser.rows[0]),
      special_unlock: specialUnlock,
      message: unlocked ? `Pronostics spéciaux J${matchday} réouverts pour ce joueur.` : `Pronostics spéciaux J${matchday} refermés pour ce joueur.`
    });
  } catch (error) {
    console.error('Admin special unlock error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/users/:userId/reset-password', authenticateAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ error: 'Invalid user id' });
    if (!TEMPORARY_PASSWORD) return res.status(500).json({ error: 'Temporary reset password is not configured' });

    const existingUser = await pool.query('SELECT id, username, email, is_admin, created_at FROM users WHERE id = $1', [userId]);
    if (existingUser.rows.length === 0) return res.status(404).json({ error: 'User not found' });

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
      message: 'Mot de passe réinitialisé.'
    });
  } catch (error) {
    console.error('Admin reset user password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
