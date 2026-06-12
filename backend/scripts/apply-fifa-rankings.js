const pool = require('../src/db/pool');
const { applyFifaRankings } = require('../src/utils/fifaRankings');

applyFifaRankings(pool)
  .then((result) => {
    console.log('FIFA rankings source:', result.source, result.publishedAt);
    console.log('Updated teams:', result.updatedCount);
    console.log('Missing teams:', result.missingCount);
    result.missing.forEach((team) => console.log('-', team.name, `(id ${team.id})`));
  })
  .catch((error) => {
    console.error('Failed to apply FIFA rankings:', error);
  })
  .finally(() => pool.end());
