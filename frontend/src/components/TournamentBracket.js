import React, { useMemo, useState } from 'react';

function TournamentBracket({ groupsData, allThirdPlaces, koSimulations, onScoreChange, PRIMARY, SECONDARY, GRADIENT }) {
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  // Emoji flags mapping (fallback if DB doesn't provide them)
  const flagMap = {
    'Mexique': '🇲🇽', 'Afrique du Sud': '🇿🇦', 'Corée du Sud': '🇰🇷', 'République tchèque': '🇨🇿',
    'Canada': '🇨🇦', 'Bosnie-Herzégovine': '🇧🇦', 'Qatar': '🇶🇦', 'Suisse': '🇨🇭',
    'Brésil': '🇧🇷', 'Maroc': '🇲🇦', 'Haïti': '🇭🇹', 'Écosse': '🇬🇧',
    'États-Unis': '🇺🇸', 'Paraguay': '🇵🇾', 'Australie': '🇦🇺', 'Turquie': '🇹🇷',
    'Allemagne': '🇩🇪', 'Curaçao': '🇨🇼', 'Côte d\'Ivoire': '🇨🇮', 'Équateur': '🇪🇨',
    'Pays-Bas': '🇳🇱', 'Japon': '🇯🇵', 'Suède': '🇸🇪', 'Tunisie': '🇹🇳',
    'Belgique': '🇧🇪', 'Égypte': '🇪🇬', 'Iran': '🇮🇷', 'Nouvelle-Zélande': '🇳🇿',
    'Espagne': '🇪🇸', 'Cap-Vert': '🇨🇻', 'Arabie saoudite': '🇸🇦', 'Uruguay': '🇺🇾',
    'France': '🇫🇷', 'Sénégal': '🇸🇳', 'Irak': '🇮🇶', 'Norvège': '🇳🇴',
    'Argentine': '🇦🇷', 'Algérie': '🇩🇿', 'Autriche': '🇦🇹', 'Jordanie': '🇯🇴',
    'Portugal': '🇵🇹', 'RD Congo': '🇨🇩', 'Ouzbékistan': '🇺🇿', 'Colombie': '🇨🇴',
    'Angleterre': '🇬🇧', 'Croatie': '🇭🇷', 'Ghana': '🇬🇭', 'Panama': '🇵🇦'
  };

  const getFlag = (team) => {
    if (!team) return '🌍';
    return flagMap[team] || '🌍';
  };

  const bracket = useMemo(() => {
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
      { id: 'r16_1', home: firstPlaces['A'], away: secondPlaces['B'] },
      { id: 'r16_2', home: firstPlaces['C'], away: secondPlaces['D'] },
      { id: 'r16_3', home: firstPlaces['E'], away: secondPlaces['F'] },
      { id: 'r16_4', home: firstPlaces['G'], away: secondPlaces['H'] },
      { id: 'r16_5', home: firstPlaces['B'], away: secondPlaces['A'] },
      { id: 'r16_6', home: firstPlaces['D'], away: secondPlaces['C'] },
      { id: 'r16_7', home: firstPlaces['F'], away: secondPlaces['E'] },
      { id: 'r16_8', home: firstPlaces['H'], away: secondPlaces['G'] },
      { id: 'r16_9', home: firstPlaces['I'], away: secondPlaces['J'] },
      { id: 'r16_10', home: firstPlaces['K'], away: secondPlaces['L'] },
      { id: 'r16_11', home: firstPlaces['J'], away: secondPlaces['I'] },
      { id: 'r16_12', home: firstPlaces['L'], away: secondPlaces['K'] },
      { id: 'r16_13', home: qualifiedThirds[0]?.team, away: firstPlaces['B'] },
      { id: 'r16_14', home: qualifiedThirds[1]?.team, away: firstPlaces['D'] },
      { id: 'r16_15', home: qualifiedThirds[2]?.team, away: firstPlaces['F'] },
      { id: 'r16_16', home: qualifiedThirds[3]?.team, away: firstPlaces['H'] }
    ];

    return { round16 };
  }, [groupsData, allThirdPlaces]);

  const getWinner = (matchId) => {
    const sim = koSimulations[matchId];
    if (!sim || sim.team1_goals === sim.team2_goals) return null;
    return sim.team1_goals > sim.team2_goals ? 'home' : 'away';
  };

  const getWinnerTeam = (matchId) => {
    if (!bracket.round16) return null;
    const match = bracket.round16.find(m => m.id === matchId);
    if (!match) return null;
    const winner = getWinner(matchId);
    return winner === 'home' ? match.home : winner === 'away' ? match.away : null;
  };

  // 8ème matchups
  const round8Matchups = [
    { id: 'r8_1', prev1: 'r16_1', prev2: 'r16_2' },
    { id: 'r8_2', prev1: 'r16_3', prev2: 'r16_4' },
    { id: 'r8_3', prev1: 'r16_5', prev2: 'r16_6' },
    { id: 'r8_4', prev1: 'r16_7', prev2: 'r16_8' },
    { id: 'r8_5', prev1: 'r16_9', prev2: 'r16_10' },
    { id: 'r8_6', prev1: 'r16_11', prev2: 'r16_12' },
    { id: 'r8_7', prev1: 'r16_13', prev2: 'r16_14' },
    { id: 'r8_8', prev1: 'r16_15', prev2: 'r16_16' }
  ];

  const MatchTeam = ({ team, isWinner = false, isEditable = false, goals, onGoalsChange }) => (
    <div
      style={{
        padding: '8px 10px',
        borderBottom: '1px solid #e0e0e0',
        background: isWinner ? '#eff6ff' : 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minHeight: '32px'
      }}
    >
      <div style={{
        flex: 1,
        minWidth: 0,
        fontSize: '12px',
        fontWeight: '500',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {getFlag(team)} {team || 'TBD'}
      </div>
      {isEditable && (
        <input
          type="number"
          min="0"
          max="20"
          value={goals}
          onChange={(e) => onGoalsChange(e.target.value)}
          style={{
            width: '35px',
            padding: '4px',
            fontSize: '11px',
            fontWeight: 'bold',
            border: `1px solid ${PRIMARY}`,
            borderRadius: '3px',
            textAlign: 'center'
          }}
        />
      )}
      {isWinner && !isEditable && <div style={{ fontSize: '14px', color: '#059669', fontWeight: 'bold' }}>✓</div>}
    </div>
  );

  const MatchCard = ({ match, isEditable = false, onHome, onAway }) => {
    const sim = koSimulations[match.id] || { team1_goals: 0, team2_goals: 0 };
    const winner = getWinner(match.id);

    return (
      <div
        style={{
          background: 'white',
          border: '1px solid #d0d0d0',
          borderRadius: '6px',
          overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          minWidth: '160px'
        }}
      >
        <MatchTeam
          team={match.home}
          isWinner={winner === 'home'}
          isEditable={isEditable}
          goals={sim.team1_goals}
          onGoalsChange={onHome}
        />
        <MatchTeam
          team={match.away}
          isWinner={winner === 'away'}
          isEditable={isEditable}
          goals={sim.team2_goals}
          onGoalsChange={onAway}
        />
      </div>
    );
  };

  return (
    <div style={{ marginBottom: '50px' }}>
      <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '30px', fontWeight: 'bold' }}>
        🏆 Phase Éliminatoire - Bracket Officiel
      </h2>

      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          overflowX: 'auto'
        }}
      >
        {/* Main Bracket Grid */}
        <div style={{ minWidth: '1400px' }}>
          {/* Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '30px', marginBottom: '30px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: PRIMARY, textAlign: 'center' }}>🥊 16ème (16)</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: PRIMARY, textAlign: 'center' }}>⚡ 8ème (8)</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: PRIMARY, textAlign: 'center' }}>🎯 Quarts (4)</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: PRIMARY, textAlign: 'center' }}>🏅 Semis (2)</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: PRIMARY, textAlign: 'center' }}>👑 FINALE</div>
          </div>

          {/* Matches Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '30px' }}>
            {/* 16ème - Column 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
              {bracket.round16.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  isEditable={true}
                  onHome={(val) => onScoreChange(match.id, 'team1_goals', val)}
                  onAway={(val) => onScoreChange(match.id, 'team2_goals', val)}
                />
              ))}
            </div>

            {/* 8ème - Column 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', paddingTop: '100px' }}>
              {round8Matchups.map(matchup => (
                <MatchCard
                  key={matchup.id}
                  match={{
                    id: matchup.id,
                    home: getWinnerTeam(matchup.prev1),
                    away: getWinnerTeam(matchup.prev2)
                  }}
                  isEditable={true}
                  onHome={(val) => onScoreChange(matchup.id, 'team1_goals', val)}
                  onAway={(val) => onScoreChange(matchup.id, 'team2_goals', val)}
                />
              ))}
            </div>

            {/* Quarts - Column 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '200px', paddingTop: '300px' }}>
              {[
                { id: 'qf_1', prev1: 'r8_1', prev2: 'r8_2' },
                { id: 'qf_2', prev1: 'r8_3', prev2: 'r8_4' },
                { id: 'qf_3', prev1: 'r8_5', prev2: 'r8_6' },
                { id: 'qf_4', prev1: 'r8_7', prev2: 'r8_8' }
              ].map(matchup => (
                <MatchCard
                  key={matchup.id}
                  match={{
                    id: matchup.id,
                    home: getWinnerTeam(matchup.prev1),
                    away: getWinnerTeam(matchup.prev2)
                  }}
                  isEditable={true}
                  onHome={(val) => onScoreChange(matchup.id, 'team1_goals', val)}
                  onAway={(val) => onScoreChange(matchup.id, 'team2_goals', val)}
                />
              ))}
            </div>

            {/* Semis - Column 4 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '500px', paddingTop: '500px' }}>
              {[
                { id: 'sf_1', prev1: 'qf_1', prev2: 'qf_2' },
                { id: 'sf_2', prev1: 'qf_3', prev2: 'qf_4' }
              ].map(matchup => (
                <MatchCard
                  key={matchup.id}
                  match={{
                    id: matchup.id,
                    home: getWinnerTeam(matchup.prev1),
                    away: getWinnerTeam(matchup.prev2)
                  }}
                  isEditable={true}
                  onHome={(val) => onScoreChange(matchup.id, 'team1_goals', val)}
                  onAway={(val) => onScoreChange(matchup.id, 'team2_goals', val)}
                />
              ))}
            </div>

            {/* Final - Column 5 */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '550px' }}>
              <MatchCard
                match={{
                  id: 'final',
                  home: getWinnerTeam('sf_1'),
                  away: getWinnerTeam('sf_2')
                }}
                isEditable={true}
                onHome={(val) => onScoreChange('final', 'team1_goals', val)}
                onAway={(val) => onScoreChange('final', 'team2_goals', val)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3e Place */}
      <div style={{ marginTop: '40px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: PRIMARY, marginBottom: '15px' }}>
          🥉 Match pour la 3ème place
        </h3>
        <div style={{ maxWidth: '200px' }}>
          <MatchCard
            match={{
              id: 'third',
              home: getWinnerTeam('sf_2'),
              away: getWinnerTeam('sf_1')
            }}
            isEditable={true}
            onHome={(val) => onScoreChange('third', 'team1_goals', val)}
            onAway={(val) => onScoreChange('third', 'team2_goals', val)}
          />
        </div>
      </div>

      {/* Info */}
      <div
        style={{
          marginTop: '30px',
          background: 'linear-gradient(135deg, #eff6ff 0%, #fce7f3 100%)',
          padding: '20px',
          borderRadius: '8px',
          border: `1px solid ${PRIMARY}`,
          fontSize: '13px',
          color: '#1e40af'
        }}
      >
        💡 <strong>Comment ça marche:</strong> Entrez les scores pour TOUS les matchs. Les gagnants remontent automatiquement dans les phases suivantes! 🚀
      </div>
    </div>
  );
}

export default TournamentBracket;
