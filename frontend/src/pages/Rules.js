import React from 'react';

const cellStyle = { border: '1px solid #ddd', padding: '8px' };
const sectionStyle = { marginTop: '24px' };

function Rules() {
  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>📋 Règles & Système de Points</h1>

      <h3>Comment ça fonctionne :</h3>
      <ul>
        <li><strong>Inscrivez-vous</strong> avec votre email et créez un compte.</li>
        <li><strong>Faites vos pronostics de matchs</strong> avant le coup d'envoi de chaque match.</li>
        <li><strong>Complétez vos pronostics bonus</strong> avant le début de la compétition.</li>
        <li><strong>Gagnez des points</strong> en fonction de votre précision.</li>
        <li><strong>Concourez</strong> avec vos copains au classement général.</li>
      </ul>

      <h3 style={sectionStyle}>Pronostics de matchs :</h3>
      <p>
        En phase de groupes, les pronostics portent sur le score à la fin du <strong>temps réglementaire</strong>,
        temps additionnel inclus.
      </p>
      <p>
        À partir des matchs à élimination directe, les pronostics portent sur le score à la fin du match,
        <strong> prolongations éventuelles incluses</strong>, mais <strong>sans tenir compte des tirs au but</strong>.
      </p>
      <p>
        Un match nul reste donc possible dans les pronostics de phase finale uniquement si le match est encore nul
        après les prolongations et se décide ensuite aux tirs au but.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={cellStyle}>Précision</th>
            <th style={cellStyle}>Exemple</th>
            <th style={cellStyle}>Points</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={cellStyle}>Score exact</td>
            <td style={cellStyle}>Prono 2-1, résultat 2-1</td>
            <td style={cellStyle}>3 points</td>
          </tr>
          <tr>
            <td style={cellStyle}>Bonne différence</td>
            <td style={cellStyle}>Prono 3-1, résultat 2-0</td>
            <td style={cellStyle}>2 points</td>
          </tr>
          <tr>
            <td style={cellStyle}>Bon vainqueur ou bon match nul</td>
            <td style={cellStyle}>Prono 1-1, résultat 2-2</td>
            <td style={cellStyle}>1 point</td>
          </tr>
          <tr>
            <td style={cellStyle}>Mauvais pronostic</td>
            <td style={cellStyle}>Prono 2-0, résultat 1-1</td>
            <td style={cellStyle}>0 point</td>
          </tr>
        </tbody>
      </table>

      <h3 style={sectionStyle}>Pronostics bonus :</h3>
      <p>
        Les pronostics bonus doivent être complétés avant le début de la compétition. Une fois le premier match commencé,
        ils sont verrouillés et ne peuvent plus être modifiés.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={cellStyle}>Pari bonus</th>
            <th style={cellStyle}>Points</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={cellStyle}>Vainqueur de chaque groupe A à L</td>
            <td style={cellStyle}>5 points par groupe</td>
          </tr>
          <tr>
            <td style={cellStyle}>Champion du monde</td>
            <td style={cellStyle}>15 points</td>
          </tr>
          <tr>
            <td style={cellStyle}>Finaliste perdant</td>
            <td style={cellStyle}>10 points</td>
          </tr>
          <tr>
            <td style={cellStyle}>Demi-finalistes, peu importe l'ordre</td>
            <td style={cellStyle}>5 points par équipe</td>
          </tr>
        </tbody>
      </table>

      <h3 style={sectionStyle}>Important :</h3>
      <ul>
        <li>Vous pouvez modifier un pronostic de match jusqu'à ce que le match commence.</li>
        <li>Une fois le match commencé, le pronostic du match est bloqué.</li>
        <li>Les matchs nuls sont bien pris en compte dans le barème.</li>
        <li>Pour les matchs à élimination directe, le score utilisé inclut les prolongations si elles ont lieu, mais jamais les tirs au but.</li>
        <li>Les points sont calculés automatiquement après encodage des résultats officiels.</li>
      </ul>
    </div>
  );
}

export default Rules;
