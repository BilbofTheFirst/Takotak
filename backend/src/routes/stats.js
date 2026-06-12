const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');
const { getStatsOverview } = require('../utils/statsOverview');

const router = express.Router();

router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const overview = await getStatsOverview(pool, req.user.id);
    res.json(overview);
  } catch (error) {
    console.error('Get stats overview error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
