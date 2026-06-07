import React, { useMemo, useState, useCallback } from 'react';

function TournamentBracket({ groupsData, allThirdPlaces, koSimulations, onScoreChange, PRIMARY, SECONDARY, GRADIENT }) {
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  // Emoji flags - convert country codes to emojis
  const countryCodeToFlag = {
    'ZA': '🇿🇦', 'DZ': '🇩🇿', 'DE': '🇩🇪', 'GB': '🇬🇧', 'SA': '🇸🇦', 'AR': '🇦🇷',
    'AU': '🇦🇺', 'AT': '🇦🇹', 'BE': '🇧🇪', 'BA': '🇧🇦', 'BR': '🇧🇷', 'CA': '🇨🇦',
    'CV': '🇨🇻', 'CL': '🇨🇱', 'CO': '🇨🇴', 'KR': '🇰🇷', 'CI': '🇨🇮', 'HR': '🇭🇷',
    'CW': '🇨🇼', 'EG': '🇪🇬', 'ES': '🇪🇸', 'US': '🇺🇸', 'FR': '🇫🇷', 'GH': '🇬🇭',
    'HT': '🇭🇹', 'HU': '🇭🇺', 'IQ': '🇮🇶', 'IR': '🇮🇷', 'IE': '🇮🇪', 'IS': '🇮🇸',
    'IL': '🇮🇱', 'IT': '🇮🇹', 'JM': '🇯🇲', 'JP': '🇯🇵', 'JO': '🇯🇴', 'KZ': '🇰🇿',
    'MW': '🇲🇼', 'ML': '🇲🇱', 'MA': '🇲🇦', 'MX': '🇲🇽', 'MD': '🇲🇩', 'ME': '🇲🇪',
    'MZ': '🇲🇿', 'NP': '🇳🇵', 'NZ': '🇳🇿', 'NO': '🇳🇴', 'OM': '🇴🇲', 'UZ': '🇺🇿',
    'PS': '🇵🇸', 'PA': '🇵🇦', 'PG': '🇵🇬', 'PY': '🇵🇾', 'NL': '🇳🇱', 'PE': '🇵🇪',
    'PH': '🇵🇭', 'PL': '🇵🇱', 'PT': '🇵🇹', 'QA': '🇶🇦', 'RO': '🇷🇴', 'RU': '🇷🇺',
    'RW': '🇷🇼', 'EH': '🇪🇭', 'SV': '🇸🇻', 'WS': '🇼🇸', 'AS': '🇦🇸', 'SM': '🇸🇲',
    'SN': '🇸🇳', 'RS': '🇷🇸', 'SC': '🇸🇨', 'SL': '🇸🇱', 'SG': '🇸🇬', 'SX': '🇸🇽',
    'SK': '🇸🇰', 'SI': '🇸🇮', 'SO': '🇸🇴', 'SD': '🇸🇩', 'SS': '🇸🇸', 'LK': '🇱🇰',
    'SE': '🇸🇪', 'CH': '🇨🇭', 'SR': '🇸🇷', 'SZ': '🇸🇿', 'SY': '🇸🇾', 'TJ': '🇹🇯',
    'TW': '🇹🇼', 'TZ': '🇹🇿', 'TD': '🇹🇩', 'TH': '🇹🇭', 'TL': '🇹🇱', 'TG': '🇹🇬',
    'TK': '🇹🇰', 'TO': '🇹🇴', 'TT': '🇹🇹', 'TN': '🇹🇳', 'TM': '🇹🇲', 'TR': '🇹🇷',
    'TV': '🇹🇻', 'UA': '🇺🇦', 'KM': '🇰🇲', 'UY': '🇺🇾', 'VU': '🇻🇺', 'VA': '🇻🇦',
    'VE': '🇻🇪', 'VN': '🇻🇳', 'WF': '🇼🇫', 'YE': '🇾🇪', 'ZM': '🇿🇲', 'ZW': '🇿🇼',
    'CZ': '🇨🇿', 'EC': '🇪🇨', 'SC': '🇬🇧'
  };

  // Fallback team name to flag
  const teamNameToFlag = {
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
    // Try team name first
    if (teamNameToFlag[team]) return teamNameToFlag[team];
    // Try country code
    if (team.length <= 2 && countryCodeToFlag[team.toUpperCase()]) {
      return countryCodeToFlag[team.toUpperCase()];
    }
    return '🌍';
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

    // 16ème - Using correct order from 2026 World Cup bracket
    const round16 = [
      { id: 'r16_1', home: firstPlaces['A'], away: secondPlaces['B'], round: '16ème' },
      { id: 'r16_2', home: firstPlaces['C'], away: secondPlaces['D'], round: '16ème' },
      { id: 'r16_3', home: firstPlaces['E'], away: secondPlaces['F'], round: '16ème' },
      { id: 'r16_4', home: firstPlaces['G'], away: secondPlaces['H'], round: '16ème' },
      { id: 'r16_5', home: firstPlaces['B'], away: secondPlaces['A'], round: '16ème' },
      { id: 'r16_6', home: firstPlaces['D'], away: secondPlaces['C'], round: '16ème' },
      { id: 'r16_7', home: firstPlaces['F'], away: secondPlaces['E'], round: '16ème' },
      { id: 'r16_8', home: firstPlaces['H'], away: secondPlaces['G'], round: '16ème' },
      { id: 'r16_9', home: firstPlaces['I'], away: secondPlaces['J'], round: '16ème' },
      { id: 'r16_10', home: firstPlaces['K'], away: secondPlaces['L'], round: '16ème' },
      { id: 'r16_11', home: firstPlaces['J'], away: secondPlaces['I'], round: '16ème' },
      { id: 'r16_12', home: firstPlaces['L'], away: secondPlaces['K'], round: '16ème' },
      { id: 'r16_13', home: qualifiedThirds[0]?.team, away: firstPlaces['B'], round: '16ème' },
      { id: 'r16_14', home: qualifiedThirds[1]?.team, away: firstPlaces['D'], round: '16ème' },
      { id: 'r16_15', home: qualifiedThirds[2]?.team, away: firstPlaces['F'], round: '16ème' },
      { id: 'r16_16', home: qualifiedThirds[3]?.team, away: firstPlaces['H'], round: '16ème' }
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
    if (!bracket.round16) return null;
    const allMatches = bracket.round16;
    const match = allMatches.find(m => m.id === matchId);
    if (!match) return null;
    const winner = getWinner(matchId);
    return winner === 'home' ? match.home : winner === 'away' ? match.away : null;
  }, [bracket, getWinner]);

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
          value={goals || 0}
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

  // KO structure - each round winners
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

  const final = {
    id: 'final',
    prev: ['sf_1', 'sf_2']
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
        <div style={{ minWidth: '1600px' }}>
          {/* Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '40px', marginBottom: '30px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: PRIMARY }}>🥊 16ème</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: PRIMARY }}>⚡ 8ème</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: PRIMARY }}>🎯 Quarts</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: PRIMARY }}>🏅 Semis</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: PRIMARY }}>👑 FINAL</div>
          </div>

          {/* Matches */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '40px', alignItems: 'start' }}>
            {/* 16ème */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
              {bracket.round16.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  isEditable={true}
                  onHome={(val) => onScoreChange(match.id, 'team1_goals', val)}
                  onAway={(val) => onScoreChange(match.id, 'team2_goals', val)}
                />
              ))}
            </div>

            {/* 8ème */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '200px', paddingTop: '100px' }}>
              {round8.map(matchup => {
                const home = getWinnerTeam(matchup.prev[0]);
                const away = getWinnerTeam(matchup.prev[1]);
                return (
                  <MatchCard
                    key={matchup.id}
                    match={{ id: matchup.id, home, away }}
                    isEditable={true}
                    onHome={(val) => onScoreChange(matchup.id, 'team1_goals', val)}
                    onAway={(val) => onScoreChange(matchup.id, 'team2_goals', val)}
                  />
                );
              })}
            </div>

            {/* Quarts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '400px', paddingTop: '350px' }}>
              {round4.map(matchup => {
                const home = getWinnerTeam(matchup.prev[0]);
                const away = getWinnerTeam(matchup.prev[1]);
                return (
                  <MatchCard
                    key={matchup.id}
                    match={{ id: matchup.id, home, away }}
                    isEditable={true}
                    onHome={(val) => onScoreChange(matchup.id, 'team1_goals', val)}
                    onAway={(val) => onScoreChange(matchup.id, 'team2_goals', val)}
                  />
                );
              })}
            </div>

            {/* Semis */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '800px', paddingTop: '750px' }}>
              {round2.map(matchup => {
                const home = getWinnerTeam(matchup.prev[0]);
                const away = getWinnerTeam(matchup.prev[1]);
                return (
                  <MatchCard
                    key={matchup.id}
                    match={{ id: matchup.id, home, away }}
                    isEditable={true}
                    onHome={(val) => onScoreChange(matchup.id, 'team1_goals', val)}
                    onAway={(val) => onScoreChange(matchup.id, 'team2_goals', val)}
                  />
                );
              })}
            </div>

            {/* Final */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '850px' }}>
              <MatchCard
                match={{
                  id: final.id,
                  home: getWinnerTeam(final.prev[0]),
                  away: getWinnerTeam(final.prev[1])
                }}
                isEditable={true}
                onHome={(val) => onScoreChange(final.id, 'team1_goals', val)}
                onAway={(val) => onScoreChange(final.id, 'team2_goals', val)}
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
        💡 <strong>Entrez les scores pour TOUS les matchs.</strong> Les gagnants remontent automatiquement! 🚀
      </div>
    </div>
  );
}

export default TournamentBracket;
