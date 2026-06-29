const SCHEDULE_ROW_BY_OFFICIAL_MATCH = {
  73: 73,
  74: 75,
  75: 76,
  76: 74,
  77: 78,
  78: 77,
  79: 79,
  80: 80,
  81: 82,
  82: 81,
  83: 84,
  84: 83,
  85: 85,
  86: 87,
  87: 88,
  88: 86,
  89: 90,
  90: 89,
  91: 91,
  92: 92,
  93: 93,
  94: 94,
  95: 95,
  96: 96,
  97: 97,
  98: 98,
  99: 99,
  100: 100,
  101: 101,
  102: 102,
  103: 103,
  104: 104
};

const alignKnockoutScheduleRows = async (clientOrPool) => {
  const result = await clientOrPool.query(`
    SELECT id, team1_id, team2_id
    FROM matches
    WHERE id BETWEEN 73 AND 104
    ORDER BY id
  `);

  const matchById = new Map(result.rows.map(match => [Number(match.id), match]));
  const updates = [];

  Object.entries(SCHEDULE_ROW_BY_OFFICIAL_MATCH).forEach(([officialMatchId, scheduleRowId]) => {
    const source = matchById.get(Number(officialMatchId));
    const target = matchById.get(Number(scheduleRowId));
    if (!source || !target) return;

    const nextTeam1 = source.team1_id || null;
    const nextTeam2 = source.team2_id || null;

    if (target.team1_id !== nextTeam1 || target.team2_id !== nextTeam2) {
      updates.push({ id: Number(scheduleRowId), team1_id: nextTeam1, team2_id: nextTeam2 });
    }
  });

  for (const update of updates) {
    await clientOrPool.query(
      'UPDATE matches SET team1_id = $1, team2_id = $2 WHERE id = $3',
      [update.team1_id, update.team2_id, update.id]
    );
  }

  return updates;
};

module.exports = {
  SCHEDULE_ROW_BY_OFFICIAL_MATCH,
  alignKnockoutScheduleRows
};
