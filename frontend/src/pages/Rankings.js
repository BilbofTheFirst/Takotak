import React, { useEffect, useState } from 'react';
import { resultsService } from '../services/api';
import PageLoader from '../components/PageLoader';

function Rankings() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      const res = await resultsService.getLeaderboard();
      setRankings(res.data);
    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader title="Chargement du classement..." icon="🏆" subtitle="Calcul des points et des bonus" />;

  return (
    <div style={{ padding: '20px', maxWidth: '760px', margin: '0 auto' }}>
      <h1>🏆 Classement</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Rang</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Joueur</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Total</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Matchs</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Bonus</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Pronos</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((user, idx) => (
            <tr key={user.id}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.rank || idx + 1}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.username}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}><strong>{user.total_points || 0}</strong></td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.match_points || 0}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.bonus_points || 0}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.matches_predicted || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Rankings;
