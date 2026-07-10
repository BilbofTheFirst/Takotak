const buildScopedStats = (teams, matches, scope) => {
  const teamSet = new Set(teams.map(team => Number(team.team_id)));
  const stats = new Map(teams.map(team => [Number(team.team_id), { points: 0, goals_for: 0, goals_against: 0, goal_difference: 0 }]))
;

  matches.forEach(match => {
    const team1Id = Number(match.team1_id);
    const team2Id = Number(match.team2_id);
    const team1InScope = teamSet.has(team1Id);
    const team2InScope = teamSet.has(team2Id);
    const include = scope === 'headToHead'
      ? team1InScope && team2InScope
      : team1InScope !== team2InScope;

    if (!include) return;

    const goals1 = Number(match.team1_goals || 0);
    const goals2 = Number(match.team2_goals || 0);

    const update = (teamId, goalsFor, goalsAgainst) => {
      const normalizedTeamId = Number(teamId);
      if (!teamSet.has(normalizedTeamId)) return;
      const row = stats.get(normalizedTeamId);
      row.goals_for += goalsFor;
      row.goals_against += goalsAgainst;
      row.goal_difference = row.goals_for - row.goals_against;
      if (goalsFor > goalsAgainst) row.points += 3;
      else if (goalsFor === goalsAgainst) row.points += 1;
    };

    update(team1Id, goals1, goals2);
    update(team2Id, goals2, goals1);
  });

  return stats;
};

const sortOverall = (a, b) => (
  b.goal_difference - a.goal_difference
  || b.goals_for - a.goals_for
);

const splitByOverallCriteria = (teams) => {
  const groups = new Map();

  [...teams].sort(sortOverall).forEach(team => {
    const key = `${team.goal_difference}:${team.goals_for}`;
    if (!groups.has(key)) groups.set(key, { team, teams: [] });
    groups.get(key).teams.push(team);
  });

  return Array.from(groups.values()).sort((a, b) => sortOverall(a.team, b.team));
};

const splitByHeadToHead = (teams, matches) => {
  const headToHead = buildScopedStats(teams, matches, 'headToHead');
  const groups = new Map();

  teams.forEach(team => {
    const scoped = headToHead.get(Number(team.team_id)) || { points: 0, goal_difference: 0, goals_for: 0 };
    const key = `${scoped.points}:${scoped.goal_difference}:${scoped.goals_for}`;
    if (!groups.has(key)) groups.set(key, { scoped, teams: [] });
    groups.get(key).teams.push(team);
  });

  return Array.from(groups.values()).sort((a, b) => (
    b.scoped.points - a.scoped.points
    || b.scoped.goal_difference - a.scoped.goal_difference
    || b.scoped.goals_for - a.scoped.goals_for
  ));
};

const fallbackSort = (teams, matches) => {
  const remaining = buildScopedStats(teams, matches, 'remaining');

  return [...teams].sort((a, b) => {
    const remainingA = remaining.get(Number(a.team_id)) || { points: 0, goal_difference: 0, goals_for: 0 };
    const remainingB = remaining.get(Number(b.team_id)) || { points: 0, goal_difference: 0, goals_for: 0 };

    return remainingB.points - remainingA.points
      || remainingB.goal_difference - remainingA.goal_difference
      || remainingB.goals_for - remainingA.goals_for
      || b.wins - a.wins
      || a.team_name.localeCompare(b.team_name, 'fr');
  });
};

const rankHeadToHeadTiedTeams = (teams, matches) => {
  if (teams.length <= 1) return teams;

  const groups = splitByHeadToHead(teams, matches);
  if (groups.length === 1) return fallbackSort(teams, matches);

  return groups.flatMap(group => rankHeadToHeadTiedTeams(group.teams, matches));
};

const rankTiedTeams = (teams, matches) => {
  if (teams.length <= 1) return teams;

  const overallGroups = splitByOverallCriteria(teams);
  return overallGroups.flatMap(group => rankHeadToHeadTiedTeams(group.teams, matches));
};

const rankGroupStandings = (teams, matches) => {
  const pointsGroups = new Map();

  teams.forEach(team => {
    if (!pointsGroups.has(team.points)) pointsGroups.set(team.points, []);
    pointsGroups.get(team.points).push(team);
  });

  return Array.from(pointsGroups.entries())
    .sort(([pointsA], [pointsB]) => Number(pointsB) - Number(pointsA))
    .flatMap(([, tiedTeams]) => rankTiedTeams(tiedTeams, matches));
};

module.exports = { rankGroupStandings };
