import React, { useEffect, useState } from 'react';
import { matchesService, predictionsService } from '../services/api';

function Simulation() {
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [simulations, setSimulations] = useState({});
  const [loading, setLoading] = useState(true);

  const PRIMARY = '#2563eb';
  const SECONDARY = '#ec4899';
  const GRADIENT = `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [matchesRes, predictionsRes] = await Promise.all([
        matchesService.getAll(),
        predictionsService.getAll()
      ]);

      // Ne garder que les matchs de phase de groupes (les 72 premiers)
      const groupMatches = matchesRes.data.filter(m => m.id <= 72);
      setMatches(groupMatches);

      const predMap = {};
      const simMap = {};
      predictionsRes.data.forEach(p => {
        predMap[p.match_id] = p;
        simMap[p.match_id] = { team1_goals: 0, team2_goals: 0 };
      });
      setPredictions(predMap);
      setSimulations(simMap);
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

  const getGroupLetter = (matchId) => {
    const groupIndex = Math.floor((matchId - 1) / 6);
    return String.fromCharCode(65 + groupIndex);
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
      const { team1_goals: g1, team2_goals: g2 } = sim;

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
          <p style={{ color: '#666', fontSize: '16px' }}>Chargement des groupes...</p>
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
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', color: '#333', margin: '0 0 10px 0', fontWeight: 'bold' }}>
            🎮 Simulation
          </h1>
          <p style={{ color: '#666', margin: '0', fontSize: '16px' }}>
            Simule les résultats et vois comment tu aurais marqué des points!
          </p>
        </div>

        {/* Groups */}
        {groups.map(groupLetter => {
          const groupIndex = groupLetter.charCodeAt(0) - 65;
          const startId = groupIndex * 6 + 1;
          const groupMatches = matches.filter(m => m.id >= startId && m.id < startId + 6);

          if (groupMatches.length === 0) return null;

          const stats = calculateGroupStats(groupLetter);
          const teams = getTeamsInGroup(groupLetter);

          return (
            <div key={groupLetter} style={{ marginBottom: '50px' }}>
              {/* Group Header */}
              <div style={{
                background: GRADIENT,
                color: 'white',
                padding: '15px 20px',
                borderRadius: '8px 8px 0 0',
                marginBottom: '0'
              }}>
                <h2 style={{ margin: '0', fontSize: '20px', fontWeight: 'bold' }}>
                  Groupe {groupLetter}
                </h2>
              </div>

              <div style={{
                background: 'white',
                borderRadius: '0 0 8px 8px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                marginBottom: '20px'
              }}>
                {/* Matches */}
                <div style={{ padding: '20px', borderBottom: '2px solid #eee' }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#999', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    Matchs
                  </h3>
                  {groupMatches.map((match, idx) => {
                    const pred = predictions[match.id];
                    const sim = simulations[match.id] || { team1_goals: 0, team2_goals: 0 };
                    const points = pred ? calculatePoints(pred, sim) : 0;

                    return (
                      <div key={match.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        padding: '12px 0',
                        borderBottom: idx < groupMatches.length - 1 ? '1px solid #eee' : 'none'
                      }}>
                        {/* Match */}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                            {match.team1} vs {match.team2}
                          </div>
                          {pred && (
                            <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                              Ton pronostic: {pred.team1_goals} - {pred.team2_goals}
                            </div>
                          )}
                        </div>

                        {/* Score Input */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={sim.team1_goals}
                            onChange={(e) => handleSimulationChange(match.id, 'team1_goals', e.target.value)}
                            placeholder="0"
                            style={{
                              width: '40px',
                              padding: '6px',
                              fontSize: '13px',
                              fontWeight: 'bold',
                              border: `1px solid ${PRIMARY}`,
                              borderRadius: '4px',
                              textAlign: 'center'
                            }}
                          />
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ddd' }}>-</span>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={sim.team2_goals}
                            onChange={(e) => handleSimulationChange(match.id, 'team2_goals', e.target.value)}
                            placeholder="0"
                            style={{
                              width: '40px',
                              padding: '6px',
                              fontSize: '13px',
                              fontWeight: 'bold',
                              border: `1px solid ${PRIMARY}`,
                              borderRadius: '4px',
                              textAlign: 'center'
                            }}
                          />
                        </div>

                        {/* Points */}
                        <div style={{
                          background: points >= 3 ? '#d1fae5' : points >= 2 ? '#dbeafe' : points >= 1 ? '#fef3c7' : '#f3f4f6',
                          color: points >= 3 ? '#059669' : points >= 2 ? '#1e40af' : points >= 1 ? '#92400e' : '#4b5563',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          minWidth: '50px',
                          textAlign: 'center'
                        }}>
                          {points} pts
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Standings Table */}
                <div style={{ padding: '20px' }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#999', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    Classement
                  </h3>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '12px'
                  }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>Équipe</th>
                        <th style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#333' }}>J</th>
                        <th style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#333' }}>G</th>
                        <th style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#333' }}>N</th>
                        <th style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#333' }}>P</th>
                        <th style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#333' }}>+/-</th>
                        <th style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: PRIMARY }}>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams
                        .sort((a, b) => {
                          const statsA = stats[a];
                          const statsB = stats[b];
                          if (statsB.points !== statsA.points) {
                            return statsB.points - statsA.points;
                          }
                          return (statsB.goalsFor - statsB.goalsAgainst) - (statsA.goalsFor - statsA.goalsAgainst);
                        })
                        .map((team, idx) => {
                          const s = stats[team];
                          const diff = s.goalsFor - s.goalsAgainst;
                          return (
                            <tr key={team} style={{
                              background: idx < 2 ? '#eff6ff' : 'white',
                              borderBottom: '1px solid #eee'
                            }}>
                              <td style={{ padding: '8px', fontWeight: '500', color: '#333' }}>
                                <span style={{
                                  display: 'inline-block',
                                  width: '20px',
                                  height: '20px',
                                  background: GRADIENT,
                                  color: 'white',
                                  borderRadius: '50%',
                                  textAlign: 'center',
                                  lineHeight: '20px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  marginRight: '8px'
                                }}>
                                  {idx + 1}
                                </span>
                                {team}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center', color: '#666' }}>{s.played}</td>
                              <td style={{ padding: '8px', textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>{s.won}</td>
                              <td style={{ padding: '8px', textAlign: 'center', color: '#92400e', fontWeight: 'bold' }}>{s.draw}</td>
                              <td style={{ padding: '8px', textAlign: 'center', color: '#dc2626', fontWeight: 'bold' }}>{s.lost}</td>
                              <td style={{
                                padding: '8px',
                                textAlign: 'center',
                                color: diff > 0 ? '#059669' : diff < 0 ? '#dc2626' : '#666',
                                fontWeight: 'bold'
                              }}>
                                {s.goalsFor}-{s.goalsAgainst}
                              </td>
                              <td style={{
                                padding: '8px',
                                textAlign: 'center',
                                color: PRIMARY,
                                fontWeight: 'bold',
                                fontSize: '13px'
                              }}>
                                {s.points}
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
