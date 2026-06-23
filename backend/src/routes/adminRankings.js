const express = require('express');
const pool = require('../db/pool');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

const getTendency = (team1Goals, team2Goals) => {
  if (team1Goals > team2Goals) return 'team1';
  if (team1Goals < team2Goals) return 'team2';
  return 'draw';
};

const scoreCurrent = (prediction, result) => {
  const pred1 = Number(prediction.team1_goals);
  const pred2 = Number(prediction.team2_goals);
  const res1 = Number(result.team1_goals);
  const res2 = Number(result.team2_goals);

  if (pred1 === res1 && pred2 === res2) return { points: 3, category: 'exact_score' };
  if ((pred1 - pred2) === (res1 - res2)) return { points: 2, category: 'correct_difference' };
  if (getTendency(pred1, pred2) === getTendency(res1, res2)) return { points: 1, category: 'correct_result' };
  return { points: 0, category: 'wrong' };
};

const scoreSimple = (prediction, result) => {
  const pred1 = Number(prediction.team1_goals);
  const pred2 = Number(prediction.team2_goals);
  const res1 = Number(result.team1_goals);
  const res2 = Number(result.team2_goals);

  if (pred1 === res1 && pred2 === res2) return { points: 5, category: 'exact_score' };
  if ((pred1 - pred2) === (res1 - res2)) return { points: 3, category: 'correct_difference' };
  if (getTendency(pred1, pred2) === getTendency(res1, res2)) return { points: 1, category: 'correct_result' };
  return { points: 0, category: 'wrong' };
};

const scoreDetailed = (prediction, result) => {
  const pred1 = Number(prediction.team1_goals);
  const pred2 = Number(prediction.team2_goals);
  const res1 = Number(result.team1_goals);
  const res2 = Number(result.team2_goals);
  const details = {
    correct_result: getTendency(pred1, pred2) === getTendency(res1, res2),
    correct_team1_goals: pred1 === res1,
    correct_team2_goals: pred2 === res2,
    correct_difference: (pred1 - pred2) === (res1 - res2)
  };

  return {
    points:
      (details.correct_result ? 3 : 0) +
      (details.correct_team1_goals ? 1 : 0) +
      (details.correct_team2_goals ? 1 : 0) +
      (details.correct_difference ? 1 : 0),
    category: details
  };
};

const SYSTEMS = [
  {
    key: 'current',
    title: 'Scoring actuel',
    description: '3 score exact · 2 bon écart · 1 bon résultat · 0 sinon',
    max_points_per_match: 3,
    scorer: scoreCurrent
  },
  {
    key: 'simple',
    title: 'Simple 5 / 3 / 1',
    description: '5 score exact · 3 bon écart · 1 bon résultat · 0 sinon',
    max_points_per_match: 5,
    scorer: scoreSimple
  },
  {
    key: 'detailed',
    title: 'Détaillé 3 + 1 + 1 + 1',
    description: '3 bon résultat · +1 buts équipe 1 · +1 buts équipe 2 · +1 bon écart',
    max_points_per_match: 6,
    scorer: scoreDetailed
  }
];

const emptyStats = (user) => ({
  id: Number(user.id),
  username: user.username,
  points: 0,
  matches_scored: 0,
  exact_scores: 0,
  correct_results: 0,
  correct_differences: 0,
  correct_team1_goals: 0,
  correct_team2_goals: 0,
  wrong_predictions: 0
});

const addExclusiveOutcomeStats = (stats, { isExact, hasCorrectDifference, hasCorrectResult }) => {
  if (isExact) stats.exact_scores += 1;
  else if (hasCorrectDifference) stats.correct_differences += 1;
  else if (hasCorrectResult) stats.correct_results += 1;
  else stats.wrong_predictions += 1;
};

const addStats = (stats, scored, systemKey) => {
  stats.points += scored.points;
  stats.matches_scored += 1;

  if (systemKey === 'detailed') {
    const isExact = Boolean(scored.category.correct_team1_goals && scored.category.correct_team2_goals);
    if (scored.category.correct_team1_goals) stats.correct_team1_goals += 1;
    if (scored.category.correct_team2_goals) stats.correct_team2_goals += 1;
    addExclusiveOutcomeStats(stats, {
      isExact,
      hasCorrectDifference: Boolean(scored.category.correct_difference),
      hasCorrectResult: Boolean(scored.category.correct_result)
    });
    return;
  }

  addExclusiveOutcomeStats(stats, {
    isExact: scored.category === 'exact_score',
    hasCorrectDifference: scored.category === 'correct_difference',
    hasCorrectResult: scored.category === 'correct_result'
  });
};

router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const [usersResult, predictionsResult] = await Promise.all([
      pool.query('SELECT id, username FROM users ORDER BY LOWER(username), LOWER(email)'),
      pool.query(`
        SELECT
          p.user_id,
          p.match_id,
          p.team1_goals AS predicted_team1_goals,
          p.team2_goals AS predicted_team2_goals,
          r.team1_goals AS actual_team1_goals,
          r.team2_goals AS actual_team2_goals
        FROM predictions p
        JOIN results r ON r.match_id = p.match_id
        JOIN matches m ON m.id = p.match_id
        ORDER BY m.start_time ASC NULLS LAST, p.match_id ASC
      `)
    ]);

    const rankings = SYSTEMS.map(system => {
      const rowsByUser = new Map(usersResult.rows.map(user => [Number(user.id), emptyStats(user)]));

      predictionsResult.rows.forEach(row => {
        const userId = Number(row.user_id);
        if (!rowsByUser.has(userId)) return;

        const scored = system.scorer(
          { team1_goals: row.predicted_team1_goals, team2_goals: row.predicted_team2_goals },
          { team1_goals: row.actual_team1_goals, team2_goals: row.actual_team2_goals }
        );

        addStats(rowsByUser.get(userId), scored, system.key);
      });

      const rows = Array.from(rowsByUser.values())
        .sort((a, b) => b.points - a.points || a.username.localeCompare(b.username, 'fr'))
        .map((row, index) => ({ ...row, rank: index + 1 }));

      return {
        key: system.key,
        title: system.title,
        description: system.description,
        max_points_per_match: system.max_points_per_match,
        rows
      };
    });

    const currentRanks = new Map((rankings.find(system => system.key === 'current')?.rows || []).map(row => [row.id, row.rank]));
    const enrichedRankings = rankings.map(system => ({
      ...system,
      rows: system.rows.map(row => ({
        ...row,
        current_rank: currentRanks.get(row.id) || row.rank,
        rank_delta_vs_current: (currentRanks.get(row.id) || row.rank) - row.rank
      }))
    }));

    res.json({
      generated_at: new Date().toISOString(),
      matches_scored: new Set(predictionsResult.rows.map(row => Number(row.match_id))).size,
      systems: enrichedRankings
    });
  } catch (error) {
    console.error('Admin scoring rankings error:', error);
    res.status(500).json({ error: 'Server error', detail: error.message, code: error.code });
  }
});

module.exports = router;
