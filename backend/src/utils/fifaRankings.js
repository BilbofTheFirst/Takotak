const fifaRankingsSnapshot = require('../data/fifa_rankings_2026_06_11.json');

const normalize = (value) =>
  (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[’']/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const buildRankingLookup = () => {
  const lookup = new Map();

  fifaRankingsSnapshot.rankings.forEach(entry => {
    [entry.team, ...(entry.aliases || [])].forEach(name => {
      const key = normalize(name);
      if (key) lookup.set(key, entry);
    });
  });

  return lookup;
};

const ensureFifaRankingColumns = async (clientOrPool) => {
  await clientOrPool.query(`
    ALTER TABLE teams
      ADD COLUMN IF NOT EXISTS fifa_ranking integer,
      ADD COLUMN IF NOT EXISTS fifa_ranking_source varchar(255),
      ADD COLUMN IF NOT EXISTS fifa_ranking_updated_at date
  `);
};

const applyFifaRankings = async (clientOrPool) => {
  await ensureFifaRankingColumns(clientOrPool);

  const teamsResult = await clientOrPool.query('SELECT id, name FROM teams ORDER BY id');
  const lookup = buildRankingLookup();
  const updated = [];
  const missing = [];

  for (const team of teamsResult.rows) {
    const rankingEntry = lookup.get(normalize(team.name));

    if (!rankingEntry) {
      missing.push({ id: Number(team.id), name: team.name });
      continue;
    }

    await clientOrPool.query(
      `UPDATE teams
       SET fifa_ranking = $1,
           fifa_ranking_source = $2,
           fifa_ranking_updated_at = $3
       WHERE id = $4`,
      [
        rankingEntry.ranking,
        fifaRankingsSnapshot.source,
        fifaRankingsSnapshot.publishedAt,
        team.id
      ]
    );

    updated.push({
      id: Number(team.id),
      name: team.name,
      ranking: rankingEntry.ranking,
      sourceTeam: rankingEntry.team
    });
  }

  return {
    source: fifaRankingsSnapshot.source,
    sourceUrl: fifaRankingsSnapshot.sourceUrl,
    publishedAt: fifaRankingsSnapshot.publishedAt,
    nextOfficialUpdate: fifaRankingsSnapshot.nextOfficialUpdate,
    updatedCount: updated.length,
    missingCount: missing.length,
    updated,
    missing
  };
};

module.exports = {
  applyFifaRankings,
  ensureFifaRankingColumns,
  fifaRankingsSnapshot
};
