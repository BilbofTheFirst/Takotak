const SPECIAL_PREDICTION_CODES = {
  TOTAL_GOALS: 'FIRST_MATCHDAY_TOTAL_GOALS',
  DRAW_COUNT: 'FIRST_MATCHDAY_DRAW_COUNT',
  CLEAN_SHEET_COUNT: 'FIRST_MATCHDAY_CLEAN_SHEET_COUNT'
};

const SPECIAL_PREDICTION_DEFINITIONS = [
  {
    code: SPECIAL_PREDICTION_CODES.TOTAL_GOALS,
    label: 'Nombre total de buts',
    description: 'Combien de buts seront marqués lors de la première journée complète (24 matchs) ?',
    max_points: 10,
    point_loss_per_gap: 1,
    unit: 'buts'
  },
  {
    code: SPECIAL_PREDICTION_CODES.DRAW_COUNT,
    label: 'Nombre de matchs nuls',
    description: 'Combien de matchs nuls y aura-t-il lors de la première journée complète (24 matchs) ?',
    max_points: 5,
    point_loss_per_gap: 1,
    unit: 'matchs nuls'
  },
  {
    code: SPECIAL_PREDICTION_CODES.CLEAN_SHEET_COUNT,
    label: 'Nombre de clean sheets',
    description: 'Combien d’équipes termineront leur premier match sans encaisser de but lors de la première journée complète (24 matchs) ?',
    max_points: 5,
    point_loss_per_gap: 1,
    unit: 'clean sheets'
  }
];

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

const getFirstMatchdayMatches = async (clientOrPool) => {
  const result = await clientOrPool.query(`
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
    ),
    team_first_matches AS (
      SELECT DISTINCT ON (team_id)
        team_id,
        id AS match_id
      FROM (
        SELECT team1_id AS team_id, id, start_time FROM assigned_matches
        UNION ALL
        SELECT team2_id AS team_id, id, start_time FROM assigned_matches
      ) team_matches
      WHERE team_id IS NOT NULL
      ORDER BY team_id, start_time ASC NULLS LAST, id ASC
    )
    SELECT DISTINCT
      am.id,
      am.start_time,
      am.team1_id,
      am.team2_id,
      am.team1_goals,
      am.team2_goals
    FROM assigned_matches am
    JOIN team_first_matches tfm ON tfm.match_id = am.id
    ORDER BY am.start_time ASC NULLS LAST, am.id ASC
  `);

  return result.rows;
};

const getFirstMatchdayDeadline = async (clientOrPool) => {
  const result = await clientOrPool.query(`
    WITH assigned_matches AS (
      SELECT m.id, m.start_time, m.team1_id, m.team2_id
      FROM matches m
      WHERE m.team1_id IS NOT NULL
        AND m.team2_id IS NOT NULL
    ),
    team_first_matches AS (
      SELECT DISTINCT ON (team_id)
        team_id,
        id AS match_id
      FROM (
        SELECT team1_id AS team_id, id, start_time FROM assigned_matches
        UNION ALL
        SELECT team2_id AS team_id, id, start_time FROM assigned_matches
      ) team_matches
      WHERE team_id IS NOT NULL
      ORDER BY team_id, start_time ASC NULLS LAST, id ASC
    ),
    first_matchday AS (
      SELECT DISTINCT am.id, am.start_time
      FROM assigned_matches am
      JOIN team_first_matches tfm ON tfm.match_id = am.id
    )
    SELECT
      to_char(MIN(start_time), 'YYYY-MM-DD"T"HH24:MI:SS') AS first_match_time,
      CASE
        WHEN MIN(start_time) IS NULL THEN false
        ELSE (MIN(start_time) AT TIME ZONE 'Europe/Brussels') <= NOW()
      END AS locked
    FROM first_matchday
  `);

  return {
    first_match_time: result.rows[0]?.first_match_time || null,
    locked: Boolean(result.rows[0]?.locked)
  };
};

const isMatchResultEncoded = (match) => (
  match.team1_goals !== null &&
  match.team1_goals !== undefined &&
  match.team2_goals !== null &&
  match.team2_goals !== undefined
);

const EMPTY_ACTUAL_VALUES = Object.fromEntries(SPECIAL_PREDICTION_DEFINITIONS.map(definition => [definition.code, null]));

const calculateValuesFromEncodedMatches = (matches) => {
  let totalGoals = 0;
  let drawCount = 0;
  let cleanSheetCount = 0;

  matches.forEach(match => {
    const team1Goals = Number(match.team1_goals);
    const team2Goals = Number(match.team2_goals);

    totalGoals += team1Goals + team2Goals;

    if (team1Goals === team2Goals) {
      drawCount += 1;
    }

    if (team1Goals === 0) {
      cleanSheetCount += 1;
    }

    if (team2Goals === 0) {
      cleanSheetCount += 1;
    }
  });

  return {
    [SPECIAL_PREDICTION_CODES.TOTAL_GOALS]: totalGoals,
    [SPECIAL_PREDICTION_CODES.DRAW_COUNT]: drawCount,
    [SPECIAL_PREDICTION_CODES.CLEAN_SHEET_COUNT]: cleanSheetCount
  };
};

const calculateActualValuesFromMatches = (matches) => {
  const encodedMatches = matches.filter(isMatchResultEncoded);
  const complete = matches.length > 0 && encodedMatches.length === matches.length;
  const currentValues = calculateValuesFromEncodedMatches(encodedMatches);

  return {
    complete,
    values: complete ? currentValues : EMPTY_ACTUAL_VALUES,
    current_values: currentValues,
    completed_matches: encodedMatches.length,
    total_matches: matches.length
  };
};

const getFirstMatchdayStatus = async (clientOrPool) => {
  const [matches, deadline] = await Promise.all([
    getFirstMatchdayMatches(clientOrPool),
    getFirstMatchdayDeadline(clientOrPool)
  ]);
  const actual = calculateActualValuesFromMatches(matches);

  return {
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

const calculateSpecialPredictionPoints = (predictedValue, actualValue, maxPoints, pointLossPerGap = 1) => {
  if (predictedValue === null || predictedValue === undefined || actualValue === null || actualValue === undefined) {
    return null;
  }

  const predicted = Number(predictedValue);
  const actual = Number(actualValue);

  if (!Number.isInteger(predicted) || !Number.isInteger(actual)) {
    return null;
  }

  const gap = Math.abs(predicted - actual);
  return Math.max(0, Number(maxPoints) - gap * Number(pointLossPerGap || 1));
};

const buildSpecialPredictionScoring = (predictionRows, actualValues) => {
  const predictionMap = new Map(predictionRows.map(row => [row.code, row]));
  const details = {};
  let points = 0;

  SPECIAL_PREDICTION_DEFINITIONS.forEach(definition => {
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

const recalculateFirstMatchdaySpecialPredictionPoints = async (clientOrPool) => {
  await ensureSpecialPredictionsTable(clientOrPool);
  const status = await getFirstMatchdayStatus(clientOrPool);
  const codes = SPECIAL_PREDICTION_DEFINITIONS.map(definition => definition.code);

  if (!status.complete) {
    await clientOrPool.query(
      'UPDATE special_predictions SET points = NULL WHERE code = ANY($1::varchar[])',
      [codes]
    );
    return { complete: false, actual: status.actual, current_actual: status.current_actual, updated: 0 };
  }

  const predictionResult = await clientOrPool.query(
    'SELECT user_id, code, predicted_value FROM special_predictions WHERE code = ANY($1::varchar[])',
    [codes]
  );

  let updated = 0;
  for (const row of predictionResult.rows) {
    const definition = SPECIAL_PREDICTION_DEFINITIONS.find(item => item.code === row.code);
    if (!definition) continue;

    const points = calculateSpecialPredictionPoints(
      row.predicted_value,
      status.actual[row.code],
      definition.max_points,
      definition.point_loss_per_gap
    );

    await clientOrPool.query(
      `UPDATE special_predictions
       SET points = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND code = $3`,
      [points, row.user_id, row.code]
    );
    updated += 1;
  }

  return { complete: true, actual: status.actual, current_actual: status.current_actual, updated };
};

const normalizeSpecialPredictionValue = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized < 0 || normalized > 300) return undefined;
  return normalized;
};

const getAllSpecialPredictionScores = async (clientOrPool) => {
  await ensureSpecialPredictionsTable(clientOrPool);
  const status = await getFirstMatchdayStatus(clientOrPool);
  const codes = SPECIAL_PREDICTION_DEFINITIONS.map(definition => definition.code);
  const result = await clientOrPool.query(
    'SELECT * FROM special_predictions WHERE code = ANY($1::varchar[])',
    [codes]
  );

  const rowsByUser = new Map();
  result.rows.forEach(row => {
    const userId = Number(row.user_id);
    if (!rowsByUser.has(userId)) rowsByUser.set(userId, []);
    rowsByUser.get(userId).push(row);
  });

  const scores = new Map();
  rowsByUser.forEach((rows, userId) => {
    scores.set(userId, buildSpecialPredictionScoring(rows, status.actual));
  });

  return { actual: status.actual, current_actual: status.current_actual, complete: status.complete, scores };
};

module.exports = {
  SPECIAL_PREDICTION_CODES,
  SPECIAL_PREDICTION_DEFINITIONS,
  ensureSpecialPredictionsTable,
  getFirstMatchdayMatches,
  getFirstMatchdayStatus,
  calculateSpecialPredictionPoints,
  buildSpecialPredictionScoring,
  recalculateFirstMatchdaySpecialPredictionPoints,
  normalizeSpecialPredictionValue,
  getAllSpecialPredictionScores
};
