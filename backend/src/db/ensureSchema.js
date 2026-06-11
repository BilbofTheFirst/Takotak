const { ensureSpecialPredictionsTable } = require('../utils/specialPredictions');

async function ensureSchema(pool) {
  await pool.query(`
    ALTER TABLE results
      ADD COLUMN IF NOT EXISTS team1_penalty_goals integer,
      ADD COLUMN IF NOT EXISTS team2_penalty_goals integer,
      ADD COLUMN IF NOT EXISTS winner_team_id integer
  `);

  await ensureSpecialPredictionsTable(pool);
}

module.exports = { ensureSchema };
