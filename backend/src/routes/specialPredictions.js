const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');
const {
  SPECIAL_PREDICTION_DEFINITIONS,
  ensureSpecialPredictionsTable,
  getFirstMatchdayStatus,
  buildSpecialPredictionScoring,
  recalculateFirstMatchdaySpecialPredictionPoints,
  normalizeSpecialPredictionValue
} = require('../utils/specialPredictions');

const router = express.Router();

const buildAvatarUrl = (user) => {
  if (!user?.avatar_data) return null;
  const rawVersion = user.avatar_updated_at ? new Date(user.avatar_updated_at).getTime() : Date.now();
  const version = Number.isNaN(rawVersion) ? Date.now() : rawVersion;
  return `/profile/users/${user.user_id || user.id}/avatar?v=${version}`;
};

const buildPayload = async (clientOrPool, userId) => {
  await ensureSpecialPredictionsTable(clientOrPool);
  const status = await getFirstMatchdayStatus(clientOrPool);
  const codes = SPECIAL_PREDICTION_DEFINITIONS.map(definition => definition.code);
  const result = await clientOrPool.query(
    'SELECT * FROM special_predictions WHERE user_id = $1 AND code = ANY($2::varchar[])',
    [userId, codes]
  );

  const predictionRows = result.rows;
  const predictionMap = new Map(predictionRows.map(row => [row.code, row]));
  const predictions = Object.fromEntries(
    SPECIAL_PREDICTION_DEFINITIONS.map(definition => [
      definition.code,
      predictionMap.get(definition.code)?.predicted_value ?? ''
    ])
  );

  return {
    definitions: SPECIAL_PREDICTION_DEFINITIONS,
    predictions,
    locked: status.locked,
    deadline: status.deadline,
    complete: status.complete,
    actual: status.actual,
    current_actual: status.current_actual,
    completed_matches: status.completed_matches,
    total_matches: status.total_matches,
    scoring: buildSpecialPredictionScoring(predictionRows, status.actual)
  };
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    res.json(await buildPayload(pool, req.user.id));
  } catch (error) {
    console.error('Get special predictions error:', error);
    res.status(500).json({ error: 'Server error', detail: error.message, code: error.code });
  }
});

router.get('/public', authenticateToken, async (req, res) => {
  try {
    await ensureSpecialPredictionsTable(pool);
    const status = await getFirstMatchdayStatus(pool);
    const codes = SPECIAL_PREDICTION_DEFINITIONS.map(definition => definition.code);

    if (!status.locked) {
      return res.json({
        locked: false,
        deadline: status.deadline,
        definitions: SPECIAL_PREDICTION_DEFINITIONS,
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
          SPECIAL_PREDICTION_DEFINITIONS.map(definition => [
            definition.code,
            rowByCode.get(definition.code)?.predicted_value ?? null
          ])
        ),
        scoring: buildSpecialPredictionScoring(user.rows, status.actual)
      };
    });

    return res.json({
      locked: true,
      deadline: status.deadline,
      definitions: SPECIAL_PREDICTION_DEFINITIONS,
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
    await ensureSpecialPredictionsTable(client);

    const status = await getFirstMatchdayStatus(client);
    if (status.locked) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Special predictions are locked' });
    }

    const userId = req.user.id;
    const incomingPredictions = req.body?.predictions || req.body || {};

    for (const definition of SPECIAL_PREDICTION_DEFINITIONS) {
      const normalizedValue = normalizeSpecialPredictionValue(incomingPredictions[definition.code]);

      if (normalizedValue === undefined) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Invalid value for ${definition.code}` });
      }

      if (normalizedValue === null) {
        await client.query(
          'DELETE FROM special_predictions WHERE user_id = $1 AND code = $2',
          [userId, definition.code]
        );
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

    await recalculateFirstMatchdaySpecialPredictionPoints(client);

    const payload = await buildPayload(client, userId);
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
