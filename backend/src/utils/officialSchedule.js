const OFFICIAL_KNOCKOUT_START_TIMES = {
  73: '2026-06-28 21:00:00',
  74: '2026-06-29 22:30:00',
  75: '2026-06-30 03:00:00',
  76: '2026-06-29 19:00:00',
  77: '2026-06-30 23:00:00',
  78: '2026-06-30 19:00:00',
  79: '2026-07-01 03:00:00',
  80: '2026-07-01 18:00:00',
  81: '2026-07-02 02:00:00',
  82: '2026-07-01 22:00:00',
  83: '2026-07-03 01:00:00',
  84: '2026-07-02 21:00:00',
  85: '2026-07-03 05:00:00',
  86: '2026-07-04 00:00:00',
  87: '2026-07-04 03:30:00',
  88: '2026-07-03 20:00:00',
  89: '2026-07-04 23:00:00',
  90: '2026-07-04 19:00:00',
  91: '2026-07-05 22:00:00',
  92: '2026-07-06 02:00:00',
  93: '2026-07-06 21:00:00',
  94: '2026-07-07 02:00:00',
  95: '2026-07-07 18:00:00',
  96: '2026-07-07 22:00:00',
  97: '2026-07-09 22:00:00',
  98: '2026-07-10 21:00:00',
  99: '2026-07-11 23:00:00',
  100: '2026-07-12 03:00:00',
  101: '2026-07-14 21:00:00',
  102: '2026-07-15 21:00:00',
  103: '2026-07-18 23:00:00',
  104: '2026-07-19 21:00:00'
};

const buildOfficialKnockoutCaseSql = (matchIdSql, fallbackSql) => {
  const branches = Object.entries(OFFICIAL_KNOCKOUT_START_TIMES)
    .map(([matchId, startTime]) => `WHEN ${matchIdSql} = ${Number(matchId)} THEN TIMESTAMP '${startTime}'`)
    .join('\n      ');

  return `(CASE
      ${branches}
      ELSE ${fallbackSql}
    END)`;
};

const getEffectiveStartTimeSql = (matchAlias = 'm') => buildOfficialKnockoutCaseSql(`${matchAlias}.id`, `${matchAlias}.start_time`);

module.exports = {
  OFFICIAL_KNOCKOUT_START_TIMES,
  getEffectiveStartTimeSql
};
