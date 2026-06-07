import React, { useEffect, useState, useMemo } from 'react';
import { matchesService, predictionsService } from '../services/api';
import { getCountryFlag } from '../utils/flags';
import TournamentBracket from '../components/TournamentBracket';

function Simulation() {
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [simulations, setSimulations] = useState({});
  const [koSimulations, setKoSimulations] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');

  const PRIMARY = '#2563eb';
  const SECONDARY = '#ec4899';
  const GRADIENT = `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`;

  // Charger les simulations depuis localStorage
  useEffect(() => {
    loadData();
  }, []);

  // Sauvegarder automatiquement dans localStorage
  useEffect(() => {
    if (Object.keys(simulations).length > 0) {
      localStorage.setItem('takotak_simulations', JSON.stringify(simulations));
      localStorage.setItem('takotak_ko_simulations', JSON.stringify(koSimulations));
    }
  }, [simulations, koSimulations]);

  const loadData = async () => {
    try {
      const [matchesRes, predictionsRes] = await Promise.all([
        matchesService.getAll(),
        predictionsService.getAll()
      ]);

      const groupMatches = matchesRes.data.filter(m => m.id <= 72);
      setMatches(groupMatches);

      const predMap = {};
      const simMap = {};
      predictionsRes.data.forEach(p => {
        predMap[p.match_id] = p;
      });
      setPredictions(predMap);

      // Charger les simulations depuis localStorage
      const savedSims = localStorage.getItem('takotak_simulations');
      const savedKoSims = localStorage.getItem('takotak_ko_simulations');

      if (savedSims) {
        setSimulations(JSON.parse(savedSims));
      } else {
        groupMatches.forEach(match => {
          simMap[match.id] = { team1_goals: 0, team2_goals: 0 };
        });
        setSimulations(simMap);
      }

      if (savedKoSims) {
        setKoSimulations(JSON.parse(savedKoSims));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulationChange = (matchId, field, value) => {
    setSimulations(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: Math.max(0, Math.min(20, parseInt(value) || 0))
      }
    }));
  };

  const handleKoSimulationChange = (matchId, field, value) => {
    setKoSimulations(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId] || { team1_goals: 0, team2_goals: 0 },
        [field]: Math.max(0, Math.min(20, parseInt(value) || 0))
      }
    }));
  };

  const calculatePoints = (prediction, result) => {
    const { team1_goals: pred1, team2_goals: pred2 } = prediction;
    const { team1_goals: res1, team2_goals: res2 } = result;

    if (pred1 === res1 && pred2 === res2) return 3;
    if ((pred1 - pred2) === (res1 - res2)) return 2;

    const predTendency = pred1 > pred2 ? 'team1' : pred1 < pred2 ? 'team2' : 'draw';
    const resTendency = res1 > res2 ? 'team1' : res1 < res2 ? 'team2' : 'draw';
    if (predTendency === resTendency) return 1;

    return 0;
  };

  const getTeamsInGroup = (groupLetter) => {
    const groupIndex = groupLetter.charCodeAt(0) - 65;
    const startId = groupIndex * 6 + 1;
    const groupMatches = matches.filter(m => m.id >= startId && m.id < startId + 6);

    const teams = new Set();
    groupMatches.forEach(m => {
      teams.add(m.team1);
      teams.add(m.team2);
    });
    return Array.from(teams);
  };

  const calculateGroupStats = (groupLetter) => {
    const groupIndex = groupLetter.charCodeAt(0) - 65;
    const startId = groupIndex * 6 + 1;
    const groupMatches = matches.filter(m => m.id >= startId && m.id < startId + 6);

    const teams = getTeamsInGroup(groupLetter);
    const stats = {};

    teams.forEach(team => {
      stats[team] = {
        played: 0,
        won: 0,
        draw: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      };
    });

    groupMatches.forEach(match => {
      const sim = simulations[match.id] || { team1_goals: 0, team2_goals: 0 };
      const g1 = parseInt(sim.team1_goals) || 0;
      const g2 = parseInt(sim.team2_goals) || 0;

      stats[match.team1].played++;
      stats[match.team1].goalsFor += g1;
      stats[match.team1].goalsAgainst += g2;

      stats[match.team2].played++;
      stats[match.team2].goalsFor += g2;
      stats[match.team2].goalsAgainst += g1;

      if (g1 > g2) {
        stats[match.team1].won++;
        stats[match.team1].points += 3;
        stats[match.team2].lost++;
      } else if (g1 < g2) {
        stats[match.team2].won++;
        stats[match.team2].points += 3;
        stats[match.team1].lost++;
      } else {
        stats[match.team1].draw++;
        stats[match.team1].points += 1;
        stats[match.team2].draw++;
        stats[match.team2].points += 1;
      }
    });

    return stats;
  };

  const getGroupClassification = (groupLetter) => {
    const stats = calculateGroupStats(groupLetter);
    const teams = getTeamsInGroup(groupLetter);

    return teams
      .map(team => ({ team, ...stats[team] }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
      });
  };

  const groupsData = useMemo(() => {
    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const data = {};
    groups.forEach(g => {
      data[g] = getGroupClassification(g);
    });
    return data;
  }, [simulations, matches]);

  const allThirdPlaces = useMemo(() => {
    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const thirds = [];

    groups.forEach(groupLetter => {
      const classification = groupsData[groupLetter];
      if (classification.length >= 3) {
        thirds.push({
          team: classification[2].team,
          group: groupLetter,
          points: classification[2].points,
          gf: classification[2].goalsFor,
          ga: classification[2].goalsAgainst,
          diff: classification[2].goalsFor - classification[2].goalsAgainst
        });
      }
    });

    return thirds.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.diff - a.diff;
    });
  }, [groupsData]);

  const getKOMatchups = useMemo(() => {
    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

    const firstPlaces = {};
    const secondPlaces = {};
    groups.forEach(g => {
      const classification = groupsData[g];
      if (classification.length >= 2) {
        firstPlaces[g] = classification[0].team;
        secondPlaces[g] = classification[1].team;
      }
    });

    const qualifiedThirds = allThirdPlaces.slice(0, 4);

    const round16 = [
      { home: firstPlaces['A'], away: secondPlaces['B'], desc: 'GA1 - GB2', id: 'r16_1' },
      { home: firstPlaces['C'], away: secondPlaces['D'], desc: 'GC1 - GD2', id: 'r16_2' },
      { home: firstPlaces['E'], away: secondPlaces['F'], desc: 'GE1 - GF2', id: 'r16_3' },
      { home: firstPlaces['G'], away: secondPlaces['H'], desc: 'GG1 - GH2', id: 'r16_4' },
      { home: firstPlaces['B'], away: secondPlaces['A'], desc: 'GB1 - GA2', id: 'r16_5' },
      { home: firstPlaces['D'], away: secondPlaces['C'], desc: 'GD1 - GC2', id: 'r16_6' },
      { home: firstPlaces['F'], away: secondPlaces['E'], desc: 'GF1 - GE2', id: 'r16_7' },
      { home: firstPlaces['H'], away: secondPlaces['G'], desc: 'GH1 - GG2', id: 'r16_8' },
      { home: firstPlaces['I'], away: secondPlaces['J'], desc: 'GI1 - GJ2', id: 'r16_9' },
      { home: firstPlaces['K'], away: secondPlaces['L'], desc: 'GK1 - GL2', id: 'r16_10' },
      { home: firstPlaces['J'], away: secondPlaces['I'], desc: 'GJ1 - GI2', id: 'r16_11' },
      { home: firstPlaces['L'], away: secondPlaces['K'], desc: 'GL1 - GK2', id: 'r16_12' },
      { home: qualifiedThirds[0]?.team, away: firstPlaces['B'], desc: '3e1 - GB1', id: 'r16_13' },
      { home: qualifiedThirds[1]?.team, away: firstPlaces['D'], desc: '3e2 - GD1', id: 'r16_14' },
      { home: qualifiedThirds[2]?.team, away: firstPlaces['F'], desc: '3e3 - GF1', id: 'r16_15' },
      { home: qualifiedThirds[3]?.team, away: firstPlaces['H'], desc: '3e4 - GH1', id: 'r16_16' }
    ];

    return { firstPlaces, secondPlaces, qualifiedThirds, round16 };
  }, [groupsData, allThirdPlaces]);

  const clearSimulation = () => {
    localStorage.removeItem('takotak_simulations');
    localStorage.removeItem('takotak_ko_simulations');
    setSimulations({});
    setKoSimulations({});
    setSaveMessage('Simulation réinitialisée!');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f4f8'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px', animation: 'bounce 1s infinite' }}>⏳</div>
          <p style={{ color: '#666', fontSize: '16px' }}>Chargement de la simulation...</p>
        </div>
      </div>
    );
  }

  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4f8 0%, #f3e7e9 100%)',
      padding: '30px 20px',
    }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '36px', color: '#333', margin: '0 0 5px 0', fontWeight: 'bold' }}>
              🎮 Simulation Coupe du Monde
            </h1>
            <p style={{ color: '#666', margin: '0', fontSize: '14px' }}>
              Auto-sauvegardé dans votre navigateur • {saveMessage && <span style={{ color: '#059669' }}>✅ {saveMessage}</span>}
            </p>
          </div>
          <button
            onClick={clearSimulation}
            style={{
              padding: '8px 16px',
              background: '#fee',
              color: '#c33',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            🔄 Réinitialiser
          </button>
        </div>

        {/* PHASE DE GROUPES - 2 par ligne */}
        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '20px', fontWeight: 'bold' }}>
            🏆 Phase de Groupes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            {groups.map(groupLetter => {
              const groupIndex = groupLetter.charCodeAt(0) - 65;
              const startId = groupIndex * 6 + 1;
              const groupMatches = matches.filter(m => m.id >= startId && m.id < startId + 6);
              const classification = groupsData[groupLetter];

              if (groupMatches.length === 0) return null;

              return (
                <div key={groupLetter}>
                  <div style={{
                    background: GRADIENT,
                    color: 'white',
                    padding: '12px 15px',
                    borderRadius: '8px 8px 0 0',
                    fontWeight: 'bold'
                  }}>
                    Groupe {groupLetter}
                  </div>

                  <div style={{
                    background: 'white',
                    borderRadius: '0 0 8px 8px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                    display: 'flex'
                  }}>
                    {/* MATCHS - Gauche */}
                    <div style={{ flex: 1, padding: '12px', borderRight: '1px solid #eee' }}>
                      {groupMatches.map((match, idx) => {
                        const sim = simulations[match.id] || { team1_goals: 0, team2_goals: 0 };
                        const pred = predictions[match.id];
                        const points = pred ? calculatePoints(pred, sim) : 0;

                        return (
                          <div key={match.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 0',
                            borderBottom: idx < groupMatches.length - 1 ? '1px solid #f0f0f0' : 'none',
                            fontSize: '12px'
                          }}>
                            <div style={{ flex: 1, minWidth: '140px' }}>
                              <div style={{ fontWeight: '500', color: '#333', fontSize: '13px' }}>
                                {getCountryFlag(match.team1)} {match.team1} vs {match.team2} {getCountryFlag(match.team2)}
                              </div>
                              {pred && (
                                <div style={{ fontSize: '10px', color: '#999' }}>
                                  Prono: {pred.team1_goals}-{pred.team2_goals}
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                type="number"
                                min="0"
                                max="20"
                                value={sim.team1_goals}
                                onChange={(e) => handleSimulationChange(match.id, 'team1_goals', e.target.value)}
                                style={{
                                  width: '32px',
                                  padding: '3px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  border: `1px solid ${PRIMARY}`,
                                  borderRadius: '3px',
                                  textAlign: 'center'
                                }}
                              />
                              <span style={{ fontSize: '10px', color: '#ddd' }}>-</span>
                              <input
                                type="number"
                                min="0"
                                max="20"
                                value={sim.team2_goals}
                                onChange={(e) => handleSimulationChange(match.id, 'team2_goals', e.target.value)}
                                style={{
                                  width: '32px',
                                  padding: '3px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  border: `1px solid ${PRIMARY}`,
                                  borderRadius: '3px',
                                  textAlign: 'center'
                                }}
                              />
                              <div style={{
                                background: points >= 3 ? '#d1fae5' : points >= 2 ? '#dbeafe' : points >= 1 ? '#fef3c7' : '#f3f4f6',
                                color: points >= 3 ? '#059669' : points >= 2 ? '#1e40af' : points >= 1 ? '#92400e' : '#4b5563',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                minWidth: '35px',
                                textAlign: 'center'
                              }}>
                                {points}pt
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* CLASSEMENT - Droite */}
                    <div style={{ width: '320px', padding: '12px', background: '#f9f9f9' }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '10px'
                      }}>
                        <thead>
                          <tr style={{ background: '#f0f0f0' }}>
                            <th style={{ padding: '4px 2px', textAlign: 'left', fontWeight: 'bold', fontSize: '9px' }}>Équipe</th>
                            <th style={{ padding: '4px 2px', textAlign: 'center', fontWeight: 'bold', width: '18px' }}>J</th>
                            <th style={{ padding: '4px 2px', textAlign: 'center', fontWeight: 'bold', width: '18px' }}>G</th>
                            <th style={{ padding: '4px 2px', textAlign: 'center', fontWeight: 'bold', width: '18px' }}>N</th>
                            <th style={{ padding: '4px 2px', textAlign: 'center', fontWeight: 'bold', width: '18px' }}>P</th>
                            <th style={{ padding: '4px 2px', textAlign: 'center', fontWeight: 'bold', width: '18px' }}>B+</th>
                            <th style={{ padding: '4px 2px', textAlign: 'center', fontWeight: 'bold', width: '18px' }}>B-</th>
                            <th style={{ padding: '4px 2px', textAlign: 'center', fontWeight: 'bold', width: '20px' }}>Diff</th>
                            <th style={{ padding: '4px 2px', textAlign: 'center', fontWeight: 'bold', color: PRIMARY, width: '18px' }}>Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classification.map((data, idx) => {
                            const diff = data.goalsFor - data.goalsAgainst;
                            return (
                              <tr key={data.team} style={{
                                background: idx < 2 ? '#eff6ff' : 'white',
                                borderTop: '1px solid #eee'
                              }}>
                                <td style={{ padding: '4px 2px', fontWeight: '500', fontSize: '9px' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    width: '16px',
                                    height: '16px',
                                    background: idx < 2 ? GRADIENT : '#e0e0e0',
                                    color: 'white',
                                    borderRadius: '50%',
                                    textAlign: 'center',
                                    lineHeight: '16px',
                                    fontSize: '8px',
                                    fontWeight: 'bold',
                                    marginRight: '2px'
                                  }}>
                                    {idx + 1}
                                  </span>
                                  {getCountryFlag(data.team)} {data.team}
                                </td>
                                <td style={{ padding: '4px 2px', textAlign: 'center', fontSize: '9px' }}>{data.played}</td>
                                <td style={{ padding: '4px 2px', textAlign: 'center', color: '#059669', fontWeight: 'bold', fontSize: '9px' }}>{data.won}</td>
                                <td style={{ padding: '4px 2px', textAlign: 'center', color: '#92400e', fontWeight: 'bold', fontSize: '9px' }}>{data.draw}</td>
                                <td style={{ padding: '4px 2px', textAlign: 'center', color: '#dc2626', fontWeight: 'bold', fontSize: '9px' }}>{data.lost}</td>
                                <td style={{ padding: '4px 2px', textAlign: 'center', fontSize: '9px', fontWeight: 'bold' }}>{data.goalsFor}</td>
                                <td style={{ padding: '4px 2px', textAlign: 'center', fontSize: '9px', fontWeight: 'bold' }}>{data.goalsAgainst}</td>
                                <td style={{
                                  padding: '4px 2px',
                                  textAlign: 'center',
                                  color: diff > 0 ? '#059669' : diff < 0 ? '#dc2626' : '#666',
                                  fontWeight: 'bold',
                                  fontSize: '9px'
                                }}>
                                  {diff > 0 ? '+' : ''}{diff}
                                </td>
                                <td style={{
                                  padding: '4px 2px',
                                  textAlign: 'center',
                                  color: PRIMARY,
                                  fontWeight: 'bold',
                                  fontSize: '9px'
                                }}>
                                  {data.points}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MEILLEURS 3e COMPLETS */}
        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '20px', fontWeight: 'bold' }}>
            🥉 Classement des 3e
          </h2>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px'
            }}>
              <thead>
                <tr style={{ background: GRADIENT, color: 'white' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Équipe</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', width: '60px' }}>Groupe</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', width: '40px' }}>Pts</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', width: '50px' }}>Diff</th>
                </tr>
              </thead>
              <tbody>
                {allThirdPlaces.map((data, idx) => (
                  <tr key={data.team} style={{
                    background: idx < 4 ? '#eff6ff' : 'white',
                    borderTop: '1px solid #eee'
                  }}>
                    <td style={{ padding: '10px 12px', fontWeight: '500' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '24px',
                        height: '24px',
                        background: idx < 4 ? GRADIENT : '#e0e0e0',
                        color: 'white',
                        borderRadius: '50%',
                        textAlign: 'center',
                        lineHeight: '24px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        marginRight: '8px'
                      }}>
                        {idx + 1}
                      </span>
                      <span style={{ marginRight: '6px' }}>{getCountryFlag(data.team)}</span>
                      {data.team}
                      {idx < 4 && <span style={{ marginLeft: '8px', color: '#059669', fontWeight: 'bold', fontSize: '11px' }}>✓ Qualifié</span>}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 'bold' }}>{data.group}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 'bold', color: PRIMARY }}>
                      {data.points}
                    </td>
                    <td style={{
                      padding: '10px 12px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: data.diff > 0 ? '#059669' : '#dc2626'
                    }}>
                      {data.diff > 0 ? '+' : ''}{data.diff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PHASE ÉLIMINATOIRE - Bracket */}
        <TournamentBracket
          groupsData={groupsData}
          allThirdPlaces={allThirdPlaces}
          koSimulations={koSimulations}
          onScoreChange={handleKoSimulationChange}
          PRIMARY={PRIMARY}
          SECONDARY={SECONDARY}
          GRADIENT={GRADIENT}
        />
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}

export default Simulation;
