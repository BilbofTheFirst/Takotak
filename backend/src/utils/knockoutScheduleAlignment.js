const { buildGroupPlacements } = require('./knockoutPropagation');

const THIRD_PLACE_QUALIFIERS = 8;

const SCHEDULE_KNOCKOUT_SLOTS = {
  73: { team1: '2A', team2: '2B' },
  74: { team1: '1C', team2: '2F' },
  75: { team1: '1E', team2: '3A/B/C/D/F' },
  76: { team1: '1F', team2: '2C' },
  77: { team1: '2E', team2: '2I' },
  78: { team1: '1I', team2: '3C/D/F/G/H' },
  79: { team1: '1A', team2: '3C/E/F/H/I' },
  80: { team1: '1L', team2: '3E/H/I/J/K' },
  81: { team1: '1G', team2: '3A/E/H/I/J' },
  82: { team1: '1D', team2: '3B/E/F/I/J' },
  83: { team1: '1H', team2: '2J' },
  84: { team1: '2K', team2: '2L' },
  85: { team1: '1B', team2: '3E/F/G/I/J' },
  86: { team1: '2D', team2: '2G' },
  87: { team1: '1J', team2: '2H' },
  88: { team1: '1K', team2: '3D/E/I/J/L' },
  89: { team1: 'V73', team2: 'V76' },
  90: { team1: 'V75', team2: 'V78' },
  91: { team1: 'V74', team2: 'V77' },
  92: { team1: 'V79', team2: 'V80' },
  93: { team1: 'V84', team2: 'V83' },
  94: { team1: 'V82', team2: 'V81' },
  95: { team1: 'V87', team2: 'V86' },
  96: { team1: 'V85', team2: 'V88' },
  97: { team1: 'V90', team2: 'V89' },
  98: { team1: 'V93', team2: 'V94' },
  99: { team1: 'V91', team2: 'V92' },
  100: { team1: 'V95', team2: 'V96' },
  101: { team1: 'V97', team2: 'V98' },
  102: { team1: 'V99', team2: 'V100' },
  103: { team1: 'P101', team2: 'P102' },
  104: { team1: 'V101', team2: 'V102' }
};

const THIRD_PLACE_WINNER_COLUMNS = ['A', 'B', 'D', 'E', 'G', 'I', 'K', 'L'];
const WINNER_GROUP_BY_SCHEDULE_MATCH = { 75: 'E', 78: 'I', 79: 'A', 80: 'L', 81: 'G', 82: 'D', 85: 'B', 88: 'K' };
const LEGACY_THIRD_PLACE_SLOT_MATCH_MAP = new Map([
  [74, 75],
  [77, 78],
  [79, 79],
  [80, 80],
  [81, 82],
  [82, 81],
  [85, 85],
  [87, 88]
]);

const buildAssignment = (values) => Object.fromEntries(THIRD_PLACE_WINNER_COLUMNS.map((winnerGroup, index) => [winnerGroup, values[index]]));

const THIRD_PLACE_COMBINATION_TABLE = {
  BDEFIJKL: buildAssignment(['E', 'J', 'B', 'D', 'I', 'F', 'L', 'K']),
  BDEFGIKL: buildAssignment(['E', 'G', 'B', 'D', 'I', 'F', 'L', 'K']),
  BDEFGIJL: buildAssignment(['E', 'G', 'B', 'D', 'J', 'F', 'L', 'I']),
  BDEFGIJK: buildAssignment(['E', 'G', 'B', 'D', 'J', 'F', 'I', 'K']),
  ABDEFGIL: buildAssignment(['E', 'G', 'B', 'D', 'A', 'F', 'L', 'I']),
  ABDEFGIK: buildAssignment(['E', 'G', 'B', 'D', 'A', 'F', 'I', 'K']),
  ABDEFGIJ: buildAssignment(['E', 'G', 'B', 'D', 'A', 'F', 'I', 'J']),
  ABCDEFGI: buildAssignment(['C', 'G', 'B', 'D', 'A', 'F', 'E', 'I'])
};

const sortThirdTeams = (a, b) => (
  b.points - a.points
  || b.goal_difference - a.goal_difference
  || b.goals_for - a.goals_for
  || b.wins - a.wins
  || a.team_name.localeCompare(b.team_name, 'fr')
);

const hasResult = (match) => (
  match.team1_goals !== null
  && match.team1_goals !== undefined
  && match.team2_goals !== null
  && match.team2_goals !== undefined
);

const getCombinationKey = (groupCodes) => [...groupCodes].sort().join('');

const fetchBracketMatches = async (clientOrPool) => {
  const result = await clientOrPool.query(`
    SELECT
      m.id,
      m.team1_id,
      m.team2_id,
      t1.name as team1,
      t1.groupe as groupe1,
      t2.name as team2,
      t2.groupe as groupe2,
      r.team1_goals,
      r.team2_goals,
      r.team1_penalty_goals,
      r.team2_penalty_goals,
      r.winner_team_id
    FROM matches m
    LEFT JOIN teams t1 ON m.team1_id = t1.id
    LEFT JOIN teams t2 ON m.team2_id = t2.id
    LEFT JOIN results r ON m.id = r.match_id
    ORDER BY m.id
  `);
  return result.rows;
};

const getManualThirdPlaceOrder = async (clientOrPool) => {
  await clientOrPool.query(`
    CREATE TABLE IF NOT EXISTS third_place_order (
      group_code varchar(1) PRIMARY KEY,
      manual_rank integer NOT NULL,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const result = await clientOrPool.query('SELECT group_code, manual_rank FROM third_place_order ORDER BY manual_rank ASC');
  return result.rows;
};

const getManualThirdPlaceSlotRows = async (clientOrPool) => {
  await clientOrPool.query(`
    CREATE TABLE IF NOT EXISTS manual_third_place_slots (
      match_id integer PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
      group_code varchar(1) NOT NULL,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const result = await clientOrPool.query('SELECT match_id, group_code FROM manual_third_place_slots ORDER BY match_id ASC');
  return result.rows;
};

const getManualSlotMap = (rows) => {
  const map = new Map();

  rows.forEach(row => {
    const originalMatchId = Number(row.match_id);
    const scheduleMatchId = LEGACY_THIRD_PLACE_SLOT_MATCH_MAP.get(originalMatchId) || originalMatchId;
    if (!map.has(scheduleMatchId)) map.set(scheduleMatchId, row.group_code);
    if (scheduleMatchId === originalMatchId) map.set(scheduleMatchId, row.group_code);
  });

  return map;
};

const applyManualThirdPlaceOrder = (thirdTeams, manualOrderRows) => {
  const autoIndex = new Map(thirdTeams.map((team, index) => [team.group_code, index]));
  const manualRank = new Map(manualOrderRows.map(row => [row.group_code, Number(row.manual_rank)]));

  return [...thirdTeams]
    .sort((a, b) => {
      const rankA = manualRank.get(a.group_code);
      const rankB = manualRank.get(b.group_code);
      if (rankA && rankB) return rankA - rankB;
      if (rankA) return -1;
      if (rankB) return 1;
      return (autoIndex.get(a.group_code) ?? 999) - (autoIndex.get(b.group_code) ?? 999);
    })
    .map((team, index) => ({ ...team, rank: index + 1, manual_rank: manualRank.get(team.group_code) || null }));
};

const buildThirdPlaceResolution = (thirdTeams, manualOrderRows) => {
  const orderedThirdTeams = applyManualThirdPlaceOrder(thirdTeams, manualOrderRows);
  const manualGroupCodes = manualOrderRows.map(row => row.group_code).filter(Boolean);
  const hasManualQualifiers = manualGroupCodes.length >= THIRD_PLACE_QUALIFIERS;
  const qualifiedGroupCodes = hasManualQualifiers
    ? new Set(manualGroupCodes.slice(0, THIRD_PLACE_QUALIFIERS))
    : new Set(orderedThirdTeams.slice(0, THIRD_PLACE_QUALIFIERS).map(team => team.group_code));
  const combinationKey = getCombinationKey(qualifiedGroupCodes);

  return {
    orderedThirdTeams,
    qualifiedThirdTeams: orderedThirdTeams.filter(team => qualifiedGroupCodes.has(team.group_code)).slice(0, THIRD_PLACE_QUALIFIERS),
    thirdPlaceAssignment: THIRD_PLACE_COMBINATION_TABLE[combinationKey] || null
  };
};

const getWinnerTeamId = (match) => {
  if (!hasResult(match)) return null;
  if (match.winner_team_id) return match.winner_team_id;
  const goals1 = Number(match.team1_goals);
  const goals2 = Number(match.team2_goals);
  if (goals1 > goals2) return match.team1_id;
  if (goals2 > goals1) return match.team2_id;
  return null;
};

const getLoserTeamId = (match) => {
  const winnerId = getWinnerTeamId(match);
  if (!winnerId) return null;
  if (winnerId === match.team1_id) return match.team2_id;
  if (winnerId === match.team2_id) return match.team1_id;
  return null;
};

const resolveThirdPlaceToken = (token, resolution, winnerGroup, manualGroupCode = null) => {
  const targetGroup = manualGroupCode || resolution.thirdPlaceAssignment?.[winnerGroup] || null;
  if (!targetGroup) return null;
  const allowedGroups = token.replace(/^3/, '').split('/');
  if (!allowedGroups.includes(targetGroup)) return null;
  const team = resolution.qualifiedThirdTeams.find(item => item.group_code === targetGroup)
    || resolution.orderedThirdTeams.find(item => item.group_code === targetGroup);
  return team?.team_id || null;
};

const resolveSlotToken = (token, placements, resolution, matchById, winnerGroup, manualGroupCode = null) => {
  if (!token) return null;
  if (/^[12][A-L]$/.test(token)) return placements[token]?.team_id || null;
  if (/^3[A-L](\/[^\s]+)?$/.test(token) && token.includes('/')) return resolveThirdPlaceToken(token, resolution, winnerGroup, manualGroupCode);
  if (/^[VP]\d+$/.test(token)) {
    const sourceMatch = matchById.get(Number(token.slice(1)));
    if (!sourceMatch) return null;
    return token[0] === 'V' ? getWinnerTeamId(sourceMatch) : getLoserTeamId(sourceMatch);
  }
  return null;
};

const applySlot = (match, side, teamId, teamById) => {
  if (!teamId) return null;
  if (match[`${side}_id`] === teamId) return null;
  const team = teamById.get(teamId);
  if (!team) return null;
  match[`${side}_id`] = teamId;
  return { id: match.id, side, teamId };
};

const propagateAlignedKnockoutTeams = async (clientOrPool) => {
  const matches = await fetchBracketMatches(clientOrPool);
  const { placements, thirdTeams } = buildGroupPlacements(matches);
  thirdTeams.sort(sortThirdTeams);

  const [manualOrderRows, manualSlotRows, teamByIdResult] = await Promise.all([
    getManualThirdPlaceOrder(clientOrPool),
    getManualThirdPlaceSlotRows(clientOrPool),
    clientOrPool.query('SELECT id, name, groupe FROM teams')
  ]);
  const resolution = buildThirdPlaceResolution(thirdTeams, manualOrderRows);
  const manualSlotMap = getManualSlotMap(manualSlotRows);
  const matchById = new Map(matches.map(match => [Number(match.id), match]));
  const teamById = new Map(teamByIdResult.rows.map(team => [team.id, team]));
  const updates = [];

  Object.entries(SCHEDULE_KNOCKOUT_SLOTS).forEach(([matchId, slots]) => {
    const numericMatchId = Number(matchId);
    const match = matchById.get(numericMatchId);
    if (!match) return;

    const winnerGroup = WINNER_GROUP_BY_SCHEDULE_MATCH[numericMatchId] || null;
    const manualGroupCode = manualSlotMap.get(numericMatchId) || null;
    const team1Id = resolveSlotToken(slots.team1, placements, resolution, matchById, winnerGroup, manualGroupCode);
    const team2Id = resolveSlotToken(slots.team2, placements, resolution, matchById, winnerGroup, manualGroupCode);

    const update1 = applySlot(match, 'team1', team1Id, teamById);
    const update2 = applySlot(match, 'team2', team2Id, teamById);
    if (update1) updates.push(update1);
    if (update2) updates.push(update2);
  });

  for (const update of updates) {
    await clientOrPool.query(`UPDATE matches SET ${update.side}_id = $1 WHERE id = $2`, [update.teamId, update.id]);
  }

  return updates;
};

module.exports = {
  SCHEDULE_KNOCKOUT_SLOTS,
  propagateAlignedKnockoutTeams
};
