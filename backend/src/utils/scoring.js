const getTendency = (team1Goals, team2Goals) => {
  if (team1Goals > team2Goals) return 'team1';
  if (team1Goals < team2Goals) return 'team2';
  return 'draw';
};

const calculatePointsDetailed = (prediction, result) => {
  const pred1 = Number(prediction.team1_goals);
  const pred2 = Number(prediction.team2_goals);
  const res1 = Number(result.team1_goals);
  const res2 = Number(result.team2_goals);

  if (pred1 === res1 && pred2 === res2) {
    return {
      points: 3,
      category: 'exact_score',
      label: 'Score exact'
    };
  }

  if ((pred1 - pred2) === (res1 - res2)) {
    return {
      points: 2,
      category: 'correct_difference',
      label: 'Bonne différence'
    };
  }

  const predTendency = getTendency(pred1, pred2);
  const resTendency = getTendency(res1, res2);

  if (predTendency === resTendency) {
    return {
      points: 1,
      category: resTendency === 'draw' ? 'correct_draw' : 'correct_winner',
      label: resTendency === 'draw' ? 'Bon match nul' : 'Bon vainqueur'
    };
  }

  return {
    points: 0,
    category: 'wrong_prediction',
    label: 'Mauvais pronostic'
  };
};

const calculatePoints = (prediction, result) => calculatePointsDetailed(prediction, result).points;

module.exports = { calculatePoints, calculatePointsDetailed, getTendency };
