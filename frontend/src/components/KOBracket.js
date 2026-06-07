import React, { useMemo } from 'react';
import { getCountryFlag } from '../utils/flags';

function KOBracket({ groupsData, allThirdPlaces, koSimulations, onScoreChange, PRIMARY, SECONDARY, GRADIENT }) {
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  // Générer les matchs par round
  const generateBracket = useMemo(() => {
    const classifications = {};
    groups.forEach(g => {
      classifications[g] = groupsData[g] || [];
    });

    // Premiers et deuxièmes
    const firstPlaces = {};
    const secondPlaces = {};
    groups.forEach(g => {
      if (classifications[g].length >= 2) {
        firstPlaces[g] = classifications[g][0].team;
        secondPlaces[g] = classifications[g][1].team;
      }
    });

    // 4 meilleurs 3e qualifiés
    const qualifiedThirds = allThirdPlaces.slice(0, 4);

    // Matchs 16ème
    const round16 = [
      { id: 'r16_1', home: firstPlaces['A'], away: secondPlaces['B'], label: 'GA1 vs GB2' },
      { id: 'r16_2', home: firstPlaces['C'], away: secondPlaces['D'], label: 'GC1 vs GD2' },
      { id: 'r16_3', home: firstPlaces['E'], away: secondPlaces['F'], label: 'GE1 vs GF2' },
      { id: 'r16_4', home: firstPlaces['G'], away: secondPlaces['H'], label: 'GG1 vs GH2' },
      { id: 'r16_5', home: firstPlaces['B'], away: secondPlaces['A'], label: 'GB1 vs GA2' },
      { id: 'r16_6', home: firstPlaces['D'], away: secondPlaces['C'], label: 'GD1 vs GC2' },
      { id: 'r16_7', home: firstPlaces['F'], away: secondPlaces['E'], label: 'GF1 vs GE2' },
      { id: 'r16_8', home: firstPlaces['H'], away: secondPlaces['G'], label: 'GH1 vs GG2' },
      { id: 'r16_9', home: firstPlaces['I'], away: secondPlaces['J'], label: 'GI1 vs GJ2' },
      { id: 'r16_10', home: firstPlaces['K'], away: secondPlaces['L'], label: 'GK1 vs GL2' },
      { id: 'r16_11', home: firstPlaces['J'], away: secondPlaces['I'], label: 'GJ1 vs GI2' },
      { id: 'r16_12', home: firstPlaces['L'], away: secondPlaces['K'], label: 'GL1 vs GK2' },
      { id: 'r16_13', home: qualifiedThirds[0]?.team, away: firstPlaces['B'], label: '3e1 vs GB1' },
      { id: 'r16_14', home: qualifiedThirds[1]?.team, away: firstPlaces['D'], label: '3e2 vs GD1' },
      { id: 'r16_15', home: qualifiedThirds[2]?.team, away: firstPlaces['F'], label: '3e3 vs GF1' },
      { id: 'r16_16', home: qualifiedThirds[3]?.team, away: firstPlaces['H'], label: '3e4 vs GH1' }
    ];

    return { round16, firstPlaces, secondPlaces };
  }, [groupsData, allThirdPlaces]);

  // Déterminer le gagnant d'un match
  const getWinner = (matchId) => {
    const sim = koSimulations[matchId];
    if (!sim || sim.team1_goals === sim.team2_goals) return null;
    return sim.team1_goals > sim.team2_goals ? 'home' : 'away';
  };

  // Match component
  const MatchBox = ({ match }) => {
    const sim = koSimulations[match.id] || { team1_goals: 0, team2_goals: 0 };
    const winner = getWinner(match.id);

    return (
      <div style={{
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: '12px'
      }}>
        {/* Home Team */}
        <div style={{
          padding: '10px',
          borderBottom: '1px solid #eee',
          background: winner === 'home' ? '#eff6ff' : 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '500',
              color: '#333',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {match.home ? `${getCountryFlag(match.home)} ${match.home}` : '?'}
            </div>
          </div>
          <input
            type="number"
            min="0"
            max="20"
            value={sim.team1_goals}
            onChange={(e) => onScoreChange(match.id, 'team1_goals', e.target.value)}
            style={{
              width: '40px',
              padding: '5px',
              fontSize: '12px',
              fontWeight: 'bold',
              border: `1px solid ${PRIMARY}`,
              borderRadius: '4px',
              textAlign: 'center'
            }}
          />
          {winner === 'home' && <div style={{ color: '#059669', fontWeight: 'bold', fontSize: '12px' }}>✓</div>}
        </div>

        {/* Away Team */}
        <div style={{
          padding: '10px',
          background: winner === 'away' ? '#fff3e9' : 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '500',
              color: '#333',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {match.away ? `${getCountryFlag(match.away)} ${match.away}` : '?'}
            </div>
          </div>
          <input
            type="number"
            min="0"
            max="20"
            value={sim.team2_goals}
            onChange={(e) => onScoreChange(match.id, 'team2_goals', e.target.value)}
            style={{
              width: '40px',
              padding: '5px',
              fontSize: '12px',
              fontWeight: 'bold',
              border: `1px solid ${PRIMARY}`,
              borderRadius: '4px',
              textAlign: 'center'
            }}
          />
          {winner === 'away' && <div style={{ color: '#d97706', fontWeight: 'bold', fontSize: '12px' }}>✓</div>}
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginBottom: '50px' }}>
      <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '20px', fontWeight: 'bold' }}>
        🏆 Phase Éliminatoire
      </h2>

      {/* 16ème de Finale */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{
          fontSize: '16px',
          color: 'white',
          padding: '10px 15px',
          background: GRADIENT,
          borderRadius: '8px',
          margin: '0 0 15px 0',
          fontWeight: 'bold'
        }}>
          🥊 16ème de Finale (16 matchs)
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '15px'
        }}>
          {generateBracket.round16.map((match) => (
            <MatchBox key={match.id} match={match} />
          ))}
        </div>
      </div>

      {/* Message */}
      <div style={{
        background: '#f0f4f8',
        padding: '20px',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#666',
        fontSize: '14px'
      }}>
        🎯 Entrez les scores des 16ème! Les phases suivantes (8ème, Quarts, Semis, Final) se calculeront automatiquement! ⚡
      </div>
    </div>
  );
}

export default KOBracket;
