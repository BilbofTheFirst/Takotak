import React, { useEffect, useState } from 'react';
import { teamsService } from '../services/api';
import { getFlag } from '../utils/countryFlags';

function TeamInfoModal({ teamId, teamName, onClose }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTeamInfo();
  }, [teamId]);

  const loadTeamInfo = async () => {
    try {
      const res = await teamsService.getInfo(teamId);
      setInfo(res.data);
    } catch (err) {
      setError('Erreur lors du chargement des infos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={getFlag(teamName)} alt={teamName} style={{ height: '32px', width: '32px', borderRadius: '50%' }} />
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{teamName}</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999'
            }}
          >
            ✕
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
            <p style={{ color: '#666' }}>Chargement...</p>
          </div>
        )}

        {error && (
          <div style={{ padding: '12px', background: '#fee', color: '#c33', borderRadius: '6px' }}>
            {error}
          </div>
        )}

        {info && !loading && (
          <>
            {/* FIFA Ranking */}
            <div style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #ec4899 100%)',
              color: 'white',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Classement FIFA</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>#{info.team.fifa_ranking}</div>
            </div>

            {/* Last 5 Matches */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#333' }}>
                5 derniers matchs
              </h3>

              {info.lastMatches.length === 0 ? (
                <p style={{ color: '#999', fontSize: '14px' }}>Aucun match joué</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {info.lastMatches.map((match, idx) => {
                    const resultColor = match.result === 'W' ? '#059669' : match.result === 'L' ? '#dc2626' : '#92400e';
                    const resultBg = match.result === 'W' ? '#d1fae5' : match.result === 'L' ? '#fee2e2' : '#fef3c7';

                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          background: '#f9f9f9',
                          borderRadius: '6px',
                          fontSize: '13px',
                          borderLeft: `4px solid ${resultColor}`
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500', color: '#333' }}>vs {match.opponent}</div>
                          <div style={{ fontSize: '11px', color: '#999' }}>
                            {new Date(match.date).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                            {match.score}
                          </div>
                          <div
                            style={{
                              background: resultBg,
                              color: resultColor,
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              fontSize: '12px',
                              minWidth: '35px',
                              textAlign: 'center'
                            }}
                          >
                            {match.result === 'W' ? 'V' : match.result === 'L' ? 'D' : 'N'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TeamInfoModal;
