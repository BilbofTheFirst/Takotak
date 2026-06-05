import React, { useEffect, useState } from 'react';
import { matchesService, predictionsService } from '../services/api';

function Simulation() {
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [simulations, setSimulations] = useState({});
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [matchesRes, predictionsRes] = await Promise.all([
        matchesService.getAll(),
        predictionsService.getAll()
      ]);
      setMatches(matchesRes.data);
      
      const predMap = {};
      predictionsRes.data.forEach(p => {
        predMap[p.match_id] = p;
        setSimulations(prev => ({
          ...prev,
          [p.match_id]: { team1_goals: p.team1_goals, team2_goals: p.team2_goals }
        }));
      });
      setPredictions(predMap);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulationChange = (matchId, field, value) => {
    setSimulations(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: parseInt(value) || 0
      }
    }));
  };

  const calculatePoints = (prediction, result) => {
    const { team1_goals: pred1, team2_goals: pred2 } = prediction;
    const { team1_goals: res1, team2_goals: res2 } = result;

    if (pred1 === res1 && pred2 === res2) return 3;
    if ((pred1 - pred2) === (res1 - res2)) return 2;
    
    const predTendency = pred1 > pred2 ? 'team1' : pred1 < pred2 ? 'team2' : 'draw';
    const resTendency = res1 > res2 ? 'team1' : res1 < res2 ? 'team2' : 'draw';
    if (predTendency === resTendency) return 1;
    
    return 0;
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🎮 Simulation</h1>
      <p>Test what-if scenarios for finished matches</p>
      {matches.filter(m => m.status === 'finished').map(match => {
        const pred = predictions[match.id];
        const sim = simulations[match.id] || { team1_goals: 0, team2_goals: 0 };
        const points = pred ? calculatePoints(pred, sim) : 0;

        return (
          <div key={match.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
            <h3>{match.team1} vs {match.team2}</h3>
            <p>Your prediction: {pred?.team1_goals || '-'} - {pred?.team2_goals || '-'}</p>
            <div style={{ marginBottom: '10px' }}>
              <label>
                {match.team1} goals: <input type="number" value={sim.team1_goals} onChange={(e) => handleSimulationChange(match.id, 'team1_goals', e.target.value)} />
              </label>
              <label style={{ marginLeft: '10px' }}>
                {match.team2} goals: <input type="number" value={sim.team2_goals} onChange={(e) => handleSimulationChange(match.id, 'team2_goals', e.target.value)} />
              </label>
            </div>
            <p>Points you would get: <strong>{points}</strong></p>
          </div>
        );
      })}
    </div>
  );
}

export default Simulation;
