const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');
const {
  SPECIAL_MATCHDAYS,
  ensureSpecialPredictionsTable,
  getSpecialMatchdayDefinitions,
  getSpecialMatchdayStatus,
  buildSpecialPredictionScoring,
  recalculateSpecialPredictionPointsForMatchday,
  normalizeSpecialPredictionValue
} = require('../utils/specialPredictions');

const router = express.Router();

const normalizeMatchday = (value) => {
  const matchday = Number(value || SPECIAL_MATCHDAYS.FIRST);
  if (matchday === SPECIAL_MATCHDAYS.SECOND) return SPECIAL_MATCHDAYS.SECOND;
  if (matchday === SPECIAL_MATCHDAYS.THIRD) return SPECIAL_MATCHDAYS.THIRD;
  if (matchday === SPECIAL_MATCHDAYS.ROUND_OF_32) return SPECIAL_MATCHDAYS.ROUND_OF_32;
  return SPECIAL_MATCHDAYS.FIRST;
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

const getSpecialUnlockForUser = async (clientOrPool, userId, matchday) => {
  await ensureSpecialUnlockTable(clientOrPool);
  const result = await clientOrPool.query(
    'SELECT user_id FROM special_prediction_unlocks WHERE user_id = $1 AND matchday = $2',
    [userId, normalizeMatchday(matchday)]
  );
  return result.rows.length > 0;
};

const buildAvatarUrl = (user) => {
  if (!user?.avatar_data) return null;
  const rawVersion = user.avatar_updated_at ? new Date(user.avatar_updated_at).getTime() : Date.now();
  const version = Number.isNaN(rawVersion) ? Date.now() : rawVersion;
  return `/profile/users/${user.user_id || user.id}/avatar?v=${version}`;
};

const buildPayload = async (clientOrPool, userId, matchday = 1) => {
  await Promise.all([
    ensureSpecialPredictionsTable(clientOrPool),
    ensureSpecialUnlockTable(clientOrPool)
  ]);

  const normalizedMatchday = normalizeMatchday(matchday);
  const status = await getSpecialMatchdayStatus(clientOrPool, normalizedMatchday);
  const definitions = getSpecialMatchdayDefinitions(normalizedMatchday);
  const codes = definitions.map(definition => definition.code);
  const adminUnlocked = status.locked ? await getSpecialUnlockForUser(clientOrPool, userId, normalizedMatchday) : false;
  const userLocked = Boolean(status.locked && !adminUnlocked);
  const result = await clientOrPool.query(
    'SELECT * FROM special_predictions WHERE user_id = $1 AND code = ANY($2::varchar[])',
    [userId, codes]
  );

  const predictionRows = result.rows;
  const predictionMap = new Map(predictionRows.map(row => [row.code, row]));
  const predictions = Object.fromEntries(
    definitions.map(definition => [
      definition.code,
      predictionMap.get(definition.code)?.predicted_value ?? ''
    ])
  );

  return {
    matchday: normalizedMatchday,
    definitions,
    predictions,
    locked: userLocked,
    global_locked: Boolean(status.locked),
    admin_unlocked: adminUnlocked,
    deadline: status.deadline,
    complete: status.complete,
    actual: status.actual,
    current_actual: status.current_actual,
    completed_matches: status.completed_matches,
    total_matches: status.total_matches,
    scoring: buildSpecialPredictionScoring(predictionRows, status.actual, definitions)
  };
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    res.json(await buildPayload(pool, req.user.id, req.query.matchday));
  } catch (error) {
    console.error('Get special predictions error:', error);
    res.status(500).json({ error: 'Server error', detail: error.message, code: error.code });
  }
});

router.get('/public', authenticateToken, async (req, res) => {
  try {
    await ensureSpecialPredictionsTable(pool);
    const matchday = normalizeMatchday(req.query.matchday);
    const status = await getSpecialMatchdayStatus(pool, matchday);
    const definitions = getSpecialMatchdayDefinitions(matchday);
    const codes = definitions.map(definition => definition.code);

    if (!status.locked) {
      return res.json({
        matchday,
        locked: false,
        global_locked: false,
        deadline: status.deadline,
        definitions,
        actual: null,
        current_actual: status.current_actual,
        completed_matches: status.completed_matches,
        total_matches: status.total_matches,
        predictions: []
      });
    }

    const result = await pool.query(
      `SELECT
        u.id AS user_id,
        u.username,
        u.avatar_data,
        u.avatar_updated_at,
        sp.code,
        sp.predicted_value,
        sp.points,
        sp.updated_at
       FROM users u
       LEFT JOIN special_predictions sp
         ON sp.user_id = u.id
        AND sp.code = ANY($1::varchar[])
       ORDER BY LOWER(u.username), LOWER(u.email), sp.code`,
      [codes]
    );

    const rowsByUser = new Map();
    result.rows.forEach(row => {
      const userId = Number(row.user_id);
      if (!rowsByUser.has(userId)) {
        rowsByUser.set(userId, {
          user_id: userId,
          username: row.username,
          avatar_url: buildAvatarUrl(row),
          rows: []
        });
      }

      if (row.code) rowsByUser.get(userId).rows.push(row);
    });

    const predictions = Array.from(rowsByUser.values()).map(user => {
      const rowByCode = new Map(user.rows.map(row => [row.code, row]));
      return {
        user_id: user.user_id,
        username: user.username,
        avatar_url: user.avatar_url,
        predictions: Object.fromEntries(
          definitions.map(definition => [
            definition.code,
            rowByCode.get(definition.code)?.predicted_value ?? null
          ])
        ),
        scoring: buildSpecialPredictionScoring(user.rows, status.actual, definitions)
      };
    });

    return res.json({
      matchday,
      locked: true,
      global_locked: true,
      deadline: status.deadline,
      definitions,
      actual: status.actual,
      current_actual: status.current_actual,
      completed_matches: status.completed_matches,
      total_matches: status.total_matches,
      complete: status.complete,
      predictions
    });
  } catch (error) {
    console.error('Get public special predictions error:', error);
    return res.status(500).json({ error: 'Server error', detail: error.message, code: error.code });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await Promise.all([
      ensureSpecialPredictionsTable(client),
      ensureSpecialUnlockTable(client)
    ]);

    const matchday = normalizeMatchday(req.query.matchday || req.body?.matchday);
    const definitions = getSpecialMatchdayDefinitions(matchday);
    const status = await getSpecialMatchdayStatus(client, matchday);
    const adminUnlocked = status.locked ? await getSpecialUnlockForUser(client, req.user.id, matchday) : false;
    if (status.locked && !adminUnlocked) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Special predictions are locked' });
    }

    const userId = req.user.id;
    const incomingPredictions = req.body?.predictions || req.body || {};

    for (const definition of definitions) {
      const normalizedValue = normalizeSpecialPredictionValue(incomingPredictions[definition.code]);

      if (normalizedValue === undefined) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Invalid value for ${definition.code}` });
      }

      if (normalizedValue === null) {
        await client.query('DELETE FROM special_predictions WHERE user_id = $1 AND code = $2', [userId, definition.code]);
        continue;
      }

      await client.query(
        `INSERT INTO special_predictions (user_id, code, predicted_value, points, updated_at)
         VALUES ($1, $2, $3, NULL, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, code)
         DO UPDATE SET
           predicted_value = EXCLUDED.predicted_value,
           points = NULL,
           updated_at = CURRENT_TIMESTAMP`,
        [userId, definition.code, normalizedValue]
      );
    }

    await recalculateSpecialPredictionPointsForMatchday(client, matchday);

    const payload = await buildPayload(client, userId, matchday);
    await client.query('COMMIT');
    res.json(payload);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Save special predictions error:', error);
    res.status(500).json({ error: 'Server error', detail: error.message, code: error.code });
  } finally {
    client.release();
  }
});

module.exports = router;
