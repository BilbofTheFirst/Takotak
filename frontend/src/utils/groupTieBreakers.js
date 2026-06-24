const getMatchGoals = (match) => ({
  team1_goals: Number(match.team1_goals || 0),
  team2_goals: Number(match.team2_goals || 0)
});

const buildScopedStats = (teams, matches, scope) => {
  const teamSet = new Set(teams.map(team => team.team));
  const stats = new Map(teams.map(team => [team.team, { points: 0, goalsFor: 0, goalsAgainst: 0, diff: 0 }]));

  matches.forEach(match => {
    const team1InScope = teamSet.has(match.team1);
    const team2InScope = teamSet.has(match.team2);
    const include = scope === 'headToHead'
      ? team1InScope && team2InScope
      : team1InScope !== team2InScope;

    if (!include) return;

    const { team1_goals: goals1, team2_goals: goals2 } = getMatchGoals(match);

    const update = (team, goalsFor, goalsAgainst) => {
      if (!teamSet.has(team)) return;
      const row = stats.get(team);
      row.goalsFor += goalsFor;
      row.goalsAgainst += goalsAgainst;
      row.diff = row.goalsFor - row.goalsAgainst;
      if (goalsFor > goalsAgainst) row.points += 3;
      else if (goalsFor === goalsAgainst) row.points += 1;
    };

    update(match.team1, goals1, goals2);
    update(match.team2, goals2, goals1);
  });

  return stats;
};

const splitByHeadToHead = (teams, matches) => {
  const headToHead = buildScopedStats(teams, matches, 'headToHead');
  const groups = new Map();

  teams.forEach(team => {
    const scoped = headToHead.get(team.team) || { points: 0, diff: 0, goalsFor: 0 };
    const key = `${scoped.points}:${scoped.diff}:${scoped.goalsFor}`;
    if (!groups.has(key)) groups.set(key, { scoped, teams: [] });
    groups.get(key).teams.push(team);
  });

  return Array.from(groups.values()).sort((a, b) => (
    b.scoped.points - a.scoped.points
    || b.scoped.diff - a.scoped.diff
    || b.scoped.goalsFor - a.scoped.goalsFor
  ));
};

const fallbackSort = (teams, matches) => {
  const remaining = buildScopedStats(teams, matches, 'remaining');

  return [...teams].sort((a, b) => {
    const remainingA = remaining.get(a.team) || { points: 0, diff: 0, goalsFor: 0 };
    const remainingB = remaining.get(b.team) || { points: 0, diff: 0, goalsFor: 0 };

    return remainingB.points - remainingA.points
      || remainingB.diff - remainingA.diff
      || remainingB.goalsFor - remainingA.goalsFor
      || b.diff - a.diff
      || b.goalsFor - a.goalsFor
      || b.won - a.won
      || a.team.localeCompare(b.team, 'fr');
  });
};

const rankTiedTeams = (teams, matches) => {
  if (teams.length <= 1) return teams;

  const groups = splitByHeadToHead(teams, matches);
  if (groups.length === 1) return fallbackSort(teams, matches);

  return groups.flatMap(group => rankTiedTeams(group.teams, matches));
};

export const rankGroupTeams = (teams, matches) => {
  const pointsGroups = new Map();

  teams.forEach(team => {
    if (!pointsGroups.has(team.points)) pointsGroups.set(team.points, []);
    pointsGroups.get(team.points).push(team);
  });

  return Array.from(pointsGroups.entries())
    .sort(([pointsA], [pointsB]) => Number(pointsB) - Number(pointsA))
    .flatMap(([, tiedTeams]) => rankTiedTeams(tiedTeams, matches));
};
