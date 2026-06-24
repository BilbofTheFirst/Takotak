const { rankGroupStandings } = require('./groupTieBreakers');

const KNOCKOUT_SLOTS = {
  73: { team1: '2A', team2: '2B' },
  74: { team1: '1E', team2: '3A/B/C/D/F' },
  75: { team1: '1F', team2: '2C' },
  76: { round: '16e de finale', team1: '1C', team2: '2F' }.team1 ? { team1: '1C', team2: '2F' } : null,
  77: { team1: '1I', team2: '3C/D/F/G/H' },
  78: { team1: '2E', team2: '2I' },
  79: { team1: '1A', team2: '3C/E/F/H/I' },
  80: { team1: '1L', team2: '3E/H/I/J/K' },
  81: { team1: '1D', team2: '3B/E/F/I/J' },
  82: { team1: '1G', team2: '3A/E/H/I/J' },
  83: { team1: '2K', team2: '2L' },
  84: { team1: '1H', team2: '2J' },
  85: { team1: '1B', team2: '3E/F/G/I/J' },
  86: { team1: '1J', team2: '2H' },
  87: { team1: '1K', team2: '3D/E/I/J/L' },
  88: { team1: '2D', team2: '2G' },
  89: { team1: 'V74', team2: 'V77' },
  90: { team1: 'V73', team2: 'V75' },
  91: { team1: 'V76', team2: 'V78' },
  92: { team1: 'V79', team2: 'V80' },
  93: { team1: 'V83', team2: 'V84' },
  94: { team1: 'V81', team2: 'V82' },
  95: { team1: 'V86', team2: 'V88' },
  96: { team1: 'V85', team2: 'V87' },
  97: { team1: 'V89', team2: 'V90' },
  98: { team1: 'V93', team2: 'V94' },
  99: { team1: 'V91', team2: 'V92' },
  100: { team1: 'V95', team2: 'V96' },
  101: { team1: 'V97', team2: 'V98' },
  102: { team1: 'V99', team2: 'V100' },
  103: { team1: 'P101', team2: 'P102' },
  104: { team1: 'V101', team2: 'V102' }
};

const hasResult = (match) => (
  match.team1_goals !== null
  && match.team1_goals !== undefined
  && match.team2_goals !== null
  && match.team2_goals !== undefined
);

const ensureTeam = (standings, teamId, teamName, groupCode) => {
  if (!teamId || !teamName || !groupCode) return null;

  if (!standings.has(teamId)) {
    standings.set(teamId, {
      team_id: teamId,
      team_name: teamName,
      group_code: groupCode,
      played: 0,
      points: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      wins: 0,
      draws: 0,
      losses: 0
    });
  }

  return standings.get(teamId);
};

const sortStandings = (a, b) => (
  b.points - a.points
  || b.goal_difference - a.goal_difference
  || b.goals_for - a.goals_for
  || b.wins - a.wins
  || a.team_name.localeCompare(b.team_name, 'fr')
);

const buildGroupPlacements = (matches) => {
  const groupedMatches = new Map();

  matches
    .filter(match => Number(match.id) < 73 && match.groupe1 && match.team1_id && match.team2_id)
    .forEach(match => {
      const groupCode = match.groupe1;
      if (!groupedMatches.has(groupCode)) groupedMatches.set(groupCode, []);
      groupedMatches.get(groupCode).push(match);
    });

  const placements = {};
  const thirdTeams = [];
  const groups = [];

  for (const [groupCode, groupMatches] of groupedMatches.entries()) {
    if (groupMatches.length === 0 || !groupMatches.every(hasResult)) {
      groups.push({ group_code: groupCode, complete: false, standings: [] });
      continue;
    }

    const standings = new Map();

    groupMatches.forEach(match => {
      const team1 = ensureTeam(standings, match.team1_id, match.team1, groupCode);
      const team2 = ensureTeam(standings, match.team2_id, match.team2, groupCode);
      if (!team1 || !team2) return;

      const goals1 = Number(match.team1_goals);
      const goals2 = Number(match.team2_goals);

      team1.played += 1;
      team2.played += 1;
      team1.goals_for += goals1;
      team1.goals_against += goals2;
      team2.goals_for += goals2;
      team2.goals_against += goals1;

      if (goals1 > goals2) {
        team1.points += 3;
        team1.wins += 1;
        team2.losses += 1;
      } else if (goals2 > goals1) {
        team2.points += 3;
        team2.wins += 1;
        team1.losses += 1;
      } else {
        team1.points += 1;
        team2.points += 1;
        team1.draws += 1;
        team2.draws += 1;
      }

      team1.goal_difference = team1.goals_for - team1.goals_against;
      team2.goal_difference = team2.goals_for - team2.goals_against;
    });

    const ranked = rankGroupStandings(Array.from(standings.values()), groupMatches);
    groups.push({ group_code: groupCode, complete: true, standings: ranked });

    if (ranked[0]) placements[`1${groupCode}`] = ranked[0];
    if (ranked[1]) placements[`2${groupCode}`] = ranked[1];
    if (ranked[2]) {
      placements[`3${groupCode}`] = ranked[2];
      thirdTeams.push(ranked[2]);
    }
  }

  thirdTeams.sort(sortStandings);
  thirdTeams.forEach((team, index) => { team.auto_rank = index + 1; });

  return { placements, thirdTeams, groups };
};

const ensureThirdPlaceOrderTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS third_place_order (
      group_code varchar(1) PRIMARY KEY,
      manual_rank integer NOT NULL,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const getManualThirdPlaceOrder = async (client) => {
  await ensureThirdPlaceOrderTable(client);
  const result = await client.query('SELECT group_code, manual_rank FROM third_place_order ORDER BY manual_rank ASC');
  return result.rows;
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
    .map((team, index) => ({
      ...team,
      rank: index + 1,
      manual_rank: manualRank.get(team.group_code) || null
    }));
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

const resolveThirdPlaceToken = (token, thirdTeams) => {
  const allowedGroups = token.replace(/^3/, '').split('/');
  const allAllowedThirdsKnown = allowedGroups.every(groupCode => thirdTeams.some(team => team.group_code === groupCode));

  if (!allAllowedThirdsKnown) return null;

  const resolved = thirdTeams.find(team => allowedGroups.includes(team.group_code));
  return resolved?.team_id || null;
};

const resolveSlotToken = (token, placements, thirdTeams, matchById) => {
  if (!token) return null;

  if (/^[12][A-L]$/.test(token)) {
    return placements[token]?.team_id || null;
  }

  if (/^3[A-L](\/[^\s]+)?$/.test(token) && token.includes('/')) {
    return resolveThirdPlaceToken(token, thirdTeams);
  }

  if (/^[VP]\d+$/.test(token)) {
    const sourceMatch = matchById.get(Number(token.slice(1)));
    if (!sourceMatch) return null;
    return token[0] === 'V' ? getWinnerTeamId(sourceMatch) : getLoserTeamId(sourceMatch);
  }

  return null;
};

const fetchBracketMatches = async (client) => {
  const result = await client.query(`
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

const getThirdPlaceSnapshot = async (client) => {
  const matches = await fetchBracketMatches(client);
  const { placements, thirdTeams, groups } = buildGroupPlacements(matches);
  const manualOrderRows = await getManualThirdPlaceOrder(client);
  const orderedThirdTeams = applyManualThirdPlaceOrder(thirdTeams, manualOrderRows);

  return { placements, thirdTeams: orderedThirdTeams, groups };
};

const applySlot = (match, side, teamId, teamById) => {
  if (!teamId || match[`${side}_id`] === teamId) return null;
  const team = teamById.get(teamId);
  if (!team) return null;
  match[`${side}_id`] = teamId;
  match[side] = team.name;
  match[`groupe${side === 'team1' ? '1' : '2'}`] = team.groupe;
  return { id: match.id, side, teamId };
};

const propagateKnockoutTeams = async (client) => {
  const matches = await fetchBracketMatches(client);
  const { placements, thirdTeams } = buildGroupPlacements(matches);
  const manualOrderRows = await getManualThirdPlaceOrder(client);
  const orderedThirdTeams = applyManualThirdPlaceOrder(thirdTeams, manualOrderRows);
  const matchById = new Map(matches.map(match => [Number(match.id), match]));
  const teamByIdResult = await client.query('SELECT id, name, groupe FROM teams');
  const teamById = new Map(teamByIdResult.rows.map(team => [team.id, team]));
  const updates = [];

  Object.entries(KNOCKOUT_SLOTS).forEach(([matchId, slots]) => {
    const match = matchById.get(Number(matchId));
    if (!match || !slots) return;

    const team1Id = resolveSlotToken(slots.team1, placements, orderedThirdTeams, matchById);
    const team2Id = resolveSlotToken(slots.team2, placements, orderedThirdTeams, matchById);

    const update1 = applySlot(match, 'team1', team1Id, teamById);
    const update2 = applySlot(match, 'team2', team2Id, teamById);
    if (update1) updates.push(update1);
    if (update2) updates.push(update2);
  });

  for (const update of updates) {
    await client.query(`UPDATE matches SET ${update.side}_id = $1 WHERE id = $2`, [update.teamId, update.id]);
  }

  return updates;
};

const saveManualThirdPlaceOrder = async (client, groupCodes = []) => {
  await ensureThirdPlaceOrderTable(client);
  await client.query('DELETE FROM third_place_order');

  for (let index = 0; index < groupCodes.length; index += 1) {
    await client.query(
      `INSERT INTO third_place_order (group_code, manual_rank, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [groupCodes[index], index + 1]
    );
  }
};

module.exports = {
  KNOCKOUT_SLOTS,
  buildGroupPlacements,
  getThirdPlaceSnapshot,
  propagateKnockoutTeams,
  saveManualThirdPlaceOrder
};
