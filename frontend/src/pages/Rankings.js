import React, { useEffect, useState } from 'react';
import { resultsService } from '../services/api';

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

  if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🏆 Leaderboard</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Rank</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Player</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Points</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Matches</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((user, idx) => (
            <tr key={user.id}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{idx + 1}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.username}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}><strong>{user.total_points || 0}</strong></td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.matches_predicted || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Rankings;
