import React, { useMemo, useState } from 'react';
import { getFlag } from '../utils/countryFlags';

function KOBracket({ groupsData, allThirdPlaces, koSimulations, onScoreChange, PRIMARY, SECONDARY, GRADIENT }) {
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const [expandedPhase, setExpandedPhase] = useState('r16');

  const generateBracket = useMemo(() => {
    const classifications = {};
    groups.forEach(g => {
      classifications[g] = groupsData[g] || [];
    });

    const firstPlaces = {};
    const secondPlaces = {};
    groups.forEach(g => {
      if (classifications[g].length >= 2) {
        firstPlaces[g] = classifications[g][0].team;
        secondPlaces[g] = classifications[g][1].team;
      }
    });

    const qualifiedThirds = allThirdPlaces.slice(0, 4);

    const round16 = [
      { id: 'r16_1', home: firstPlaces['A'], away: secondPlaces['B'], num: 1 },
      { id: 'r16_2', home: firstPlaces['C'], away: secondPlaces['D'], num: 2 },
      { id: 'r16_3', home: firstPlaces['E'], away: secondPlaces['F'], num: 3 },
      { id: 'r16_4', home: firstPlaces['G'], away: secondPlaces['H'], num: 4 },
      { id: 'r16_5', home: firstPlaces['B'], away: secondPlaces['A'], num: 5 },
      { id: 'r16_6', home: firstPlaces['D'], away: secondPlaces['C'], num: 6 },
      { id: 'r16_7', home: firstPlaces['F'], away: secondPlaces['E'], num: 7 },
      { id: 'r16_8', home: firstPlaces['H'], away: secondPlaces['G'], num: 8 },
      { id: 'r16_9', home: firstPlaces['I'], away: secondPlaces['J'], num: 9 },
      { id: 'r16_10', home: firstPlaces['K'], away: secondPlaces['L'], num: 10 },
      { id: 'r16_11', home: firstPlaces['J'], away: secondPlaces['I'], num: 11 },
      { id: 'r16_12', home: firstPlaces['L'], away: secondPlaces['K'], num: 12 },
      { id: 'r16_13', home: qualifiedThirds[0]?.team, away: firstPlaces['B'], num: 13 },
      { id: 'r16_14', home: qualifiedThirds[1]?.team, away: firstPlaces['D'], num: 14 },
      { id: 'r16_15', home: qualifiedThirds[2]?.team, away: firstPlaces['F'], num: 15 },
      { id: 'r16_16', home: qualifiedThirds[3]?.team, away: firstPlaces['H'], num: 16 }
    ];

    const getWinnerTeam = (matchId) => {
      const sim = koSimulations[matchId];
      if (!sim) return null;
      if (sim.team1_goals === sim.team2_goals) return null;
      const match = round16.find(m => m.id === matchId);
      if (!match) return null;
      return sim.team1_goals > sim.team2_goals ? match.home : match.away;
    };

    // 8ème (Winners from 2x round16 matches)
    const round8 = [
      { id: 'r8_1', prevMatches: [round16[0], round16[1]] },
      { id: 'r8_2', prevMatches: [round16[2], round16[3]] },
      { id: 'r8_3', prevMatches: [round16[4], round16[5]] },
      { id: 'r8_4', prevMatches: [round16[6], round16[7]] },
      { id: 'r8_5', prevMatches: [round16[8], round16[9]] },
      { id: 'r8_6', prevMatches: [round16[10], round16[11]] },
      { id: 'r8_7', prevMatches: [round16[12], round16[13]] },
      { id: 'r8_8', prevMatches: [round16[14], round16[15]] }
    ];

    // Quarts
    const roundQF = [
      { id: 'qf_1', prevMatches: [round8[0], round8[1]] },
      { id: 'qf_2', prevMatches: [round8[2], round8[3]] },
      { id: 'qf_3', prevMatches: [round8[4], round8[5]] },
      { id: 'qf_4', prevMatches: [round8[6], round8[7]] }
    ];

    // Semis
    const roundSF = [
      { id: 'sf_1', prevMatches: [roundQF[0], roundQF[1]] },
      { id: 'sf_2', prevMatches: [roundQF[2], roundQF[3]] }
    ];

    // Final
    const roundFinal = [
      { id: 'final', prevMatches: [roundSF[0], roundSF[1]] }
    ];

    return { round16, round8, roundQF, roundSF, roundFinal, getWinnerTeam };
  }, [groupsData, allThirdPlaces, koSimulations]);

  const getWinner = (matchId) => {
    const sim = koSimulations[matchId];
    if (!sim || sim.team1_goals === sim.team2_goals) return null;
    return sim.team1_goals > sim.team2_goals ? 'home' : 'away';
  };

  const MatchCard = ({ match, isEditable = false, isRound16 = false }) => {
    const sim = koSimulations[match.id] || { team1_goals: 0, team2_goals: 0 };
    const winner = getWinner(match.id);

    return (
      <div style={{
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        minWidth: isRound16 ? '160px' : '140px',
        fontSize: isRound16 ? '12px' : '11px'
      }}>
        {/* Home Team */}
        <div style={{
          padding: isRound16 ? '8px 10px' : '6px 8px',
          borderBottom: '1px solid #f0f0f0',
          background: winner === 'home' ? '#eff6ff' : 'white',
          display: 'flex',
          alignItems: 'center',
          gap: isRound16 ? '6px' : '4px',
          minHeight: isRound16 ? '32px' : '26px'
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: isRound16 ? '12px' : '10px',
              fontWeight: '500',
              color: '#333',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {match.home ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{getFlag(match.home)}</span>
                  <span>{match.home}</span>
                </div>
              ) : 'TBD'}
            </div>
          </div>
          {isEditable && (
            <input
              type="number"
              min="0"
              max="20"
              value={sim.team1_goals}
              onChange={(e) => onScoreChange(match.id, 'team1_goals', e.target.value)}
              style={{
                width: isRound16 ? '32px' : '28px',
                padding: '3px',
                fontSize: isRound16 ? '11px' : '10px',
                fontWeight: 'bold',
                border: `1px solid ${PRIMARY}`,
                borderRadius: '3px',
                textAlign: 'center'
              }}
            />
          )}
          {!isEditable && winner === 'home' && <div style={{ fontSize: '11px', color: '#059669', fontWeight: 'bold' }}>✓</div>}
          {!isEditable && winner && <div style={{ fontSize: '10px', color: '#666' }}>{sim.team1_goals}</div>}
        </div>

        {/* Away Team */}
        <div style={{
          padding: isRound16 ? '8px 10px' : '6px 8px',
          background: winner === 'away' ? '#fff3e9' : 'white',
          display: 'flex',
          alignItems: 'center',
          gap: isRound16 ? '6px' : '4px',
          minHeight: isRound16 ? '32px' : '26px'
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: isRound16 ? '12px' : '10px',
              fontWeight: '500',
              color: '#333',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {match.away ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{getFlag(match.away)}</span>
                  <span>{match.away}</span>
                </div>
              ) : 'TBD'}
            </div>
          </div>
          {isEditable && (
            <input
              type="number"
              min="0"
              max="20"
              value={sim.team2_goals}
              onChange={(e) => onScoreChange(match.id, 'team2_goals', e.target.value)}
              style={{
                width: isRound16 ? '32px' : '28px',
                padding: '3px',
                fontSize: isRound16 ? '11px' : '10px',
                fontWeight: 'bold',
                border: `1px solid ${PRIMARY}`,
                borderRadius: '3px',
                textAlign: 'center'
              }}
            />
          )}
          {!isEditable && winner === 'away' && <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 'bold' }}>✓</div>}
          {!isEditable && winner && <div style={{ fontSize: '10px', color: '#666' }}>{sim.team2_goals}</div>}
        </div>
      </div>
    );
  };

  const PhaseSection = ({ title, icon, matches, matchesData, isEditable = false, phaseId = '' }) => (
    <div style={{ marginBottom: '30px' }}>
      <div
        onClick={() => setExpandedPhase(expandedPhase === phaseId ? '' : phaseId)}
        style={{
          background: GRADIENT,
          color: 'white',
          padding: '12px 15px',
          borderRadius: '6px',
          fontWeight: 'bold',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          userSelect: 'none'
        }}
      >
        <span>{icon} {title} ({matches.length} match{matches.length !== 1 ? 'es' : ''})</span>
        <span style={{ fontSize: '12px' }}>{expandedPhase === phaseId ? '▼' : '▶'}</span>
      </div>

      {expandedPhase === phaseId && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${isEditable ? '180px' : '160px'}, 1fr))`,
          gap: '12px',
          background: '#f9f9f9',
          padding: '15px',
          borderRadius: '6px'
        }}>
          {matchesData.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              isEditable={isEditable}
              isRound16={isEditable}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ marginBottom: '50px' }}>
      <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '20px', fontWeight: 'bold' }}>
        🏆 Phase Éliminatoire
      </h2>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
      }}>
        {/* 16ème */}
        <PhaseSection
          icon="🥊"
          title="16ème de Finale"
          matches={generateBracket.round16}
          matchesData={generateBracket.round16}
          isEditable={true}
          phaseId="r16"
        />

        {/* 8ème */}
        <PhaseSection
          icon="⚡"
          title="8ème de Finale"
          matches={generateBracket.round8}
          matchesData={generateBracket.round8.map(m => ({
            id: m.id,
            home: generateBracket.getWinnerTeam(m.prevMatches[0].id),
            away: generateBracket.getWinnerTeam(m.prevMatches[1].id)
          }))}
          isEditable={false}
          phaseId="r8"
        />

        {/* Quarts */}
        <PhaseSection
          icon="🎯"
          title="Quart de Finale"
          matches={generateBracket.roundQF}
          matchesData={generateBracket.roundQF.map(m => ({
            id: m.id,
            home: generateBracket.getWinnerTeam(m.prevMatches[0].id),
            away: generateBracket.getWinnerTeam(m.prevMatches[1].id)
          }))}
          isEditable={false}
          phaseId="qf"
        />

        {/* Semis */}
        <PhaseSection
          icon="🏅"
          title="Demi-Finale"
          matches={generateBracket.roundSF}
          matchesData={generateBracket.roundSF.map(m => ({
            id: m.id,
            home: generateBracket.getWinnerTeam(m.prevMatches[0].id),
            away: generateBracket.getWinnerTeam(m.prevMatches[1].id)
          }))}
          isEditable={false}
          phaseId="sf"
        />

        {/* Final */}
        <PhaseSection
          icon="👑"
          title="Finale"
          matches={generateBracket.roundFinal}
          matchesData={generateBracket.roundFinal.map(m => ({
            id: m.id,
            home: generateBracket.getWinnerTeam(m.prevMatches[0].id),
            away: generateBracket.getWinnerTeam(m.prevMatches[1].id)
          }))}
          isEditable={false}
          phaseId="final"
        />

        {/* 3e place */}
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #eee' }}>
          <div style={{
            background: '#fef3c7',
            color: '#92400e',
            padding: '12px 15px',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '14px',
            marginBottom: '12px'
          }}>
            🥉 Match pour la 3ème place
          </div>
          <div style={{
            background: '#f9f9f9',
            padding: '15px',
            borderRadius: '6px'
          }}>
            <MatchCard
              match={{
                id: 'third',
                home: generateBracket.getWinnerTeam(generateBracket.roundSF[0].id),
                away: generateBracket.getWinnerTeam(generateBracket.roundSF[1].id)
              }}
              isEditable={false}
            />
          </div>
        </div>
      </div>

      {/* Help text */}
      <div style={{
        marginTop: '20px',
        background: '#eff6ff',
        padding: '15px',
        borderRadius: '8px',
        border: `1px solid ${PRIMARY}`,
        fontSize: '13px',
        color: '#1e40af',
        textAlign: 'center'
      }}>
        💡 Cliquez sur chaque phase pour voir les matchs. Entrez les scores des 16ème pour calculer automatiquement les phases suivantes!
      </div>
    </div>
  );
}

export default KOBracket;
