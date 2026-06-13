const { ensureBonusPredictionTable } = require('../utils/bonusScoring');
const { ensureSpecialPredictionsTable } = require('../utils/specialPredictions');
const { ensureFifaRankingColumns } = require('../utils/fifaRankings');

async function ensureSchema(pool) {
  await pool.query(`
    ALTER TABLE results
      ADD COLUMN IF NOT EXISTS team1_penalty_goals integer,
      ADD COLUMN IF NOT EXISTS team2_penalty_goals integer,
      ADD COLUMN IF NOT EXISTS winner_team_id integer
  `);

  await ensureBonusPredictionTable(pool);
  await ensureSpecialPredictionsTable(pool);
  await ensureFifaRankingColumns(pool);
}

module.exports = { ensureSchema };
