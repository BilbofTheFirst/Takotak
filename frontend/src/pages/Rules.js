import React from 'react';

function Rules() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>📋 Règles & Système de Points</h1>
      <h3>Comment ça fonctionne:</h3>
      <ul>
        <li><strong>Inscrivez-vous</strong> avec votre email et créez un compte</li>
        <li><strong>Faites des pronostics</strong> pour chaque match avant qu'il commence</li>
        <li><strong>Gagnez des points</strong> en fonction de votre précision</li>
        <li><strong>Concourez</strong> avec vos copains au classement</li>
      </ul>

      <h3>Système de points:</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Précision</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Points</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>Score exact (ex: 2-1)</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>3 points</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>Bonne différence (ex: pronostic 3-1 vs résultat 2-0)</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>2 points</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>Bon vainqueur ou match nul</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>1 point</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>Mauvais pronostic</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>0 point</td>
          </tr>
        </tbody>
      </table>

      <h3>Important:</h3>
      <ul>
        <li>Vous pouvez modifier votre pronostic jusqu'à ce que le match commence</li>
        <li>Une fois le match commencé, votre pronostic est bloqué</li>
        <li>Seuls les résultats à 90 minutes comptent (pas de prolongation)</li>
        <li>Les points sont calculés automatiquement après chaque match</li>
      </ul>
    </div>
  );
}

export default Rules;
