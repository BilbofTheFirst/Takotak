const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');
const {
  GROUP_CODES,
  ensureBonusPredictionTable,
  getBonusDeadline,
  getBonusLockStatusForUser,
  normalizeBonusPrediction,
  buildActualBonusAnswers,
  calculateBonusPoints
} = require('../utils/bonusScoring');

const router = express.Router();

const normalizeTeam = (value) => String(value || '').trim();

const buildAvatarUrl = (user) => {
  if (!user?.avatar_data) return null;
  const rawVersion = user.avatar_updated_at ? new Date(user.avatar_updated_at).getTime() : Date.now();
  const version = Number.isNaN(rawVersion) ? Date.now() : rawVersion;
  return `/profile/users/${user.user_id || user.id}/avatar?v=${version}`;
};

const normalizePayload = (payload = {}) => {
  const groupWinners = {};
  GROUP_CODES.forEach(group => {
    groupWinners[group] = normalizeTeam(payload.group_winners?.[group]);
  });

  const semifinalists = Array.isArray(payload.semifinalists)
    ? payload.semifinalists.map(normalizeTeam).filter(Boolean).slice(0, 4)
    : [];

  return {
    group_winners: groupWinners,
    champion: normalizeTeam(payload.champion),
    runner_up: normalizeTeam(payload.runner_up),
    semifinalists
  };
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    await ensureBonusPredictionTable(pool);

    const userId = req.user.id;
    const [predictionResult, lockStatus, actual] = await Promise.all([
      pool.query('SELECT * FROM bonus_predictions WHERE user_id = $1', [userId]),
      getBonusLockStatusForUser(pool, userId),
      buildActualBonusAnswers(pool)
    ]);

    const prediction = normalizeBonusPrediction(predictionResult.rows[0]);
    const scoring = calculateBonusPoints(predictionResult.rows[0], actual);

    res.json({
      prediction,
      locked: lockStatus.locked,
      global_locked: lockStatus.global_locked,
      admin_unlocked: lockStatus.admin_unlocked,
      deadline: lockStatus.first_match_time,
      actual,
      scoring
    });
  } catch (error) {
    console.error('Get bonus predictions error:', error);
    res.status(500).json({ error: 'Server error', detail: error.message, code: error.code });
  }
});

router.get('/public', authenticateToken, async (req, res) => {
  try {
    await ensureBonusPredictionTable(pool);

    const [deadline, actual] = await Promise.all([
      getBonusDeadline(pool),
      buildActualBonusAnswers(pool)
    ]);

    if (!deadline.locked) {
      return res.json({
        locked: false,
        deadline: deadline.first_match_time,
        actual: null,
        predictions: []
      });
    }

    const result = await pool.query(`
      SELECT
        u.id AS user_id,
        u.username,
        u.avatar_data,
        u.avatar_updated_at,
        bp.group_winners,
        bp.champion,
        bp.runner_up,
        bp.semifinalists,
        bp.updated_at
      FROM users u
      LEFT JOIN bonus_predictions bp ON bp.user_id = u.id
      ORDER BY LOWER(u.username), LOWER(u.email)
    `);

    const predictions = result.rows.map(row => ({
      user_id: Number(row.user_id),
      username: row.username,
      avatar_url: buildAvatarUrl(row),
      prediction: normalizeBonusPrediction(row),
      scoring: calculateBonusPoints(row, actual)
    }));

    return res.json({
      locked: true,
      deadline: deadline.first_match_time,
      actual,
      predictions
    });
  } catch (error) {
    console.error('Get public bonus predictions error:', error);
    return res.status(500).json({ error: 'Server error', detail: error.message, code: error.code });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await ensureBonusPredictionTable(client);

    const userId = req.user.id;
    const lockStatus = await getBonusLockStatusForUser(client, userId);
    if (lockStatus.locked) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Bonus predictions are locked' });
    }

    const prediction = normalizePayload(req.body);

    const result = await client.query(
      `INSERT INTO bonus_predictions (user_id, group_winners, champion, runner_up, semifinalists, updated_at)
       VALUES ($1, $2::jsonb, $3, $4, $5::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id)
       DO UPDATE SET
         group_winners = EXCLUDED.group_winners,
         champion = EXCLUDED.champion,
         runner_up = EXCLUDED.runner_up,
         semifinalists = EXCLUDED.semifinalists,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        userId,
        JSON.stringify(prediction.group_winners),
        prediction.champion || null,
        prediction.runner_up || null,
        JSON.stringify(prediction.semifinalists)
      ]
    );

    await client.query('COMMIT');
    res.json(normalizeBonusPrediction(result.rows[0]));
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Save bonus predictions error:', error);
    res.status(500).json({ error: 'Server error', detail: error.message, code: error.code });
  } finally {
    client.release();
  }
});

module.exports = router;
