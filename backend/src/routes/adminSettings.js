const express = require('express');
const pool = require('../db/pool');
const { authenticateAdmin } = require('../middleware/auth');
const {
  getKnockoutPredictionAccess,
  setKnockoutPredictionAccess
} = require('../utils/knockoutPredictions');
const {
  getThirdPlaceSnapshot,
  propagateKnockoutTeams,
  saveManualThirdPlaceSlotOverrides
} = require('../utils/knockoutPropagation');

const router = express.Router();

router.get('/knockout-predictions', authenticateAdmin, async (req, res) => {
  try {
    const access = await getKnockoutPredictionAccess();
    res.json({
      knockout_predictions_open: Boolean(access.open),
      updated_at: access.updated_at,
      updated_by: access.updated_by
    });
  } catch (error) {
    console.error('Get knockout prediction setting error:', error);
    res.status(500).json({ error: 'Server error', detail: error.message, code: error.code });
  }
});

router.patch('/knockout-predictions', authenticateAdmin, async (req, res) => {
  try {
    const open = Boolean(req.body?.open ?? req.body?.knockout_predictions_open);
    const access = await setKnockoutPredictionAccess(undefined, open, req.user?.id || null);
    res.json({
      knockout_predictions_open: Boolean(access.open),
      updated_at: access.updated_at,
      updated_by: access.updated_by,
      message: open
        ? 'La phase finale est ouverte aux pronostics.'
        : 'La phase finale est verrouillée pour les pronostics.'
    });
  } catch (error) {
    console.error('Update knockout prediction setting error:', error);
    res.status(500).json({ error: 'Server error', detail: error.message, code: error.code });
  }
});

router.patch('/third-place-slots', authenticateAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const slots = Array.isArray(req.body?.slots) ? req.body.slots : [];

    await client.query('BEGIN');
    await saveManualThirdPlaceSlotOverrides(client, slots);
    await propagateKnockoutTeams(client);
    await client.query('COMMIT');

    const snapshot = await getThirdPlaceSnapshot(client);
    res.json({
      ...snapshot,
      message: 'Affectation manuelle des troisièmes sauvegardée.'
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Update third-place slot settings error:', error);
    res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Server error', detail: error.message, code: error.code });
  } finally {
    client.release();
  }
});

module.exports = router;
