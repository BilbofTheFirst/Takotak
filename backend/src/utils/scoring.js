const calculatePoints = (prediction, result) => {
  const { team1_goals: pred1, team2_goals: pred2 } = prediction;
  const { team1_goals: res1, team2_goals: res2 } = result;

  // Exact score
  if (pred1 === res1 && pred2 === res2) {
    return 3;
  }

  // Correct difference (goal difference)
  if ((pred1 - pred2) === (res1 - res2)) {
    return 2;
  }

  // Correct winner or draw (tendency)
  const predTendency = pred1 > pred2 ? 'team1' : pred1 < pred2 ? 'team2' : 'draw';
  const resTendency = res1 > res2 ? 'team1' : res1 < res2 ? 'team2' : 'draw';
  
  if (predTendency === resTendency) {
    return 1;
  }

  return 0;
};

module.exports = { calculatePoints };
