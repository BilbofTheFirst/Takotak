const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');
const { getKnockoutPredictionAccess } = require('../utils/knockoutPredictions');
const { KNOCKOUT_SLOTS, getThirdPlaceSnapshot, propagateKnockoutTeams } = require('../utils/knockoutPropagation');
const { alignKnockoutScheduleRows } = require('../utils/knockoutScheduleAlignment');

const router = express.Router();

// Match dates in the database are stored as the Belgian schedule wall time.
// Convert them explicitly as Europe/Brussels for lock/can_predict checks,
// and return a formatted local schedule string to the frontend.
const MATCH_TIME_SELECT = `to_char(m.start_time, 'YYYY-MM-DD"T"HH24:MI:SS') as start_time`;
const MATCH_HAS_STARTED_SQL = `(m.start_time AT TIME ZONE 'Europe/Brussels') <= NOW()`;
const MATCH_CAN_PREDICT_SQL = `
  m.team1_id IS NOT NULL
  AND m.team2_id IS NOT NULL
  AND (m.start_time AT TIME ZONE 'Europe/Brussels') > NOW()
  AND COALESCE(m.status, 'scheduled') <> 'finished'
`;

const isThirdPlaceToken = (token) => /^3[A-L]\//.test(String(token || ''));

const refreshKnockoutBracket = async () => {
  try {
    await propagateKnockoutTeams(pool);
    await alignKnockoutScheduleRows(pool);
  } catch (error) {
    console.warn('Knockout bracket refresh skipped:', error.message || error);
  }
};

const maskUnresolvedThirdPlaceSlots = (rows, thirdPlaceSnapshot) => {
  if (thirdPlaceSnapshot?.third_place_slots_ready) return rows;

  return rows.map(row => {
    const slots = KNOCKOUT_SLOTS[Number(row.id)];
    if (!slots || (!isThirdPlaceToken(slots.team1) && !isThirdPlaceToken(slots.team2))) return row;

    const masked = { ...row, third_place_slots_pending: true };

    if (isThirdPlaceToken(slots.team1)) {
      masked.team1_id = null;
      masked.team1 = null;
      masked.groupe1 = null;
      masked.can_predict = false;
    }

    if (isThirdPlaceToken(slots.team2)) {
      masked.team2_id = null;
      masked.team2 = null;
      masked.groupe2 = null;
      masked.can_predict = false;
    }

    return masked;
  });
};

// Get all matches with team details
router.get('/', authenticateToken, async (req, res) => {
  try {
    await refreshKnockoutBracket();

    const [knockoutAccess, thirdPlaceSnapshot] = await Promise.all([
      getKnockoutPredictionAccess(pool),
      getThirdPlaceSnapshot(pool).catch(error => {
        console.warn('Third-place snapshot unavailable while loading matches:', error.message || error);
        return null;
      })
    ]);
    const result = await pool.query(`
      SELECT
        m.id,
        m.team1_id,
        m.team2_id,
        t1.name as team1,
        t1.groupe as groupe1,
        t2.name as team2,
        t2.groupe as groupe2,
        ${MATCH_TIME_SELECT},
        m.description,
        m.status,
        m.created_at,
        r.team1_goals,
        r.team2_goals,
        r.team1_penalty_goals,
        r.team2_penalty_goals,
        r.winner_team_id,
        CASE
          WHEN ${MATCH_CAN_PREDICT_SQL}
            AND ($1::boolean = true OR m.id <= 72)
          THEN true
          ELSE false
        END AS can_predict,
        CASE
          WHEN m.id > 72 AND $1::boolean = false
          THEN true
          ELSE false
        END AS knockout_prediction_blocked,
        $1::boolean AS knockout_predictions_open,
        CASE
          WHEN ${MATCH_HAS_STARTED_SQL}
            OR COALESCE(m.status, 'scheduled') = 'finished'
          THEN true
          ELSE false
        END AS is_locked
      FROM matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.id
      LEFT JOIN teams t2 ON m.team2_id = t2.id
      LEFT JOIN results r ON m.id = r.match_id
      ORDER BY m.start_time
    `, [knockoutAccess.open]);
    res.json(maskUnresolvedThirdPlaceSlots(result.rows, thirdPlaceSnapshot));
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single match with predictions
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const matchId = req.params.id;
    await refreshKnockoutBracket();

    const [knockoutAccess, thirdPlaceSnapshot] = await Promise.all([
      getKnockoutPredictionAccess(pool),
      getThirdPlaceSnapshot(pool).catch(error => {
        console.warn('Third-place snapshot unavailable while loading match:', error.message || error);
        return null;
      })
    ]);
    const match = await pool.query(`
      SELECT
        m.id,
        m.team1_id,
        m.team2_id,
        t1.name as team1,
        t1.groupe as groupe1,
        t2.name as team2,
        t2.groupe as groupe2,
        ${MATCH_TIME_SELECT},
        m.description,
        m.status,
        m.created_at,
        r.team1_goals,
        r.team2_goals,
        r.team1_penalty_goals,
        r.team2_penalty_goals,
        r.winner_team_id,
        CASE
          WHEN ${MATCH_CAN_PREDICT_SQL}
            AND ($2::boolean = true OR m.id <= 72)
          THEN true
          ELSE false
        END AS can_predict,
        CASE
          WHEN m.id > 72 AND $2::boolean = false
          THEN true
          ELSE false
        END AS knockout_prediction_blocked,
        $2::boolean AS knockout_predictions_open,
        CASE
          WHEN ${MATCH_HAS_STARTED_SQL}
            OR COALESCE(m.status, 'scheduled') = 'finished'
          THEN true
          ELSE false
        END AS is_locked
      FROM matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.id
      LEFT JOIN teams t2 ON m.team2_id = t2.id
      LEFT JOIN results r ON m.id = r.match_id
      WHERE m.id = $1
    `, [matchId, knockoutAccess.open]);

    if (match.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const predictions = await pool.query(
      'SELECT * FROM predictions WHERE match_id = $1',
      [matchId]
    );

    const result = await pool.query(
      'SELECT * FROM results WHERE match_id = $1',
      [matchId]
    );

    res.json({
      match: maskUnresolvedThirdPlaceSlots([match.rows[0]], thirdPlaceSnapshot)[0],
      predictions: predictions.rows,
      result: result.rows[0] || null
    });
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
