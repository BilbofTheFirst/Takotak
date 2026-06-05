import React from 'react';

function Rules() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>📋 Rules & Scoring System</h1>
      <h3>How it works:</h3>
      <ul>
        <li><strong>Register</strong> with your email and create an account</li>
        <li><strong>Make predictions</strong> for each match before it starts</li>
        <li><strong>Earn points</strong> based on accuracy</li>
        <li><strong>Compete</strong> with friends on the leaderboard</li>
      </ul>
      
      <h3>Scoring System:</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Accuracy</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Points</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>Exact score (e.g., 2-1)</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>3 points</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>Correct goal difference (e.g., predict 3-1 vs actual 2-0)</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>2 points</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>Correct winner or draw</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>1 point</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>Wrong prediction</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>0 points</td>
          </tr>
        </tbody>
      </table>

      <h3>Important:</h3>
      <ul>
        <li>You can update your prediction until the match starts</li>
        <li>After the match starts, your prediction is locked</li>
        <li>Only 90-minute results count (no extra time or penalties)</li>
        <li>Points are calculated automatically after each match</li>
      </ul>
    </div>
  );
}

export default Rules;
