const GROUP_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const BONUS_POINTS = {
  GROUP_WINNER: 5,
  CHAMPION: 15,
  RUNNER_UP: 10,
  SEMIFINALIST: 5
};

const normalizeTeamName = (value) => String(value || '').trim();

const ensureBonusPredictionTable = async (clientOrPool) => {
  await clientOrPool.query(`
    CREATE TABLE IF NOT EXISTS bonus_predictions (
      user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      group_winners jsonb NOT NULL DEFAULT '{}'::jsonb,
      champion varchar(120),
      runner_up varchar(120),
      semifinalists jsonb NOT NULL DEFAULT '[]'::jsonb,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const getBonusDeadline = async (clientOrPool) => {
  const result = await clientOrPool.query(`
    SELECT
      to_char(MIN(start_time), 'YYYY-MM-DD"T"HH24:MI:SS') AS first_match_time,
      CASE
        WHEN MIN(start_time) IS NULL THEN false
        ELSE (MIN(start_time) AT TIME ZONE 'Europe/Brussels') <= NOW()
      END AS locked
    FROM matches
  `);

  return {
    first_match_time: result.rows[0]?.first_match_time || null,
    locked: Boolean(result.rows[0]?.locked)
  };
};

const parseJsonValue = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch (_) { return fallback; }
  }
  return value;
};

const normalizeBonusPrediction = (row) => ({
  user_id: row?.user_id || null,
  group_winners: parseJsonValue(row?.group_winners, {}),
  champion: row?.champion || '',
  runner_up: row?.runner_up || '',
  semifinalists: parseJsonValue(row?.semifinalists, []),
  updated_at: row?.updated_at || null
});

const getMatchWinnerName = (match) => {
  if (!match) return null;
  if (match.winner_team_id) {
    if (Number(match.winner_team_id) === Number(match.team1_id)) return match.team1;
    if (Number(match.winner_team_id) === Number(match.team2_id)) return match.team2;
  }

  if (match.team1_goals === null || match.team1_goals === undefined || match.team2_goals === null || match.team2_goals === undefined) {
    return null;
  }

  const goals1 = Number(match.team1_goals);
  const goals2 = Number(match.team2_goals);
  if (goals1 > goals2) return match.team1;
  if (goals2 > goals1) return match.team2;
  return null;
};

const getMatchLoserName = (match) => {
  const winner = getMatchWinnerName(match);
  if (!winner) return null;
  if (winner === match.team1) return match.team2;
  if (winner === match.team2) return match.team1;
  return null;
};

const sortStandings = (a, b) => (
  b.points - a.points
  || b.goal_difference - a.goal_difference
  || b.goals_for - a.goals_for
  || b.wins - a.wins
  || a.team_name.localeCompare(b.team_name, 'fr')
);

const buildActualGroupWinners = async (clientOrPool) => {
  const result = await clientOrPool.query(`
    SELECT
      m.id,
      t1.id AS team1_id,
      t1.name AS team1,
      t1.groupe AS groupe1,
      t2.id AS team2_id,
      t2.name AS team2,
      r.team1_goals,
      r.team2_goals
    FROM matches m
    JOIN teams t1 ON m.team1_id = t1.id
    JOIN teams t2 ON m.team2_id = t2.id
    LEFT JOIN results r ON r.match_id = m.id
    WHERE m.id < 73
    ORDER BY m.id
  `);

  const groupMatches = new Map();
  result.rows.forEach(match => {
    const group = match.groupe1;
    if (!group) return;
    if (!groupMatches.has(group)) groupMatches.set(group, []);
    groupMatches.get(group).push(match);
  });

  const winners = {};

  GROUP_CODES.forEach(group => {
    const matches = groupMatches.get(group) || [];
    if (matches.length === 0 || !matches.every(match => match.team1_goals !== null && match.team2_goals !== null)) return;

    const standings = new Map();
    const ensureTeam = (id, name) => {
      if (!standings.has(id)) {
        standings.set(id, {
          team_id: id,
          team_name: name,
          points: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
          wins: 0
        });
      }
      return standings.get(id);
    };

    matches.forEach(match => {
      const team1 = ensureTeam(match.team1_id, match.team1);
      const team2 = ensureTeam(match.team2_id, match.team2);
      const goals1 = Number(match.team1_goals);
      const goals2 = Number(match.team2_goals);

      team1.goals_for += goals1;
      team1.goals_against += goals2;
      team2.goals_for += goals2;
      team2.goals_against += goals1;

      if (goals1 > goals2) {
        team1.points += 3;
        team1.wins += 1;
      } else if (goals2 > goals1) {
        team2.points += 3;
        team2.wins += 1;
      } else {
        team1.points += 1;
        team2.points += 1;
      }

      team1.goal_difference = team1.goals_for - team1.goals_against;
      team2.goal_difference = team2.goals_for - team2.goals_against;
    });

    const winner = Array.from(standings.values()).sort(sortStandings)[0];
    if (winner) winners[group] = winner.team_name;
  });

  return winners;
};

const buildActualBonusAnswers = async (clientOrPool) => {
  const [groupWinners, knockoutResult] = await Promise.all([
    buildActualGroupWinners(clientOrPool),
    clientOrPool.query(`
      SELECT
        m.id,
        m.team1_id,
        m.team2_id,
        t1.name AS team1,
        t2.name AS team2,
        r.team1_goals,
        r.team2_goals,
        r.winner_team_id
      FROM matches m
      LEFT JOIN teams t1 ON t1.id = m.team1_id
      LEFT JOIN teams t2 ON t2.id = m.team2_id
      LEFT JOIN results r ON r.match_id = m.id
      WHERE m.id IN (101, 102, 104)
    `)
  ]);

  const byId = new Map(knockoutResult.rows.map(match => [Number(match.id), match]));
  const final = byId.get(104);
  const semis = [byId.get(101), byId.get(102)];

  const semifinalists = semis
    .flatMap(match => match ? [match.team1, match.team2] : [])
    .filter(Boolean);

  return {
    group_winners: groupWinners,
    champion: getMatchWinnerName(final),
    runner_up: getMatchLoserName(final),
    semifinalists
  };
};

const calculateBonusPoints = (predictionRow, actual) => {
  const prediction = normalizeBonusPrediction(predictionRow);
  const groupWinners = prediction.group_winners || {};
  const semifinalists = Array.isArray(prediction.semifinalists) ? prediction.semifinalists.map(normalizeTeamName).filter(Boolean) : [];

  let points = 0;
  const details = {
    group_winners: {},
    champion: 0,
    runner_up: 0,
    semifinalists: {}
  };

  GROUP_CODES.forEach(group => {
    const predicted = normalizeTeamName(groupWinners[group]);
    const actualWinner = normalizeTeamName(actual.group_winners?.[group]);
    const earned = predicted && actualWinner && predicted === actualWinner ? BONUS_POINTS.GROUP_WINNER : 0;
    details.group_winners[group] = earned;
    points += earned;
  });

  if (normalizeTeamName(prediction.champion) && normalizeTeamName(actual.champion) && normalizeTeamName(prediction.champion) === normalizeTeamName(actual.champion)) {
    details.champion = BONUS_POINTS.CHAMPION;
    points += BONUS_POINTS.CHAMPION;
  }

  if (normalizeTeamName(prediction.runner_up) && normalizeTeamName(actual.runner_up) && normalizeTeamName(prediction.runner_up) === normalizeTeamName(actual.runner_up)) {
    details.runner_up = BONUS_POINTS.RUNNER_UP;
    points += BONUS_POINTS.RUNNER_UP;
  }

  const actualSemifinalists = new Set((actual.semifinalists || []).map(normalizeTeamName));
  semifinalists.forEach(team => {
    const earned = actualSemifinalists.has(team) ? BONUS_POINTS.SEMIFINALIST : 0;
    details.semifinalists[team] = earned;
    points += earned;
  });

  return { points, details };
};

const getAllBonusScores = async (clientOrPool) => {
  await ensureBonusPredictionTable(clientOrPool);
  const actual = await buildActualBonusAnswers(clientOrPool);
  const result = await clientOrPool.query('SELECT * FROM bonus_predictions');
  const scores = new Map();

  result.rows.forEach(row => {
    scores.set(Number(row.user_id), calculateBonusPoints(row, actual));
  });

  return { actual, scores };
};

module.exports = {
  GROUP_CODES,
  BONUS_POINTS,
  ensureBonusPredictionTable,
  getBonusDeadline,
  normalizeBonusPrediction,
  buildActualBonusAnswers,
  calculateBonusPoints,
  getAllBonusScores
};
