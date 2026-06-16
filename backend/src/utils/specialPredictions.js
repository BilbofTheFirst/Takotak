const SPECIAL_MATCHDAYS = {
  FIRST: 1,
  SECOND: 2
};

const SPECIAL_PREDICTION_CODES = {
  TOTAL_GOALS: 'FIRST_MATCHDAY_TOTAL_GOALS',
  DRAW_COUNT: 'FIRST_MATCHDAY_DRAW_COUNT',
  CLEAN_SHEET_COUNT: 'FIRST_MATCHDAY_CLEAN_SHEET_COUNT',
  SECOND_TOTAL_GOALS: 'SECOND_MATCHDAY_TOTAL_GOALS',
  SECOND_SIX_POINT_TEAMS: 'SECOND_MATCHDAY_SIX_POINT_TEAMS',
  SECOND_BOTH_TEAMS_SCORE_COUNT: 'SECOND_MATCHDAY_BOTH_TEAMS_SCORE_COUNT'
};

const FIRST_MATCHDAY_SPECIAL_DEFINITIONS = [
  {
    code: SPECIAL_PREDICTION_CODES.TOTAL_GOALS,
    matchday: SPECIAL_MATCHDAYS.FIRST,
    label: 'Nombre total de buts',
    description: 'Combien de buts seront marqués lors de la première journée complète (24 matchs) ?',
    max_points: 10,
    point_loss_per_gap: 1,
    unit: 'buts'
  },
  {
    code: SPECIAL_PREDICTION_CODES.DRAW_COUNT,
    matchday: SPECIAL_MATCHDAYS.FIRST,
    label: 'Nombre de matchs nuls',
    description: 'Combien de matchs nuls y aura-t-il lors de la première journée complète (24 matchs) ?',
    max_points: 5,
    point_loss_per_gap: 1,
    unit: 'matchs nuls'
  },
  {
    code: SPECIAL_PREDICTION_CODES.CLEAN_SHEET_COUNT,
    matchday: SPECIAL_MATCHDAYS.FIRST,
    label: 'Nombre de clean sheets',
    description: 'Combien d’équipes termineront leur premier match sans encaisser de but lors de la première journée complète (24 matchs) ?',
    max_points: 5,
    point_loss_per_gap: 1,
    unit: 'clean sheets'
  }
];

const SECOND_MATCHDAY_SPECIAL_DEFINITIONS = [
  {
    code: SPECIAL_PREDICTION_CODES.SECOND_TOTAL_GOALS,
    matchday: SPECIAL_MATCHDAYS.SECOND,
    label: 'Nombre total de buts J2',
    description: 'Combien de buts seront marqués lors de la deuxième journée complète (24 matchs) ?',
    max_points: 10,
    point_loss_per_gap: 1,
    unit: 'buts'
  },
  {
    code: SPECIAL_PREDICTION_CODES.SECOND_SIX_POINT_TEAMS,
    matchday: SPECIAL_MATCHDAYS.SECOND,
    label: 'Équipes à 6 points',
    description: 'Combien d’équipes auront gagné leurs deux premiers matchs après la deuxième journée ? Cette question tient compte des 24 matchs de J1 et des 24 matchs de J2.',
    max_points: 5,
    point_loss_per_gap: 1,
    unit: 'équipes'
  },
  {
    code: SPECIAL_PREDICTION_CODES.SECOND_BOTH_TEAMS_SCORE_COUNT,
    matchday: SPECIAL_MATCHDAYS.SECOND,
    label: 'Les deux équipes marquent sur J2',
    description: 'Sur les 24 matchs de la deuxième journée, combien verront les deux équipes marquer au moins un but ?',
    max_points: 5,
    point_loss_per_gap: 1,
    unit: 'matchs'
  }
];

// Backward-compatible name: first matchday definitions only.
const SPECIAL_PREDICTION_DEFINITIONS = FIRST_MATCHDAY_SPECIAL_DEFINITIONS;
const ALL_SPECIAL_PREDICTION_DEFINITIONS = [
  ...FIRST_MATCHDAY_SPECIAL_DEFINITIONS,
  ...SECOND_MATCHDAY_SPECIAL_DEFINITIONS
];

const MATCHDAY_DEFINITIONS = {
  [SPECIAL_MATCHDAYS.FIRST]: FIRST_MATCHDAY_SPECIAL_DEFINITIONS,
  [SPECIAL_MATCHDAYS.SECOND]: SECOND_MATCHDAY_SPECIAL_DEFINITIONS
};

const normalizeSpecialMatchday = (value = SPECIAL_MATCHDAYS.FIRST) => {
  const matchday = Number(value || SPECIAL_MATCHDAYS.FIRST);
  return matchday === SPECIAL_MATCHDAYS.SECOND ? SPECIAL_MATCHDAYS.SECOND : SPECIAL_MATCHDAYS.FIRST;
};

const getSpecialMatchdayDefinitions = (matchday = SPECIAL_MATCHDAYS.FIRST) => (
  MATCHDAY_DEFINITIONS[normalizeSpecialMatchday(matchday)] || FIRST_MATCHDAY_SPECIAL_DEFINITIONS
);

const ensureSpecialPredictionsTable = async (clientOrPool) => {
  await clientOrPool.query(`
    CREATE TABLE IF NOT EXISTS special_predictions (
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code varchar(80) NOT NULL,
      predicted_value integer NOT NULL,
      points integer,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, code)
    )
  `);

  await clientOrPool.query('CREATE INDEX IF NOT EXISTS idx_special_predictions_code ON special_predictions(code)');
};

const MATCHDAY_MATCHES_CTE = `
  WITH assigned_matches AS (
    SELECT
      m.id,
      m.start_time,
      m.team1_id,
      m.team2_id,
      r.team1_goals,
      r.team2_goals
    FROM matches m
    LEFT JOIN results r ON r.match_id = m.id
    WHERE m.team1_id IS NOT NULL
      AND m.team2_id IS NOT NULL
      AND m.id <= 72
  ),
  team_appearances AS (
    SELECT
      team_id,
      id AS match_id,
      ROW_NUMBER() OVER (PARTITION BY team_id ORDER BY start_time ASC NULLS LAST, id ASC) AS appearance_number
    FROM (
      SELECT team1_id AS team_id, id, start_time FROM assigned_matches
      UNION ALL
      SELECT team2_id AS team_id, id, start_time FROM assigned_matches
    ) team_matches
    WHERE team_id IS NOT NULL
  ),
  match_appearances AS (
    SELECT DISTINCT
      am.id,
      am.start_time,
      am.team1_id,
      am.team2_id,
      am.team1_goals,
      am.team2_goals,
      GREATEST(t1.appearance_number, t2.appearance_number) AS matchday
    FROM assigned_matches am
    JOIN team_appearances t1 ON t1.match_id = am.id AND t1.team_id = am.team1_id
    JOIN team_appearances t2 ON t2.match_id = am.id AND t2.team_id = am.team2_id
  )
`;

const getSpecialMatchdayMatches = async (clientOrPool, matchday = SPECIAL_MATCHDAYS.FIRST) => {
  const normalizedMatchday = normalizeSpecialMatchday(matchday);
  const result = await clientOrPool.query(`
    ${MATCHDAY_MATCHES_CTE}
    SELECT id, start_time, team1_id, team2_id, team1_goals, team2_goals
    FROM match_appearances
    WHERE matchday = $1
    ORDER BY start_time ASC NULLS LAST, id ASC
  `, [normalizedMatchday]);

  return result.rows;
};

const getSpecialMatchesUntilMatchday = async (clientOrPool, matchday = SPECIAL_MATCHDAYS.FIRST) => {
  const normalizedMatchday = normalizeSpecialMatchday(matchday);
  const result = await clientOrPool.query(`
    ${MATCHDAY_MATCHES_CTE}
    SELECT id, start_time, team1_id, team2_id, team1_goals, team2_goals, matchday
    FROM match_appearances
    WHERE matchday <= $1
    ORDER BY start_time ASC NULLS LAST, id ASC
  `, [normalizedMatchday]);

  return result.rows;
};

const getSpecialMatchdayDeadline = async (clientOrPool, matchday = SPECIAL_MATCHDAYS.FIRST) => {
  const normalizedMatchday = normalizeSpecialMatchday(matchday);
  const result = await clientOrPool.query(`
    ${MATCHDAY_MATCHES_CTE}
    SELECT
      to_char(MIN(start_time), 'YYYY-MM-DD"T"HH24:MI:SS') AS first_match_time,
      CASE
        WHEN MIN(start_time) IS NULL THEN false
        ELSE (MIN(start_time) AT TIME ZONE 'Europe/Brussels') <= NOW()
      END AS locked
    FROM match_appearances
    WHERE matchday = $1
  `, [normalizedMatchday]);

  return {
    first_match_time: result.rows[0]?.first_match_time || null,
    locked: Boolean(result.rows[0]?.locked)
  };
};

const getFirstMatchdayMatches = (clientOrPool) => getSpecialMatchdayMatches(clientOrPool, SPECIAL_MATCHDAYS.FIRST);
const getFirstMatchdayDeadline = (clientOrPool) => getSpecialMatchdayDeadline(clientOrPool, SPECIAL_MATCHDAYS.FIRST);

const isMatchResultEncoded = (match) => (
  match.team1_goals !== null &&
  match.team1_goals !== undefined &&
  match.team2_goals !== null &&
  match.team2_goals !== undefined
);

const getEmptyActualValues = (definitions) => Object.fromEntries(definitions.map(definition => [definition.code, null]));

const calculateSixPointTeams = (matchesUntilSecondMatchday) => {
  const stats = new Map();
  const ensureTeam = (teamId) => {
    const key = Number(teamId);
    if (!stats.has(key)) stats.set(key, { played: 0, points: 0 });
    return stats.get(key);
  };

  matchesUntilSecondMatchday.filter(isMatchResultEncoded).forEach(match => {
    const team1 = ensureTeam(match.team1_id);
    const team2 = ensureTeam(match.team2_id);
    const goals1 = Number(match.team1_goals);
    const goals2 = Number(match.team2_goals);

    team1.played += 1;
    team2.played += 1;

    if (goals1 > goals2) {
      team1.points += 3;
    } else if (goals2 > goals1) {
      team2.points += 3;
    } else {
      team1.points += 1;
      team2.points += 1;
    }
  });

  return Array.from(stats.values()).filter(team => team.played >= 2 && team.points === 6).length;
};

const calculateValuesFromEncodedMatches = (matchday, matches, matchesUntilMatchday = matches) => {
  const normalizedMatchday = normalizeSpecialMatchday(matchday);
  let totalGoals = 0;
  let drawCount = 0;
  let cleanSheetCount = 0;
  let bothTeamsScoreCount = 0;

  matches.forEach(match => {
    const team1Goals = Number(match.team1_goals);
    const team2Goals = Number(match.team2_goals);

    totalGoals += team1Goals + team2Goals;

    if (team1Goals === team2Goals) drawCount += 1;
    if (team1Goals === 0) cleanSheetCount += 1;
    if (team2Goals === 0) cleanSheetCount += 1;
    if (team1Goals > 0 && team2Goals > 0) bothTeamsScoreCount += 1;
  });

  if (normalizedMatchday === SPECIAL_MATCHDAYS.SECOND) {
    return {
      [SPECIAL_PREDICTION_CODES.SECOND_TOTAL_GOALS]: totalGoals,
      [SPECIAL_PREDICTION_CODES.SECOND_SIX_POINT_TEAMS]: calculateSixPointTeams(matchesUntilMatchday),
      [SPECIAL_PREDICTION_CODES.SECOND_BOTH_TEAMS_SCORE_COUNT]: bothTeamsScoreCount
    };
  }

  return {
    [SPECIAL_PREDICTION_CODES.TOTAL_GOALS]: totalGoals,
    [SPECIAL_PREDICTION_CODES.DRAW_COUNT]: drawCount,
    [SPECIAL_PREDICTION_CODES.CLEAN_SHEET_COUNT]: cleanSheetCount
  };
};

const calculateActualValuesFromMatches = (matchday, matches, definitions, matchesUntilMatchday = matches) => {
  const encodedMatches = matches.filter(isMatchResultEncoded);
  const encodedUntilMatchday = matchesUntilMatchday.filter(isMatchResultEncoded);
  const requiresContextComplete = normalizeSpecialMatchday(matchday) === SPECIAL_MATCHDAYS.SECOND;
  const complete = matches.length > 0
    && encodedMatches.length === matches.length
    && (!requiresContextComplete || encodedUntilMatchday.length === matchesUntilMatchday.length);
  const currentValues = calculateValuesFromEncodedMatches(matchday, encodedMatches, encodedUntilMatchday);

  return {
    complete,
    values: complete ? currentValues : getEmptyActualValues(definitions),
    current_values: currentValues,
    completed_matches: encodedMatches.length,
    total_matches: matches.length
  };
};

const getSpecialMatchdayStatus = async (clientOrPool, matchday = SPECIAL_MATCHDAYS.FIRST) => {
  const normalizedMatchday = normalizeSpecialMatchday(matchday);
  const definitions = getSpecialMatchdayDefinitions(normalizedMatchday);
  const [matches, deadline, matchesUntilMatchday] = await Promise.all([
    getSpecialMatchdayMatches(clientOrPool, normalizedMatchday),
    getSpecialMatchdayDeadline(clientOrPool, normalizedMatchday),
    getSpecialMatchesUntilMatchday(clientOrPool, normalizedMatchday)
  ]);
  const actual = calculateActualValuesFromMatches(normalizedMatchday, matches, definitions, matchesUntilMatchday);

  return {
    matchday: normalizedMatchday,
    definitions,
    matches,
    deadline: deadline.first_match_time,
    locked: deadline.locked,
    complete: actual.complete,
    actual: actual.values,
    current_actual: actual.current_values,
    completed_matches: actual.completed_matches,
    total_matches: actual.total_matches
  };
};

const getFirstMatchdayStatus = (clientOrPool) => getSpecialMatchdayStatus(clientOrPool, SPECIAL_MATCHDAYS.FIRST);

const calculateSpecialPredictionPoints = (predictedValue, actualValue, maxPoints, pointLossPerGap = 1) => {
  if (predictedValue === null || predictedValue === undefined || actualValue === null || actualValue === undefined) return null;

  const predicted = Number(predictedValue);
  const actual = Number(actualValue);

  if (!Number.isInteger(predicted) || !Number.isInteger(actual)) return null;

  const gap = Math.abs(predicted - actual);
  return Math.max(0, Number(maxPoints) - gap * Number(pointLossPerGap || 1));
};

const buildSpecialPredictionScoring = (predictionRows, actualValues, definitions = SPECIAL_PREDICTION_DEFINITIONS) => {
  const predictionMap = new Map(predictionRows.map(row => [row.code, row]));
  const details = {};
  let points = 0;

  definitions.forEach(definition => {
    const row = predictionMap.get(definition.code);
    const actualValue = actualValues?.[definition.code];
    const earnedPoints = calculateSpecialPredictionPoints(
      row?.predicted_value,
      actualValue,
      definition.max_points,
      definition.point_loss_per_gap
    );

    details[definition.code] = {
      predicted_value: row?.predicted_value ?? null,
      actual_value: actualValue ?? null,
      points: earnedPoints,
      max_points: definition.max_points
    };

    points += earnedPoints || 0;
  });

  return { points, details };
};

const recalculateSpecialPredictionPointsForMatchday = async (clientOrPool, matchday = SPECIAL_MATCHDAYS.FIRST) => {
  await ensureSpecialPredictionsTable(clientOrPool);
  const status = await getSpecialMatchdayStatus(clientOrPool, matchday);
  const definitions = getSpecialMatchdayDefinitions(matchday);
  const codes = definitions.map(definition => definition.code);

  if (!status.complete) {
    await clientOrPool.query('UPDATE special_predictions SET points = NULL WHERE code = ANY($1::varchar[])', [codes]);
    return { matchday: status.matchday, complete: false, actual: status.actual, current_actual: status.current_actual, updated: 0 };
  }

  const predictionResult = await clientOrPool.query(
    'SELECT user_id, code, predicted_value FROM special_predictions WHERE code = ANY($1::varchar[])',
    [codes]
  );

  let updated = 0;
  for (const row of predictionResult.rows) {
    const definition = definitions.find(item => item.code === row.code);
    if (!definition) continue;

    const points = calculateSpecialPredictionPoints(row.predicted_value, status.actual[row.code], definition.max_points, definition.point_loss_per_gap);

    await clientOrPool.query(
      `UPDATE special_predictions
       SET points = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND code = $3`,
      [points, row.user_id, row.code]
    );
    updated += 1;
  }

  return { matchday: status.matchday, complete: true, actual: status.actual, current_actual: status.current_actual, updated };
};

const recalculateAllSpecialPredictionPoints = async (clientOrPool) => {
  const first = await recalculateSpecialPredictionPointsForMatchday(clientOrPool, SPECIAL_MATCHDAYS.FIRST);
  const second = await recalculateSpecialPredictionPointsForMatchday(clientOrPool, SPECIAL_MATCHDAYS.SECOND);
  return { first, second };
};

const recalculateFirstMatchdaySpecialPredictionPoints = (clientOrPool) => recalculateSpecialPredictionPointsForMatchday(clientOrPool, SPECIAL_MATCHDAYS.FIRST);

const normalizeSpecialPredictionValue = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized < 0 || normalized > 300) return undefined;
  return normalized;
};

const getAllSpecialPredictionScores = async (clientOrPool) => {
  await ensureSpecialPredictionsTable(clientOrPool);
  const [firstStatus, secondStatus] = await Promise.all([
    getSpecialMatchdayStatus(clientOrPool, SPECIAL_MATCHDAYS.FIRST),
    getSpecialMatchdayStatus(clientOrPool, SPECIAL_MATCHDAYS.SECOND)
  ]);
  const actual = { ...firstStatus.actual, ...secondStatus.actual };
  const currentActual = { ...firstStatus.current_actual, ...secondStatus.current_actual };
  const codes = ALL_SPECIAL_PREDICTION_DEFINITIONS.map(definition => definition.code);
  const result = await clientOrPool.query('SELECT * FROM special_predictions WHERE code = ANY($1::varchar[])', [codes]);

  const rowsByUser = new Map();
  result.rows.forEach(row => {
    const userId = Number(row.user_id);
    if (!rowsByUser.has(userId)) rowsByUser.set(userId, []);
    rowsByUser.get(userId).push(row);
  });

  const scores = new Map();
  rowsByUser.forEach((rows, userId) => {
    scores.set(userId, buildSpecialPredictionScoring(rows, actual, ALL_SPECIAL_PREDICTION_DEFINITIONS));
  });

  return {
    actual,
    current_actual: currentActual,
    complete: firstStatus.complete && secondStatus.complete,
    scores
  };
};

module.exports = {
  SPECIAL_MATCHDAYS,
  SPECIAL_PREDICTION_CODES,
  SPECIAL_PREDICTION_DEFINITIONS,
  FIRST_MATCHDAY_SPECIAL_DEFINITIONS,
  SECOND_MATCHDAY_SPECIAL_DEFINITIONS,
  ALL_SPECIAL_PREDICTION_DEFINITIONS,
  ensureSpecialPredictionsTable,
  getSpecialMatchdayDefinitions,
  getSpecialMatchdayMatches,
  getSpecialMatchdayStatus,
  getFirstMatchdayMatches,
  getFirstMatchdayStatus,
  calculateSpecialPredictionPoints,
  buildSpecialPredictionScoring,
  recalculateSpecialPredictionPointsForMatchday,
  recalculateAllSpecialPredictionPoints,
  recalculateFirstMatchdaySpecialPredictionPoints,
  normalizeSpecialPredictionValue,
  getAllSpecialPredictionScores
};
