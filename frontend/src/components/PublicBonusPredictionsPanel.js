import React, { useEffect, useMemo, useState } from 'react';
import { bonusPredictionsService, specialPredictionsService } from '../services/api';
import { getFlag } from '../utils/countryFlags';
import UserAvatar from './UserAvatar';

const GROUP_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const formatDateTime = (value) => {
  if (!value) return '—';
  return `${value.substring(8, 10)}/${value.substring(5, 7)} à ${value.substring(11, 16)}`;
};

const TeamPill = ({ team }) => {
  if (!team) return <span className="public-team-pill empty">—</span>;
  const flag = getFlag(team);
  return (
    <span className="public-team-pill">
      {flag ? <img src={flag} alt="" /> : <span className="public-team-fallback">⚽</span>}
      <span>{team}</span>
    </span>
  );
};

function PublicBonusPredictionsPanel({ currentUserId }) {
  const [bonusData, setBonusData] = useState(null);
  const [specialData, setSpecialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadPublicPredictions = async () => {
      try {
        const [bonusResult, specialResult] = await Promise.all([
          bonusPredictionsService.getPublic(),
          specialPredictionsService.getPublic()
        ]);

        if (!mounted) return;
        setBonusData(bonusResult.data);
        setSpecialData(specialResult.data);
      } catch (err) {
        console.error('Erreur chargement pronostics bonus publics:', err.response?.data || err);
        if (mounted) setError('Impossible de charger les pronostics bonus des autres joueurs.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPublicPredictions();
    return () => { mounted = false; };
  }, []);

  const hasVisibleSection = Boolean(bonusData?.locked || specialData?.locked);
  const specialDefinitions = useMemo(() => specialData?.definitions || [], [specialData]);

  if (loading) {
    return <section className="public-bonus-panel public-bonus-loading">Chargement des pronostics des autres joueurs...</section>;
  }

  if (error) {
    return <section className="public-bonus-panel public-bonus-error">⚠️ {error}</section>;
  }

  if (!hasVisibleSection) {
    return (
      <section className="public-bonus-panel public-bonus-locked-info">
        <div className="public-bonus-header">
          <div>
            <span className="public-bonus-eyebrow">👀 Pronostics des autres</span>
            <h2>Encore masqués</h2>
            <p>
              Les pronostics bonus des autres joueurs seront visibles ici une fois verrouillés,
              pour éviter d’influencer les choix avant la deadline.
            </p>
          </div>
        </div>
        <div className="public-bonus-info-grid">
          <div><strong>Bonus long terme</strong><span>Verrouillage : {formatDateTime(bonusData?.deadline)}</span></div>
          <div><strong>Spéciaux J1</strong><span>Verrouillage : {formatDateTime(specialData?.deadline)}</span></div>
        </div>
        <style>{styles}</style>
      </section>
    );
  }

  return (
    <section className="public-bonus-panel">
      <div className="public-bonus-header">
        <div>
          <span className="public-bonus-eyebrow">👀 Pronostics des autres</span>
          <h2>Les choix du groupe</h2>
          <p>Une fois les bonus verrouillés, les choix des autres joueurs deviennent consultables ici.</p>
        </div>
      </div>

      {bonusData?.locked && (
        <div className="public-bonus-section">
          <div className="public-bonus-section-title">
            <div><span>Bonus long terme</span><h3>Vainqueurs de groupes et tableau final</h3></div>
            <strong>{bonusData.predictions?.length || 0} joueur{(bonusData.predictions?.length || 0) > 1 ? 's' : ''}</strong>
          </div>

          <div className="public-bonus-list">
            {(bonusData.predictions || []).map(item => {
              const prediction = item.prediction || {};
              return (
                <article key={`bonus-${item.user_id}`} className={`public-bonus-player ${Number(currentUserId) === Number(item.user_id) ? 'is-current-user' : ''}`}>
                  <div className="public-bonus-player-head">
                    <UserAvatar user={item} size={34} />
                    <div>
                      <strong>{item.username}</strong>
                      <span>{item.scoring?.points || 0} pt{(item.scoring?.points || 0) > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="public-group-grid">
                    {GROUP_CODES.map(group => (
                      <div key={`${item.user_id}-${group}`} className="public-group-pick">
                        <span>{group}</span>
                        <TeamPill team={prediction.group_winners?.[group]} />
                      </div>
                    ))}
                  </div>

                  <div className="public-final-grid">
                    <div><span>Champion</span><TeamPill team={prediction.champion} /></div>
                    <div><span>Finaliste</span><TeamPill team={prediction.runner_up} /></div>
                    <div className="public-semis"><span>Demi-finalistes</span><div>{(prediction.semifinalists || []).map((team, index) => <TeamPill key={`${item.user_id}-semi-${index}`} team={team} />)}</div></div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {specialData?.locked && (
        <div className="public-bonus-section public-special-section">
          <div className="public-bonus-section-title">
            <div><span>Spéciaux première journée</span><h3>Les réponses verrouillées</h3></div>
            <strong>{specialData.predictions?.length || 0} joueur{(specialData.predictions?.length || 0) > 1 ? 's' : ''}</strong>
          </div>

          <div className="public-special-table-wrap">
            <div className="public-special-table" style={{ '--special-columns': `210px repeat(${specialDefinitions.length}, minmax(130px, 1fr)) 80px` }}>
              <div className="public-special-row public-special-head">
                <span>Joueur</span>
                {specialDefinitions.map(definition => <span key={definition.code}>{definition.label}</span>)}
                <span>Pts</span>
              </div>
              {(specialData.predictions || []).map(item => (
                <div key={`special-${item.user_id}`} className={`public-special-row ${Number(currentUserId) === Number(item.user_id) ? 'is-current-user' : ''}`}>
                  <span className="public-special-user"><UserAvatar user={item} size={28} />{item.username}</span>
                  {specialDefinitions.map(definition => (
                    <span key={`${item.user_id}-${definition.code}`}>{item.predictions?.[definition.code] ?? '—'} {definition.unit}</span>
                  ))}
                  <strong>{item.scoring?.points || 0}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{styles}</style>
    </section>
  );
}

const styles = `
  .public-bonus-panel { background: rgba(255,255,255,.96); border: 1px solid rgba(255,255,255,.55); border-radius: 20px; padding: 16px; margin-bottom: 16px; box-shadow: 0 18px 55px rgba(0,0,0,.2); color: #0f172a; }
  .public-bonus-loading, .public-bonus-error { color: #475569; font-weight: 900; }
  .public-bonus-error { color: #b91c1c; }
  .public-bonus-header { display: flex; justify-content: space-between; gap: 18px; margin-bottom: 14px; }
  .public-bonus-eyebrow, .public-bonus-section-title span { display: inline-flex; padding: 5px 10px; border-radius: 999px; background: #ecfdf5; color: #047857; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px; }
  .public-bonus-panel h2 { margin: 0 0 6px; color: #0f172a; font-size: 26px; letter-spacing: -.03em; }
  .public-bonus-panel h3 { margin: 2px 0 0; color: #0f172a; font-size: 18px; }
  .public-bonus-panel p { margin: 0; color: #475569; font-size: 14px; line-height: 1.5; max-width: 760px; }
  .public-bonus-info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .public-bonus-info-grid div { padding: 13px; border-radius: 15px; background: #f8fafc; border: 1px solid #e2e8f0; }
  .public-bonus-info-grid strong { display: block; color: #0f172a; margin-bottom: 5px; }
  .public-bonus-info-grid span { color: #64748b; font-size: 12px; font-weight: 850; }
  .public-bonus-section + .public-bonus-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
  .public-bonus-section-title { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; }
  .public-bonus-section-title strong { color: #d97706; font-size: 16px; white-space: nowrap; }
  .public-bonus-list { display: grid; gap: 12px; }
  .public-bonus-player { display: grid; gap: 12px; padding: 13px; border-radius: 17px; background: #f8fafc; border: 1px solid #e2e8f0; }
  .public-bonus-player.is-current-user, .public-special-row.is-current-user { border-color: #f59e0b; background: #fff7ed; }
  .public-bonus-player-head { display: flex; align-items: center; gap: 10px; }
  .public-bonus-player-head strong { display: block; color: #0f172a; }
  .public-bonus-player-head span { display: block; color: #d97706; font-size: 12px; font-weight: 950; }
  .public-group-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; }
  .public-group-pick { display: grid; gap: 5px; min-width: 0; }
  .public-group-pick > span:first-child, .public-final-grid > div > span:first-child, .public-semis > span:first-child { color: #0f766e; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .06em; }
  .public-team-pill { min-width: 0; display: inline-flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 999px; background: white; border: 1px solid #e2e8f0; color: #0f172a; font-size: 12px; font-weight: 900; }
  .public-team-pill img { width: 18px; height: 18px; border-radius: 50%; object-fit: cover; flex: 0 0 auto; }
  .public-team-pill span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .public-team-pill.empty { justify-content: center; color: #94a3b8; }
  .public-team-fallback { font-size: 12px; }
  .public-final-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
  .public-final-grid > div { display: grid; gap: 5px; }
  .public-semis { grid-column: 1 / -1; }
  .public-semis > div { display: flex; flex-wrap: wrap; gap: 7px; }
  .public-special-table-wrap { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 16px; }
  .public-special-table { min-width: 760px; }
  .public-special-row { display: grid; grid-template-columns: var(--special-columns); gap: 10px; align-items: center; padding: 10px 12px; border-top: 1px solid #e2e8f0; color: #334155; font-size: 13px; font-weight: 850; }
  .public-special-head { border-top: 0; background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 950; text-transform: uppercase; letter-spacing: .05em; }
  .public-special-user { display: inline-flex; align-items: center; gap: 8px; color: #0f172a; font-weight: 950; }
  .public-special-row strong { color: #d97706; font-size: 16px; }
  @media (max-width: 940px) { .public-group-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @media (max-width: 640px) { .public-bonus-panel { padding: 12px; } .public-bonus-info-grid, .public-final-grid { grid-template-columns: 1fr; } .public-group-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .public-bonus-section-title { align-items: flex-start; flex-direction: column; } }
`;

export default PublicBonusPredictionsPanel;
