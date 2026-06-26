const pool = require('../db/pool');

const KNOCKOUT_ACCESS_KEY = 'knockout_predictions_open';

const ensureAppSettingsTable = async (clientOrPool = pool) => {
  await clientOrPool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key varchar(120) PRIMARY KEY,
      value text NOT NULL,
      updated_by integer REFERENCES users(id) ON DELETE SET NULL,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const getSetting = async (clientOrPool = pool, key, fallback = null) => {
  await ensureAppSettingsTable(clientOrPool);
  const result = await clientOrPool.query('SELECT value, updated_at, updated_by FROM app_settings WHERE key = $1', [key]);
  if (result.rows.length === 0) return { value: fallback, updated_at: null, updated_by: null };
  return result.rows[0];
};

const setSetting = async (clientOrPool = pool, key, value, adminId = null) => {
  await ensureAppSettingsTable(clientOrPool);
  const result = await clientOrPool.query(
    `INSERT INTO app_settings (key, value, updated_by, updated_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
     ON CONFLICT (key)
     DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = CURRENT_TIMESTAMP
     RETURNING key, value, updated_by, updated_at`,
    [key, String(value), adminId]
  );
  return result.rows[0];
};

const getKnockoutPredictionAccess = async (clientOrPool = pool) => {
  const row = await getSetting(clientOrPool, KNOCKOUT_ACCESS_KEY, 'false');
  return {
    open: row.value === 'true',
    updated_at: row.updated_at || null,
    updated_by: row.updated_by || null
  };
};

const setKnockoutPredictionAccess = async (clientOrPool = pool, open = false, adminId = null) => {
  const row = await setSetting(clientOrPool, KNOCKOUT_ACCESS_KEY, open ? 'true' : 'false', adminId);
  return {
    open: row.value === 'true',
    updated_at: row.updated_at || null,
    updated_by: row.updated_by || null
  };
};

module.exports = {
  ensureAppSettingsTable,
  getKnockoutPredictionAccess,
  setKnockoutPredictionAccess
};
