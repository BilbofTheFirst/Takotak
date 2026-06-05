import React, { useEffect, useState } from 'react';
import { matchesService, resultsService } from '../services/api';

function Admin() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const res = await matchesService.getAll();
      setMatches(res.data);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResult = async (matchId) => {
    const team1 = prompt('Buts de l\'équipe 1:');
    const team2 = prompt('Buts de l\'équipe 2:');
    if (team1 !== null && team2 !== null) {
      try {
        await resultsService.create(matchId, parseInt(team1), parseInt(team2));
        alert('Résultat enregistré et points calculés!');
        loadMatches();
      } catch (error) {
        alert(error.response?.data?.error || 'Erreur lors de la sauvegarde');
      }
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Chargement...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>⚙️ Panel Admin</h1>
      <p>Ajouter les résultats des matchs (Admin seulement)</p>
      {matches.map(match => (
        <div key={match.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', background: match.status === 'finished' ? '#e8f5e9' : '#fff' }}>
          <h3>{match.team1} vs {match.team2}</h3>
          <p>Statut: <strong>{match.status}</strong></p>
          {match.team1_goals !== null ? (
            <p>Résultat: {match.team1_goals} - {match.team2_goals}</p>
          ) : (
            <button onClick={() => handleSaveResult(match.id)} style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>
              Ajouter Résultat
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default Admin;
