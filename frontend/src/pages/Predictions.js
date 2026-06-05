import React, { useEffect, useState } from 'react';
import { matchesService, predictionsService } from '../services/api';

function Predictions() {
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
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
      });
      setPredictions(predMap);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrediction = async (matchId, team1, team2) => {
    const t1 = prompt(`Buts pour ${team1}:`);
    const t2 = prompt(`Buts pour ${team2}:`);
    if (t1 !== null && t2 !== null) {
      try {
        await predictionsService.create(matchId, parseInt(t1), parseInt(t2));
        loadData();
      } catch (error) {
        alert(error.response?.data?.error || 'Erreur lors de la sauvegarde');
      }
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Chargement...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Faites vos pronostics</h1>
      {matches.map(match => (
        <div key={match.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
          <h3>{match.team1} vs {match.team2}</h3>
          <p>Le match commence: {new Date(match.start_time).toLocaleString('fr-FR')}</p>
          {predictions[match.id] ? (
            <p>Votre pronostic: {predictions[match.id].team1_goals} - {predictions[match.id].team2_goals}</p>
          ) : (
            <p>Pas encore de pronostic</p>
          )}
          <button onClick={() => handlePrediction(match.id, match.team1, match.team2)} style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
            {predictions[match.id] ? 'Modifier' : 'Pronostiquer'}
          </button>
        </div>
      ))}
    </div>
  );
}

export default Predictions;
