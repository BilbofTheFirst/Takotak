const express = require('express');
const { authenticateAdmin } = require('../middleware/auth');
const {
  getKnockoutPredictionAccess,
  setKnockoutPredictionAccess
} = require('../utils/knockoutPredictions');

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

module.exports = router;
