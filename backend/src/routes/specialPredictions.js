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
