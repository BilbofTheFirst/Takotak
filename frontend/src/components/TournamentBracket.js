import React, { useMemo, useCallback } from 'react';

function TournamentBracket({ groupsData, allThirdPlaces, koSimulations, onScoreChange, PRIMARY, SECONDARY, GRADIENT }) {
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  // Simple team name to flag
  const teamFlags = {
    'Belgique': '🇧🇪', 'Canada': '🇨🇦', 'Mexique': '🇲🇽', 'Afrique du Sud': '🇿🇦',
    'Corée du Sud': '🇰🇷', 'République tchèque': '🇨🇿', 'Bosnie-Herzégovine': '🇧🇦',
    'Qatar': '🇶🇦', 'Suisse': '🇨🇭', 'Brésil': '🇧🇷', 'Maroc': '🇲🇦',
    'Haïti': '🇭🇹', 'Écosse': '🇬🇧', 'États-Unis': '🇺🇸', 'Paraguay': '🇵🇾',
    'Australie': '🇦🇺', 'Turquie': '🇹🇷', 'Allemagne': '🇩🇪', 'Curaçao': '🇨🇼',
    'Côte d\'Ivoire': '🇨🇮', 'Équateur': '🇪🇨', 'Pays-Bas': '🇳🇱', 'Japon': '🇯🇵',
    'Suède': '🇸🇪', 'Tunisie': '🇹🇳', 'Égypte': '🇪🇬', 'Iran': '🇮🇷',
    'Nouvelle-Zélande': '🇳🇿', 'Espagne': '🇪🇸', 'Cap-Vert': '🇨🇻',
    'Arabie saoudite': '🇸🇦', 'Uruguay': '🇺🇾', 'France': '🇫🇷', 'Sénégal': '🇸🇳',
    'Irak': '🇮🇶', 'Norvège': '🇳🇴', 'Argentine': '🇦🇷', 'Algérie': '🇩🇿',
    'Autriche': '🇦🇹', 'Jordanie': '🇯🇴', 'Portugal': '🇵🇹', 'RD Congo': '🇨🇩',
    'Ouzbékistan': '🇺🇿', 'Colombie': '🇨🇴', 'Angleterre': '🇬🇧', 'Croatie': '🇭🇷',
    'Ghana': '🇬🇭', 'Panama': '🇵🇦'
  };

  const getFlag = (team) => teamFlags[team] || '🌍';

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

  const getWinner = useCallback((matchId) => {
    const sim = koSimulations[matchId];
    if (!sim || sim.team1_goals === undefined || sim.team2_goals === undefined) return null;
    if (sim.team1_goals === sim.team2_goals) return null;
    return sim.team1_goals > sim.team2_goals ? 'home' : 'away';
  }, [koSimulations]);

  const getWinnerTeam = useCallback((matchId) => {
    const match = bracket.round16.find(m => m.id === matchId);
    if (!match) return null;
    const winner = getWinner(matchId);
    return winner === 'home' ? match.home : winner === 'away' ? match.away : null;
  }, [bracket, getWinner]);

  const MatchTeam = ({ team, isWinner = false, isEditable = false, goals, onGoalsChange }) => (
    <div style={{
      padding: '6px 8px',
      borderBottom: '1px solid #e0e0e0',
      background: isWinner ? '#eff6ff' : 'white',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      minHeight: '28px'
    }}>
      <div style={{
        flex: 1,
        minWidth: 0,
        fontSize: '11px',
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
          value={goals || 0}
          onChange={(e) => onGoalsChange(e.target.value)}
          style={{
            width: '32px',
            padding: '3px',
            fontSize: '10px',
            fontWeight: 'bold',
            border: `1px solid ${PRIMARY}`,
            borderRadius: '3px',
            textAlign: 'center'
          }}
        />
      )}
      {isWinner && !isEditable && <div style={{ fontSize: '12px', color: '#059669', fontWeight: 'bold' }}>✓</div>}
    </div>
  );

  const MatchCard = ({ match, isEditable = false, onHome, onAway }) => {
    const sim = koSimulations[match.id] || { team1_goals: 0, team2_goals: 0 };
    const winner = getWinner(match.id);

    return (
      <div style={{
        background: 'white',
        border: '1px solid #d0d0d0',
        borderRadius: '4px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        minWidth: '140px'
      }}>
        <MatchTeam team={match.home} isWinner={winner === 'home'} isEditable={isEditable} goals={sim.team1_goals} onGoalsChange={onHome} />
        <MatchTeam team={match.away} isWinner={winner === 'away'} isEditable={isEditable} goals={sim.team2_goals} onGoalsChange={onAway} />
      </div>
    );
  };

  const round8 = [
    { id: 'r8_1', prev: ['r16_1', 'r16_2'] },
    { id: 'r8_2', prev: ['r16_3', 'r16_4'] },
    { id: 'r8_3', prev: ['r16_5', 'r16_6'] },
    { id: 'r8_4', prev: ['r16_7', 'r16_8'] },
    { id: 'r8_5', prev: ['r16_9', 'r16_10'] },
    { id: 'r8_6', prev: ['r16_11', 'r16_12'] },
    { id: 'r8_7', prev: ['r16_13', 'r16_14'] },
    { id: 'r8_8', prev: ['r16_15', 'r16_16'] }
  ];

  const round4 = [
    { id: 'qf_1', prev: ['r8_1', 'r8_2'] },
    { id: 'qf_2', prev: ['r8_3', 'r8_4'] },
    { id: 'qf_3', prev: ['r8_5', 'r8_6'] },
    { id: 'qf_4', prev: ['r8_7', 'r8_8'] }
  ];

  const round2 = [
    { id: 'sf_1', prev: ['qf_1', 'qf_2'] },
    { id: 'sf_2', prev: ['qf_3', 'qf_4'] }
  ];

  return (
    <div style={{ marginBottom: '50px' }}>
      <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '20px', fontWeight: 'bold' }}>
        🏆 Phase Éliminatoire - Bracket Officiel
      </h2>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        overflowX: 'auto'
      }}>
        <div style={{ minWidth: '1000px' }}>
          {/* Headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '180px 140px 120px 120px 120px',
            gap: '20px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: PRIMARY }}>🥊 16ème</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: PRIMARY }}>⚡ 8ème</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: PRIMARY }}>🎯 Quarts</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: PRIMARY }}>🏅 Semis</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: PRIMARY }}>👑 FINAL</div>
          </div>

          {/* Bracket */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '180px 140px 120px 120px 120px',
            gap: '20px'
          }}>
            {/* 16ème */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {bracket.round16.map(m => (
                <MatchCard
                  key={m.id}
                  match={m}
                  isEditable={true}
                  onHome={(val) => onScoreChange(m.id, 'team1_goals', val)}
                  onAway={(val) => onScoreChange(m.id, 'team2_goals', val)}
                />
              ))}
            </div>

            {/* 8ème */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '60px', paddingTop: '15px' }}>
              {round8.map(m => {
                const home = getWinnerTeam(m.prev[0]);
                const away = getWinnerTeam(m.prev[1]);
                return (
                  <MatchCard
                    key={m.id}
                    match={{ id: m.id, home, away }}
                    isEditable={true}
                    onHome={(val) => onScoreChange(m.id, 'team1_goals', val)}
                    onAway={(val) => onScoreChange(m.id, 'team2_goals', val)}
                  />
                );
              })}
            </div>

            {/* Quarts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '120px', paddingTop: '90px' }}>
              {round4.map(m => {
                const home = getWinnerTeam(m.prev[0]);
                const away = getWinnerTeam(m.prev[1]);
                return (
                  <MatchCard
                    key={m.id}
                    match={{ id: m.id, home, away }}
                    isEditable={true}
                    onHome={(val) => onScoreChange(m.id, 'team1_goals', val)}
                    onAway={(val) => onScoreChange(m.id, 'team2_goals', val)}
                  />
                );
              })}
            </div>

            {/* Semis */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '240px', paddingTop: '180px' }}>
              {round2.map(m => {
                const home = getWinnerTeam(m.prev[0]);
                const away = getWinnerTeam(m.prev[1]);
                return (
                  <MatchCard
                    key={m.id}
                    match={{ id: m.id, home, away }}
                    isEditable={true}
                    onHome={(val) => onScoreChange(m.id, 'team1_goals', val)}
                    onAway={(val) => onScoreChange(m.id, 'team2_goals', val)}
                  />
                );
              })}
            </div>

            {/* Final */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '210px' }}>
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
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: PRIMARY, marginBottom: '12px' }}>
          🥉 Match pour la 3ème place
        </h3>
        <div style={{ maxWidth: '140px' }}>
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

      <div style={{
        marginTop: '20px',
        background: 'linear-gradient(135deg, #eff6ff 0%, #fce7f3 100%)',
        padding: '15px',
        borderRadius: '8px',
        border: `1px solid ${PRIMARY}`,
        fontSize: '12px',
        color: '#1e40af'
      }}>
        💡 Entrez les scores pour TOUS les matchs. Les gagnants remontent automatiquement!
      </div>
    </div>
  );
}

export default TournamentBracket;
