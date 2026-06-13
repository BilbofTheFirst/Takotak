import React, { useEffect, useMemo, useState } from 'react';
import { bonusPredictionsService } from '../services/api';
import { getFlag } from '../utils/countryFlags';
import PublicBonusPredictionsTable from './PublicBonusPredictionsTable';

const GROUP_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const EMPTY_BONUS = {
  group_winners: {},
  champion: '',
  runner_up: '',
  semifinalists: ['', '', '', '']
};

function BonusPredictionsPanel({ matches, currentUserId }) {
  const [bonus, setBonus] = useState(EMPTY_BONUS);
  const [locked, setLocked] = useState(false);
  const [globalLocked, setGlobalLocked] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [deadline, setDeadline] = useState(null);
  const [scoring, setScoring] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('idle');

  const groupTeams = useMemo(() => {
    const map = {};
    GROUP_CODES.forEach(group => { map[group] = new Set(); });

    matches
      .filter(match => Number(match.id) < 73)
      .forEach(match => {
        if (match.groupe1 && match.team1) map[match.groupe1]?.add(match.team1);
        if (match.groupe2 && match.team2) map[match.groupe2]?.add(match.team2);
      });

    return Object.fromEntries(
      GROUP_CODES.map(group => [group, Array.from(map[group] || []).sort((a, b) => a.localeCompare(b, 'fr'))])
    );
  }, [matches]);

  const allTeams = useMemo(() => (
    Array.from(new Set(Object.values(groupTeams).flat())).sort((a, b) => a.localeCompare(b, 'fr'))
  ), [groupTeams]);

  useEffect(() => {
    let mounted = true;

    const loadBonus = async () => {
      try {
        const response = await bonusPredictionsService.get();
        if (!mounted) return;
        const prediction = response.data?.prediction || EMPTY_BONUS;
        setBonus({
          group_winners: prediction.group_winners || {},
          champion: prediction.champion || '',
          runner_up: prediction.runner_up || '',
          semifinalists: Array.isArray(prediction.semifinalists)
            ? [...prediction.semifinalists, '', '', '', ''].slice(0, 4)
            : ['', '', '', '']
        });
        setLocked(Boolean(response.data?.locked));
        setGlobalLocked(Boolean(response.data?.global_locked ?? response.data?.locked));
        setAdminUnlocked(Boolean(response.data?.admin_unlocked));
        setDeadline(response.data?.deadline || null);
        setScoring(response.data?.scoring || null);
      } catch (error) {
        console.error('Erreur chargement pronostics bonus:', error);
        if (mounted) setStatus('error');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadBonus();
    return () => { mounted = false; };
  }, []);

  const updateGroupWinner = (group, value) => {
    setBonus(prev => ({
      ...prev,
      group_winners: { ...prev.group_winners, [group]: value }
    }));
    setStatus('dirty');
  };

  const updateField = (field, value) => {
    setBonus(prev => ({ ...prev, [field]: value }));
    setStatus('dirty');
  };

  const updateSemifinalist = (index, value) => {
    setBonus(prev => {
      const next = [...prev.semifinalists];
      next[index] = value;
      return { ...prev, semifinalists: next };
    });
    setStatus('dirty');
  };

  const saveBonus = async () => {
    setStatus('saving');
    try {
      const payload = {
        group_winners: bonus.group_winners,
        champion: bonus.champion,
        runner_up: bonus.runner_up,
        semifinalists: bonus.semifinalists.filter(Boolean)
      };
      const response = await bonusPredictionsService.save(payload);
      setBonus({
        group_winners: response.data.group_winners || {},
        champion: response.data.champion || '',
        runner_up: response.data.runner_up || '',
        semifinalists: Array.isArray(response.data.semifinalists)
          ? [...response.data.semifinalists, '', '', '', ''].slice(0, 4)
          : ['', '', '', '']
      });
      setStatus('saved');
    } catch (error) {
      console.error('Erreur sauvegarde bonus:', error.response?.data || error);
      setStatus(error.response?.data?.error || 'error');
    }
  };

  const renderTeamOption = (team) => (
    <option key={team || 'empty'} value={team}>{team || '— choisir —'}</option>
  );

  const renderSelectedFlag = (team) => {
    const flag = team ? getFlag(team) : null;
    return flag ? <img src={flag} alt={team} /> : <span>⚽</span>;
  };

  const completedGroupWinners = GROUP_CODES.filter(group => bonus.group_winners?.[group]).length;
  const completedSemis = bonus.semifinalists.filter(Boolean).length;
  const totalCompleted = completedGroupWinners + (bonus.champion ? 1 : 0) + (bonus.runner_up ? 1 : 0) + completedSemis;

  if (loading) {
    return <section className="bonus-panel bonus-panel-loading">Chargement des pronostics bonus...</section>;
  }

  return (
    <section className={`bonus-panel ${locked ? 'bonus-panel-locked' : ''} ${adminUnlocked ? 'bonus-panel-admin-unlocked' : ''}`}>
      <div className="bonus-panel-header">
        <div>
          <span className="bonus-eyebrow">🌟 Bonus avant compétition</span>
          <h2>Pronostics bonus</h2>
          <p>
            Une seule page pour tes paris longue durée. Les groupes se jouent à 5 points chacun,
            puis le tableau final peut rapporter gros.
          </p>
          {deadline && <small>Verrouillage au coup d’envoi du premier match : {deadline.substring(8, 10)}/{deadline.substring(5, 7)} à {deadline.substring(11, 16)}</small>}
        </div>

        <div className="bonus-actions-card">
          <div className="bonus-score-card">
            <span>Score bonus actuel</span>
            <strong>{scoring?.points || 0}</strong>
            <em>points</em>
          </div>
          <button type="button" onClick={saveBonus} disabled={locked || status === 'saving'}>
            {locked ? 'Bonus verrouillés' : status === 'saving' ? 'Sauvegarde...' : adminUnlocked ? 'Sauvegarder la correction' : 'Sauvegarder'}
          </button>
          {status === 'saved' && <span className="bonus-status saved">✅ Enregistré</span>}
          {status === 'dirty' && <span className="bonus-status dirty">✍️ Modifications non sauvegardées</span>}
          {status && !['idle', 'dirty', 'saving', 'saved'].includes(status) && <span className="bonus-status error">⚠️ Erreur</span>}
        </div>
      </div>

      <div className="bonus-progress-row">
        <div><strong>{completedGroupWinners}/12</strong><span>vainqueurs de groupes</span></div>
        <div><strong>{completedSemis}/4</strong><span>demi-finalistes</span></div>
        <div><strong>{totalCompleted}/18</strong><span>bonus remplis</span></div>
      </div>

      {locked && (
        <div className="bonus-locked-banner">
          🔒 Les pronostics bonus sont verrouillés car la compétition a commencé. Tu peux maintenant consulter les pronos du groupe par catégorie.
        </div>
      )}

      {globalLocked && adminUnlocked && (
        <div className="bonus-admin-unlocked-banner">
          🔓 Un admin a temporairement réouvert tes pronostics bonus long terme. Pense à sauvegarder tes corrections.
        </div>
      )}

      <div className="bonus-grid">
        <div className="bonus-card bonus-groups-card">
          <div className="bonus-card-title has-public-table">
            <div><span>12 × 5 pts</span><h3>Vainqueurs de groupes</h3></div>
            <strong>{completedGroupWinners}/12</strong>
            <PublicBonusPredictionsTable type="groups" locked={globalLocked || locked} currentUserId={currentUserId} />
          </div>
          <div className="bonus-group-grid">
            {GROUP_CODES.map(group => {
              const selected = bonus.group_winners?.[group] || '';
              return (
                <div key={group} className="group-winner-box">
                  <label className="group-winner-row">
                    <span className="group-badge">{group}</span>
                    <span className="group-flag">{renderSelectedFlag(selected)}</span>
                    <select disabled={locked} value={selected} onChange={(event) => updateGroupWinner(group, event.target.value)}>
                      {renderTeamOption('')}
                      {(groupTeams[group] || []).map(renderTeamOption)}
                    </select>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bonus-card bonus-final-card">
          <div className="bonus-card-title has-public-table">
            <div><span>Tableau final</span><h3>Grands paris</h3></div>
            <strong>45 pts</strong>
            <PublicBonusPredictionsTable type="final" locked={globalLocked || locked} currentUserId={currentUserId} />
          </div>

          <div className="final-picks-grid">
            <div className="final-pick-box">
              <label className="final-pick-row">
                <span className="pick-points">15</span>
                <span className="bonus-flag">{renderSelectedFlag(bonus.champion)}</span>
                <div>
                  <span className="field-label">Champion du monde</span>
                  <select disabled={locked} value={bonus.champion} onChange={(event) => updateField('champion', event.target.value)}>
                    {renderTeamOption('')}
                    {allTeams.map(renderTeamOption)}
                  </select>
                </div>
              </label>
            </div>

            <div className="final-pick-box">
              <label className="final-pick-row">
                <span className="pick-points">10</span>
                <span className="bonus-flag">{renderSelectedFlag(bonus.runner_up)}</span>
                <div>
                  <span className="field-label">Finaliste perdant</span>
                  <select disabled={locked} value={bonus.runner_up} onChange={(event) => updateField('runner_up', event.target.value)}>
                    {renderTeamOption('')}
                    {allTeams.map(renderTeamOption)}
                  </select>
                </div>
              </label>
            </div>
          </div>

          <div className="semifinalists-box">
            <div className="semifinalists-title"><span>4 × 5 pts</span><strong>Demi-finalistes</strong></div>
            <div className="semifinalists-grid">
              {bonus.semifinalists.map((team, index) => (
                <label className="semifinalist-row" key={`semi-${index}`}>
                  <span className="pick-points">5</span>
                  <span className="bonus-flag">{renderSelectedFlag(team)}</span>
                  <select disabled={locked} value={team} onChange={(event) => updateSemifinalist(index, event.target.value)}>
                    {renderTeamOption('')}
                    {allTeams.map(renderTeamOption)}
                  </select>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .bonus-panel { background: rgba(255,255,255,.96); border: 1px solid rgba(255,255,255,.55); border-radius: 20px; padding: 16px; margin-bottom: 16px; box-shadow: 0 18px 55px rgba(0,0,0,.2); }
        .bonus-panel-loading { color: #475569; font-weight: 900; }
        .bonus-panel-locked { opacity: .94; }
        .bonus-panel-admin-unlocked { box-shadow: 0 18px 55px rgba(0,0,0,.2), inset 0 0 0 3px rgba(15,118,110,.22); }
        .bonus-panel-header { display: grid; grid-template-columns: minmax(0, 1fr) 230px; gap: 18px; align-items: stretch; margin-bottom: 14px; }
        .bonus-eyebrow { display: inline-flex; padding: 5px 10px; border-radius: 999px; background: #fff7ed; color: #c2410c; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px; }
        .bonus-panel h2 { margin: 0 0 6px; color: #0f172a; font-size: 26px; letter-spacing: -.03em; }
        .bonus-panel h3 { margin: 2px 0 0; color: #0f172a; font-size: 18px; }
        .bonus-panel p { margin: 0 0 7px; color: #475569; font-size: 14px; line-height: 1.5; max-width: 760px; }
        .bonus-panel small { color: #64748b; font-size: 11px; font-weight: 850; }
        .bonus-actions-card { display: grid; gap: 8px; align-content: stretch; }
        .bonus-score-card { display: grid; justify-items: center; align-content: center; border-radius: 16px; padding: 13px; color: white; background: linear-gradient(135deg, #0f766e, #d97706); box-shadow: 0 14px 30px rgba(15,23,42,.18); }
        .bonus-score-card span, .bonus-score-card em { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; opacity: .82; font-style: normal; }
        .bonus-score-card strong { font-size: 36px; line-height: 1; margin: 3px 0; color: #fff7ed; }
        .bonus-actions-card button { border: 0; border-radius: 999px; padding: 10px 13px; background: #0f172a; color: white; font-size: 12px; font-weight: 950; cursor: pointer; box-shadow: 0 9px 18px rgba(15,23,42,.18); }
        .bonus-actions-card button:disabled { cursor: not-allowed; opacity: .6; }
        .bonus-status { font-size: 11px; font-weight: 950; text-align: center; }
        .bonus-status.saved { color: #047857; }
        .bonus-status.dirty { color: #92400e; }
        .bonus-status.error { color: #b91c1c; }
        .bonus-progress-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 14px; }
        .bonus-progress-row div { border-radius: 14px; padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
        .bonus-progress-row strong { display: block; color: #d97706; font-size: 18px; line-height: 1; }
        .bonus-progress-row span { display: block; margin-top: 5px; color: #64748b; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .05em; }
        .bonus-locked-banner { margin-bottom: 14px; padding: 10px 12px; border-radius: 14px; color: #713f12; background: #fef3c7; border: 1px solid rgba(251,191,36,.5); font-size: 12px; font-weight: 900; }
        .bonus-admin-unlocked-banner { margin-bottom: 14px; padding: 10px 12px; border-radius: 14px; color: #0f766e; background: #ccfbf1; border: 1px solid rgba(15,118,110,.28); font-size: 12px; font-weight: 950; }
        .bonus-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
        .bonus-card { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 18px; padding: 14px; box-shadow: inset 0 0 0 1px rgba(255,255,255,.55); }
        .bonus-card-title { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 12px; margin-bottom: 12px; }
        .bonus-card-title span, .field-label, .semifinalists-title span { display: block; color: #0f766e; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .06em; }
        .bonus-card-title strong { color: #d97706; font-size: 22px; white-space: nowrap; }
        .bonus-group-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; align-items: start; }
        .group-winner-box, .final-pick-box { display: grid; gap: 6px; min-width: 0; align-items: start; }
        .group-winner-row { display: grid; grid-template-columns: 34px 32px minmax(0, 1fr); gap: 7px; align-items: center; min-width: 0; }
        .group-badge { width: 31px; height: 31px; border-radius: 10px; display: grid; place-items: center; background: #ecfdf5; color: #047857; font-size: 13px; font-weight: 950; }
        .group-flag, .bonus-flag { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: #e2e8f0; overflow: hidden; border: 2px solid white; box-shadow: 0 5px 14px rgba(15,23,42,.14); color: #64748b; font-size: 14px; }
        .group-flag img, .bonus-flag img { width: 100%; height: 100%; object-fit: cover; }
        .bonus-panel label { color: #334155; font-size: 11px; font-weight: 900; }
        .bonus-panel select { width: 100%; min-width: 0; border: 1.5px solid #cbd5e1; border-radius: 11px; background: white; color: #0f172a; padding: 8px 9px; font-size: 13px; font-weight: 850; outline: none; box-shadow: 0 5px 12px rgba(15,23,42,.05); }
        .bonus-panel select:focus { border-color: #d97706; box-shadow: 0 8px 18px rgba(217,119,6,.13); }
        .bonus-panel select:disabled { color: #94a3b8; background: #f1f5f9; }
        .bonus-final-card { display: grid; gap: 14px; align-content: start; }
        .final-picks-grid { display: grid; grid-template-columns: repeat(2, minmax(260px, 1fr)); gap: 10px; }
        .final-pick-row { display: grid; grid-template-columns: 32px 34px minmax(0, 1fr); gap: 8px; align-items: center; }
        .pick-points { width: 30px; height: 30px; border-radius: 10px; display: grid; place-items: center; background: #fff7ed; color: #c2410c; font-size: 13px; font-weight: 950; }
        .semifinalists-box { display: grid; gap: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0; }
        .semifinalists-grid { display: grid; grid-template-columns: repeat(2, minmax(260px, 1fr)); gap: 9px; }
        .semifinalists-title { display: flex; justify-content: space-between; align-items: center; }
        .semifinalists-title strong { color: #0f172a; font-size: 14px; }
        .semifinalist-row { display: grid; grid-template-columns: 32px 34px minmax(0, 1fr); gap: 8px; align-items: center; }
        @media (max-width: 940px) { .bonus-panel-header { grid-template-columns: 1fr; } .bonus-actions-card { grid-template-columns: 1fr; } .bonus-group-grid, .final-picks-grid, .semifinalists-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 640px) { .bonus-progress-row { grid-template-columns: 1fr; } .bonus-card-title { grid-template-columns: minmax(0, 1fr) auto; } .bonus-card-title .public-bonus-table-shell { grid-column: 1 / -1; } .bonus-group-grid, .final-picks-grid, .semifinalists-grid { grid-template-columns: 1fr; } .bonus-panel { padding: 12px; } }
      `}</style>
    </section>
  );
}

export default BonusPredictionsPanel;
