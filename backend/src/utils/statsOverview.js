const { getAllBonusScores } = require('./bonusScoring');
const { getAllSpecialPredictionScores } = require('./specialPredictions');

let cachedOverview = null;
let cachedAt = null;

const POINT_BREAKDOWN_CATEGORIES = [
  { key: 'matchday1', label: 'Matchs J1', icon: '1️⃣' },
  { key: 'matchday2', label: 'Matchs J2', icon: '2️⃣' },
  { key: 'matchday3', label: 'Matchs J3', icon: '3️⃣' },
  { key: 'knockout', label: 'Phase finale', icon: '🏟️' },
  { key: 'special', label: 'Spéciaux', icon: '⚡' },
  { key: 'bonus', label: 'Bonus', icon: '🎁' }
];

const buildAvatarUrl = (user) => {
  if (!user?.avatar_data) return null;
  const rawVersion = user.avatar_updated_at ? new Date(user.avatar_updated_at).getTime() : Date.now();
  const version = Number.isNaN(rawVersion) ? Date.now() : rawVersion;
  return `/profile/users/${user.id}/avatar?v=${version}`;
};

const number = (value) => Number(value || 0);
const round = (value, digits = 1) => Number(Number(value || 0).toFixed(digits));
const percent = (value, total) => total > 0 ? Math.round((number(value) / total) * 100) : 0;

const sortByValue = (rows, field) => [...rows].sort((a, b) => number(b[field]) - number(a[field]) || a.username.localeCompare(b.username, 'fr'));

const publicUser = (user) => user ? ({
  id: Number(user.id),
  username: user.username,
  avatar_url: user.avatar_url || buildAvatarUrl(user)
}) : null;

const emptyPointBreakdown = () => Object.fromEntries(POINT_BREAKDOWN_CATEGORIES.map(category => [category.key, 0]));

const resolveAward = ({ code, title, icon, definition, unit, rows, field, minValue = 1, decimals = 0 }) => {
  const candidates = rows.filter(row => Number.isFinite(number(row[field])));
  const maxValue = candidates.reduce((max, row) => Math.max(max, number(row[field])), 0);
  const winners = maxValue >= minValue ? candidates.filter(row => number(row[field]) === maxValue) : candidates;

  if (!candidates.length) {
    return { code, title, icon, definition, unit, status: 'empty', value: 0, winners: [], tie_count: 0 };
  }

  if (maxValue < minValue || winners.length !== 1) {
    return {
      code,
      title,
      icon,
      definition,
      unit,
      status: 'tie',
      value: round(maxValue, decimals),
      winners: winners.slice(0, 6).map(publicUser),
      tie_count: winners.length
    };
  }

  return {
    code,
    title,
    icon,
    definition,
    unit,
    status: 'winner',
    value: round(maxValue, decimals),
    winner: publicUser(winners[0]),
    winners: winners.map(publicUser),
    tie_count: 1
  };
};

const getOutcome = (home, away) => {
  if (number(home) > number(away)) return 'home';
  if (number(home) < number(away)) return 'away';
  return 'draw';
};

const buildCompetitionDayMap = (matches) => {
  const byMatch = {};
  const appearances = {};

  matches
    .filter(match => Number(match.id) <= 72 && match.team1 && match.team2)
    .slice()
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time) || Number(a.id) - Number(b.id))
    .forEach(match => {
      const team1Day = (appearances[match.team1] || 0) + 1;
      const team2Day = (appearances[match.team2] || 0) + 1;
      byMatch[Number(match.id)] = team1Day === team2Day ? team1Day : Math.max(team1Day, team2Day);
      appearances[match.team1] = team1Day;
      appearances[match.team2] = team2Day;
    });

  return byMatch;
};

const getMatchPointCategory = (match, competitionDayByMatch) => {
  if (!match) return 'knockout';
  if (Number(match.id) > 72) return 'knockout';
  const day = Number(competitionDayByMatch[Number(match.id)] || 0);
  if (day === 1) return 'matchday1';
  if (day === 2) return 'matchday2';
  if (day === 3) return 'matchday3';
  return 'matchday1';
};

const computeStreaks = (users, orderedMatches, scoreRows) => {
  const points = new Map();
  scoreRows.forEach(row => points.set(`${Number(row.user_id)}:${Number(row.match_id)}`, number(row.points)));

  users.forEach(user => {
    let current = 0;
    let best = 0;
    let currentExact = 0;
    let bestExact = 0;

    orderedMatches.forEach(match => {
      const score = number(points.get(`${user.id}:${match.id}`));
      const gainedPoint = score > 0;
      const exactScore = score === 3;

      current = gainedPoint ? current + 1 : 0;
      best = Math.max(best, current);

      currentExact = exactScore ? currentExact + 1 : 0;
      bestExact = Math.max(bestExact, currentExact);
    });

    user.current_streak = current;
    user.best_streak = best;
    user.current_exact_streak = currentExact;
    user.best_exact_streak = bestExact;
  });
};

const buildScoreDistribution = (predictionRows) => {
  const byScore = new Map();
  predictionRows.forEach(row => {
    const key = `${number(row.team1_goals)}-${number(row.team2_goals)}`;
    byScore.set(key, (byScore.get(key) || 0) + 1);
  });

  return [...byScore.entries()]
    .map(([score, count]) => ({ score, count }))
    .sort((a, b) => b.count - a.count || a.score.localeCompare(b.score));
};

const buildCommunityMatches = (finishedMatches, predictionRows, scoreRows) => {
  const predictionsByMatch = new Map();
  predictionRows.forEach(row => {
    const id = Number(row.match_id);
    if (!predictionsByMatch.has(id)) predictionsByMatch.set(id, []);
    predictionsByMatch.get(id).push(row);
  });

  const scoresByMatch = new Map();
  scoreRows.forEach(row => {
    const id = Number(row.match_id);
    if (!scoresByMatch.has(id)) scoresByMatch.set(id, []);
    scoresByMatch.get(id).push(row);
  });

  return finishedMatches.map(match => {
    const predictions = predictionsByMatch.get(match.id) || [];
    const scores = scoresByMatch.get(match.id) || [];
    const total = predictions.length;
    const scoreDistribution = buildScoreDistribution(predictions);
    const predictedOutcomes = predictions.reduce((acc, prediction) => {
      acc[getOutcome(prediction.team1_goals, prediction.team2_goals)] += 1;
      return acc;
    }, { home: 0, draw: 0, away: 0 });
    const exactCount = predictions.filter(prediction =>
      number(prediction.team1_goals) === number(match.team1_goals) &&
      number(prediction.team2_goals) === number(match.team2_goals)
    ).length;
    const zeroCount = scores.filter(score => number(score.points) === 0).length;
    const avgPoints = scores.length ? scores.reduce((sum, score) => sum + number(score.points), 0) / scores.length : 0;
    const mostPopularOutcomeCount = Math.max(predictedOutcomes.home, predictedOutcomes.draw, predictedOutcomes.away);

    return {
      match_id: match.id,
      label: `${match.team1 || 'Équipe 1'} - ${match.team2 || 'Équipe 2'}`,
      result: `${match.team1_goals}-${match.team2_goals}`,
      date: match.start_time,
      total_predictions: total,
      exact_count: exactCount,
      exact_percent: percent(exactCount, total),
      zero_count: zeroCount,
      zero_percent: percent(zeroCount, scores.length || total),
      average_points: round(avgPoints, 2),
      consensus_percent: percent(mostPopularOutcomeCount, total),
      most_predicted_score: scoreDistribution[0] || null,
      predicted_outcomes: {
        home: { count: predictedOutcomes.home, percent: percent(predictedOutcomes.home, total) },
        draw: { count: predictedOutcomes.draw, percent: percent(predictedOutcomes.draw, total) },
        away: { count: predictedOutcomes.away, percent: percent(predictedOutcomes.away, total) }
      }
    };
  });
};

const buildCommunityProfiles = (users, predictionRows, scoreRows, communityMatches) => {
  const profilesByUser = new Map(users.map(user => [Number(user.id), {
    ...publicUser(user),
    total_predictions: 0,
    consensus_predictions: 0,
    contrarian_predictions: 0,
    bold_hits: 0
  }]));
  const matchById = new Map(communityMatches.map(match => [Number(match.match_id), match]));
  const scoreByUserMatch = new Map(scoreRows.map(row => [`${Number(row.user_id)}:${Number(row.match_id)}`, number(row.points)]));

  predictionRows.forEach(prediction => {
    const userId = Number(prediction.user_id);
    const matchId = Number(prediction.match_id);
    const profile = profilesByUser.get(userId);
    const match = matchById.get(matchId);
    if (!profile || !match || !match.total_predictions) return;

    const predictedOutcome = getOutcome(prediction.team1_goals, prediction.team2_goals);
    const counts = {
      home: number(match.predicted_outcomes?.home?.count),
      draw: number(match.predicted_outcomes?.draw?.count),
      away: number(match.predicted_outcomes?.away?.count)
    };
    const majorityCount = Math.max(counts.home, counts.draw, counts.away);
    const followsGroup = counts[predictedOutcome] === majorityCount;
    const points = scoreByUserMatch.get(`${userId}:${matchId}`) || 0;

    profile.total_predictions += 1;
    if (followsGroup) profile.consensus_predictions += 1;
    else {
      profile.contrarian_predictions += 1;
      if (points > 0) profile.bold_hits += 1;
    }
  });

  const profiles = [...profilesByUser.values()]
    .map(profile => ({
      ...profile,
      consensus_rate: percent(profile.consensus_predictions, profile.total_predictions),
      contrarian_rate: percent(profile.contrarian_predictions, profile.total_predictions)
    }))
    .filter(profile => profile.total_predictions > 0)
    .sort((a, b) => number(b.total_predictions) - number(a.total_predictions) || a.username.localeCompare(b.username, 'fr'));

  const minPredictions = Math.max(2, Math.min(5, Math.ceil((communityMatches.length || 0) * 0.35)));
  const eligible = profiles.filter(profile => profile.total_predictions >= minPredictions);
  const mouton = [...eligible].sort((a, b) => number(b.consensus_rate) - number(a.consensus_rate) || number(b.total_predictions) - number(a.total_predictions))[0] || null;
  const contrarian = [...eligible].sort((a, b) => number(b.contrarian_rate) - number(a.contrarian_rate) || number(b.total_predictions) - number(a.total_predictions))[0] || null;
  const boldPlayer = [...eligible].sort((a, b) => number(b.bold_hits) - number(a.bold_hits) || number(b.contrarian_rate) - number(a.contrarian_rate))[0] || null;

  return { profiles, mouton, contrarian, bold_player: boldPlayer, min_predictions: minPredictions };
};

const buildBadges = (user, context) => {
  const badges = [];
  if (number(user.best_exact_streak) >= 3) badges.push({ code: 'sniper', icon: '🎯', title: 'Sniper', description: '3 scores exacts consécutifs.' });
  if (number(user.exact_scores) >= 5) badges.push({ code: 'elite_sniper', icon: '🏹', title: 'Tireur d’élite', description: 'Au moins 5 scores exacts au total.' });
  if (number(user.best_streak) >= 3) badges.push({ code: 'hot_streak', icon: '🔥', title: 'Série chaude', description: `Points sur ${user.best_streak} matchs d’affilée.` });
  if (number(user.draw_hits) >= 2) badges.push({ code: 'draw_king', icon: '🤝', title: 'Roi du nul', description: 'Plusieurs matchs nuls bien lus.' });
  if (number(user.near_misses) >= 3) badges.push({ code: 'nearly_there', icon: '🐈‍⬛', title: 'Presque...', description: 'Souvent à un but du score exact.' });
  if (context.finishedMatches > 0 && number(user.scored_predictions) >= context.finishedMatches) badges.push({ code: 'assidu', icon: '🧱', title: 'Assidu', description: 'Présent sur tous les matchs scorés.' });
  if (number(user.bonus_points) > 0) badges.push({ code: 'strategist', icon: '🎁', title: 'Stratège', description: 'Des points marqués via les bonus.' });
  if (number(user.special_points) > 0) badges.push({ code: 'specialist', icon: '⚡', title: 'Spécialiste journée', description: 'Des points marqués sur les pronostics spéciaux de journée.' });
  if (number(user.rank) <= 3 && number(user.total_points) > 0) badges.push({ code: 'podium', icon: '🏆', title: 'Podium', description: 'Dans le top 3 du classement général.' });
  return badges;
};

const buildInsights = (user, context) => {
  if (!user) return [];
  const played = Math.max(1, number(user.scored_predictions));
  const exactRate = number(user.exact_scores) / played;
  const wrongRate = number(user.wrong_predictions) / played;
  const insights = [];

  if (number(user.best_exact_streak) >= 2) insights.push({ type: 'good', icon: '🎯', title: 'Précision en série', text: `Tu as déjà enchaîné ${user.best_exact_streak} scores exacts.` });
  if (exactRate >= 0.2) insights.push({ type: 'good', icon: '🎯', title: 'Très précis', text: 'Tu transformes pas mal de pronos en scores exacts.' });
  if (number(user.correct_winners) > number(user.exact_scores) + number(user.correct_differences)) insights.push({ type: 'good', icon: '✅', title: 'Bon lecteur de vainqueur', text: 'Tu sécurises souvent au moins le bon résultat.' });
  if (number(user.best_streak) >= 3) insights.push({ type: 'good', icon: '🔥', title: 'Bonne série', text: `Ta meilleure série est de ${user.best_streak} matchs avec points.` });
  if (number(user.near_misses) >= 3) insights.push({ type: 'neutral', icon: '🐈‍⬛', title: 'Pas passé loin', text: `Tu as déjà ${user.near_misses} prono(s) à un seul but du score exact.` });
  if (wrongRate >= 0.5 && number(user.scored_predictions) >= 3) insights.push({ type: 'warning', icon: '💀', title: 'Zone rouge', text: 'Beaucoup de pronos finissent encore à 0 point.' });
  if (context.totalDraws > 0 && number(user.draw_hits) === 0) insights.push({ type: 'warning', icon: '🤝', title: 'Les nuls te résistent', text: 'Aucun nul trouvé pour le moment.' });
  if (!insights.length) insights.push({ type: 'neutral', icon: '🧪', title: 'Échantillon en cours', text: 'Encore trop peu de résultats pour tirer une vraie tendance.' });
  return insights;
};

const buildOverview = async (pool) => {
  const [{ scores: bonusScores }, { scores: specialScores }] = await Promise.all([
    getAllBonusScores(pool),
    getAllSpecialPredictionScores(pool)
  ]);

  const [usersResult, predictionCountsResult, scoreRowsResult, predictionRowsResult, finishedMatchesResult] = await Promise.all([
    pool.query(`
      SELECT u.id, u.username, u.avatar_data, u.avatar_updated_at,
             COALESCE(SUM(us.points), 0)::int AS match_points,
             COUNT(us.match_id)::int AS scored_predictions,
             COUNT(*) FILTER (WHERE us.points = 3)::int AS exact_scores,
             COUNT(*) FILTER (WHERE us.points = 2)::int AS correct_differences,
             COUNT(*) FILTER (WHERE us.points = 1)::int AS correct_winners,
             COUNT(*) FILTER (WHERE us.points = 0)::int AS wrong_predictions
      FROM users u
      LEFT JOIN user_scores us ON u.id = us.user_id
      GROUP BY u.id, u.username, u.avatar_data, u.avatar_updated_at
    `),
    pool.query('SELECT user_id, COUNT(*)::int AS total_predictions FROM predictions GROUP BY user_id'),
    pool.query('SELECT user_id, match_id, points FROM user_scores'),
    pool.query(`
      SELECT p.user_id, p.match_id, p.team1_goals, p.team2_goals,
             r.team1_goals AS result_team1_goals, r.team2_goals AS result_team2_goals
      FROM predictions p
      JOIN results r ON r.match_id = p.match_id
    `),
    pool.query(`
      SELECT m.id, m.start_time, t1.name AS team1, t2.name AS team2, r.team1_goals, r.team2_goals
      FROM matches m
      JOIN results r ON r.match_id = m.id
      LEFT JOIN teams t1 ON t1.id = m.team1_id
      LEFT JOIN teams t2 ON t2.id = m.team2_id
      ORDER BY m.start_time ASC NULLS LAST, m.id ASC
    `)
  ]);

  const totalPredictionsByUser = new Map(predictionCountsResult.rows.map(row => [Number(row.user_id), number(row.total_predictions)]));
  const orderedMatches = finishedMatchesResult.rows.map(row => ({ ...row, id: Number(row.id) }));
  const matchById = new Map(orderedMatches.map(match => [Number(match.id), match]));
  const competitionDayByMatch = buildCompetitionDayMap(orderedMatches);
  const scoreRowsByUser = new Map();
  scoreRowsResult.rows.forEach(row => {
    const userId = Number(row.user_id);
    if (!scoreRowsByUser.has(userId)) scoreRowsByUser.set(userId, []);
    scoreRowsByUser.get(userId).push(row);
  });
  const totalDraws = orderedMatches.filter(match => number(match.team1_goals) === number(match.team2_goals)).length;

  const users = usersResult.rows.map(row => {
    const id = Number(row.id);
    const matchPoints = number(row.match_points);
    const bonusPoints = bonusScores.get(id)?.points || 0;
    const specialPoints = specialScores.get(id)?.points || 0;
    const pointBreakdown = emptyPointBreakdown();
    const userScoreRows = scoreRowsByUser.get(id) || [];
    userScoreRows.forEach(scoreRow => {
      const match = matchById.get(Number(scoreRow.match_id));
      const category = getMatchPointCategory(match, competitionDayByMatch);
      pointBreakdown[category] += number(scoreRow.points);
    });
    pointBreakdown.special = specialPoints;
    pointBreakdown.bonus = bonusPoints;

    const userFinishedPredictions = predictionRowsResult.rows.filter(prediction => Number(prediction.user_id) === id);
    const drawHits = userFinishedPredictions.filter(prediction =>
      number(prediction.team1_goals) === number(prediction.team2_goals) &&
      number(prediction.result_team1_goals) === number(prediction.result_team2_goals)
    ).length;
    const nearMisses = userFinishedPredictions.filter(prediction =>
      Math.abs(number(prediction.team1_goals) - number(prediction.result_team1_goals)) +
      Math.abs(number(prediction.team2_goals) - number(prediction.result_team2_goals)) === 1
    ).length;

    return {
      id,
      username: row.username,
      avatar_url: buildAvatarUrl(row),
      match_points: matchPoints,
      bonus_points: bonusPoints,
      special_points: specialPoints,
      total_points: matchPoints + bonusPoints + specialPoints,
      point_breakdown: pointBreakdown,
      scored_predictions: number(row.scored_predictions),
      total_predictions: totalPredictionsByUser.get(id) || 0,
      exact_scores: number(row.exact_scores),
      correct_differences: number(row.correct_differences),
      correct_winners: number(row.correct_winners),
      wrong_predictions: number(row.wrong_predictions),
      draw_hits: drawHits,
      near_misses: nearMisses,
      efficiency: number(row.scored_predictions) > 0 ? round((matchPoints + bonusPoints + specialPoints) / number(row.scored_predictions), 2) : 0
    };
  });

  computeStreaks(users, orderedMatches, scoreRowsResult.rows);

  const rankedUsers = sortByValue(users, 'total_points').map((user, index) => ({ ...user, rank: index + 1 }));
  const finishedMatches = orderedMatches.length;
  const minEfficiencyMatches = Math.max(1, Math.min(5, Math.ceil(finishedMatches * 0.5)));
  const efficiencyRows = rankedUsers.filter(user => number(user.scored_predictions) >= minEfficiencyMatches);

  const totalMatchPoints = rankedUsers.reduce((sum, user) => sum + number(user.match_points), 0);
  const totalBonusPoints = rankedUsers.reduce((sum, user) => sum + number(user.bonus_points), 0);
  const totalSpecialPoints = rankedUsers.reduce((sum, user) => sum + number(user.special_points), 0);
  const totalPoints = totalMatchPoints + totalBonusPoints + totalSpecialPoints;
  const totalScoredPredictions = rankedUsers.reduce((sum, user) => sum + number(user.scored_predictions), 0);

  const scoreDistribution = buildScoreDistribution(predictionRowsResult.rows);
  const communityMatches = buildCommunityMatches(orderedMatches, predictionRowsResult.rows, scoreRowsResult.rows);
  const scoredCommunityMatches = [...communityMatches].filter(match => match.total_predictions > 0);
  const communityProfiles = buildCommunityProfiles(rankedUsers, predictionRowsResult.rows, scoreRowsResult.rows, scoredCommunityMatches);
  const hardestAverage = scoredCommunityMatches.reduce((min, match) => Math.min(min, number(match.average_points)), Number.POSITIVE_INFINITY);
  const easiestAverage = scoredCommunityMatches.reduce((max, match) => Math.max(max, number(match.average_points)), 0);
  const hardestMatches = scoredCommunityMatches.filter(match => number(match.average_points) === hardestAverage).sort((a, b) => new Date(b.date) - new Date(a.date) || Number(b.match_id) - Number(a.match_id));
  const easiestMatches = scoredCommunityMatches.filter(match => number(match.average_points) === easiestAverage).sort((a, b) => new Date(b.date) - new Date(a.date) || Number(b.match_id) - Number(a.match_id));
  const hardestMatch = hardestMatches[0] || null;
  const easiestMatch = easiestMatches[0] || null;
  const zeroPointMatches = scoredCommunityMatches.filter(match => number(match.average_points) === 0).sort((a, b) => new Date(b.date) - new Date(a.date) || Number(b.match_id) - Number(a.match_id));
  const consensusMatch = [...scoredCommunityMatches].sort((a, b) => number(b.consensus_percent) - number(a.consensus_percent) || new Date(b.date) - new Date(a.date))[0] || null;
  const chaosMatch = [...scoredCommunityMatches].sort((a, b) => number(a.consensus_percent) - number(b.date ? 0 : 0) || number(a.consensus_percent) - number(b.consensus_percent) || new Date(b.date) - new Date(a.date))[0] || null;

  const context = { finishedMatches, totalDraws };
  const usersWithBadges = rankedUsers.map(user => ({ ...user, badges: buildBadges(user, context) }));
  const badgeCounts = new Map();
  usersWithBadges.forEach(user => user.badges.forEach(badge => badgeCounts.set(badge.code, { ...badge, count: (badgeCounts.get(badge.code)?.count || 0) + 1 })));

  const pointBreakdown = usersWithBadges.map(user => ({
    ...publicUser(user),
    rank: user.rank,
    total_points: user.total_points,
    point_breakdown: user.point_breakdown
  }));

  return {
    generated_at: new Date().toISOString(),
    overview: {
      total_players: rankedUsers.length,
      active_players: rankedUsers.filter(user => number(user.scored_predictions) > 0).length,
      finished_matches: finishedMatches,
      total_points: totalPoints,
      total_match_points: totalMatchPoints,
      total_bonus_points: totalBonusPoints,
      total_special_points: totalSpecialPoints,
      total_scored_predictions: totalScoredPredictions,
      average_points_per_player: rankedUsers.length ? round(totalPoints / rankedUsers.length, 1) : 0,
      point_breakdown_categories: POINT_BREAKDOWN_CATEGORIES,
      leader: publicUser(rankedUsers[0]) ? { ...publicUser(rankedUsers[0]), total_points: rankedUsers[0].total_points } : null
    },
    awards: [
      resolveAward({ code: 'match_boss', title: 'Boss des matchs', icon: '⚽', definition: 'Le joueur qui a marqué le plus de points uniquement sur les matchs.', unit: 'pts', rows: rankedUsers, field: 'match_points' }),
      resolveAward({ code: 'bonus_king', title: 'Roi du bonus', icon: '🎁', definition: 'Le joueur qui a marqué le plus de points sur les pronostics bonus.', unit: 'pts', rows: rankedUsers, field: 'bonus_points' }),
      resolveAward({ code: 'specialist', title: 'Spécialiste journée', icon: '⚡', definition: 'Le joueur qui a marqué le plus de points sur les pronostics spéciaux de journée.', unit: 'pts', rows: rankedUsers, field: 'special_points' }),
      resolveAward({ code: 'exact_scores', title: 'Chirurgien du score', icon: '🎯', definition: 'Le joueur qui a trouvé le plus de scores exacts.', unit: 'exacts', rows: rankedUsers, field: 'exact_scores', minValue: 2 }),
      resolveAward({ code: 'near_miss', title: 'Chat noir', icon: '🐈‍⬛', definition: 'Le joueur le plus souvent à un seul but du score exact.', unit: 'presque', rows: rankedUsers, field: 'near_misses', minValue: 2 }),
      resolveAward({ code: 'draw_oracle', title: 'Oracle des nuls', icon: '🤝', definition: 'Le joueur qui lit le mieux les matchs nuls.', unit: 'nuls', rows: rankedUsers, field: 'draw_hits', minValue: 1 }),
      resolveAward({ code: 'assiduous', title: 'Le plus assidu', icon: '🧱', definition: 'Le joueur qui a encodé le plus de pronostics au total.', unit: 'pronos', rows: rankedUsers, field: 'total_predictions' }),
      resolveAward({ code: 'efficiency', title: 'Meilleur rendement', icon: '🧪', definition: `Meilleure moyenne de points par match scoré, avec minimum ${minEfficiencyMatches} match(s) scoré(s).`, unit: 'pt/match', rows: efficiencyRows, field: 'efficiency', decimals: 2 }),
      resolveAward({ code: 'best_streak', title: 'Meilleure série', icon: '🔥', definition: 'Plus longue série de matchs consécutifs avec au moins 1 point.', unit: 'matchs', rows: rankedUsers, field: 'best_streak' })
    ],
    rankings: {
      total_points: rankedUsers,
      exact_scores: sortByValue(rankedUsers, 'exact_scores'),
      correct_differences: sortByValue(rankedUsers, 'correct_differences'),
      correct_winners: sortByValue(rankedUsers, 'correct_winners'),
      draw_hits: sortByValue(rankedUsers, 'draw_hits'),
      near_misses: sortByValue(rankedUsers, 'near_misses'),
      best_streak: sortByValue(rankedUsers, 'best_streak'),
      efficiency: sortByValue(efficiencyRows, 'efficiency'),
      bonus_points: sortByValue(rankedUsers, 'bonus_points'),
      special_points: sortByValue(rankedUsers, 'special_points'),
      total_predictions: sortByValue(rankedUsers, 'total_predictions')
    },
    point_breakdown: pointBreakdown,
    badges: {
      catalog: [...badgeCounts.values()].sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, 'fr')),
      users: usersWithBadges.map(user => ({ ...publicUser(user), rank: user.rank, total_points: user.total_points, badges: user.badges }))
    },
    community: {
      most_predicted_score: scoreDistribution[0] || null,
      hardest_match: hardestMatch,
      hardest_matches: hardestMatches.slice(0, 8),
      easiest_match: easiestMatch,
      easiest_matches: easiestMatches.slice(0, 8),
      zero_point_matches: zeroPointMatches.slice(0, 8),
      consensus_match: consensusMatch,
      chaos_match: chaosMatch,
      mouton: communityProfiles.mouton,
      contrarian: communityProfiles.contrarian,
      bold_player: communityProfiles.bold_player,
      profiles: communityProfiles.profiles.slice(0, 12),
      community_profile_min_predictions: communityProfiles.min_predictions,
      recent_matches: communityMatches.slice(-8).reverse()
    },
    users: usersWithBadges
  };
};

const invalidateStatsOverviewCache = () => {
  cachedOverview = null;
  cachedAt = null;
};

const warmStatsOverviewCache = async (pool) => {
  cachedOverview = await buildOverview(pool);
  cachedAt = Date.now();
  return cachedOverview;
};

const getStatsOverview = async (pool, currentUserId) => {
  if (!cachedOverview) await warmStatsOverviewCache(pool);
  const user = cachedOverview.users.find(row => Number(row.id) === Number(currentUserId));
  const rankIndex = cachedOverview.users.findIndex(row => Number(row.id) === Number(currentUserId));
  const ahead = rankIndex > 0 ? cachedOverview.users[rankIndex - 1] : null;
  const behind = rankIndex >= 0 && rankIndex < cachedOverview.users.length - 1 ? cachedOverview.users[rankIndex + 1] : null;

  return {
    ...cachedOverview,
    cached_at: cachedAt ? new Date(cachedAt).toISOString() : null,
    me: user ? {
      ...user,
      points_to_next_rank: ahead ? Math.max(0, number(ahead.total_points) - number(user.total_points) + 1) : 0,
      player_ahead: ahead ? { ...publicUser(ahead), total_points: ahead.total_points, rank: ahead.rank } : null,
      player_behind: behind ? { ...publicUser(behind), total_points: behind.total_points, rank: behind.rank } : null,
      insights: buildInsights(user, { finishedMatches: cachedOverview.overview.finished_matches, totalDraws: cachedOverview.community.recent_matches.filter(match => match.result?.includes('-') && match.result.split('-')[0] === match.result.split('-')[1]).length })
    } : null
  };
};

module.exports = {
  getStatsOverview,
  invalidateStatsOverviewCache,
  warmStatsOverviewCache
};
