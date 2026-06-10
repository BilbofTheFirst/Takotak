import React, { useEffect, useMemo, useState } from 'react';
import { bonusPredictionsService } from '../services/api';
import { getFlag } from '../utils/countryFlags';

const GROUP_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const EMPTY_BONUS = {
  group_winners: {},
  champion: '',
  runner_up: '',
  semifinalists: ['', '', '', '']
};

function BonusPredictionsPanel({ matches }) {
  const [bonus, setBonus] = useState(EMPTY_BONUS);
  const [locked, setLocked] = useState(false);
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

  if (loading) {
    return <section className="bonus-panel bonus-panel-loading">Chargement des pronostics bonus...</section>;
  }

  return (
    <section className={`bonus-panel ${locked ? 'bonus-panel-locked' : ''}`}>
      <div className="bonus-panel-header">
        <div>
          <span className="bonus-eyebrow">🌟 Bonus avant compétition</span>
          <h2>Pronostics bonus</h2>
          <p>
            5 pts par vainqueur de groupe, 15 pts pour le champion, 10 pts pour le finaliste perdant,
            5 pts par demi-finaliste correctement trouvé.
          </p>
          {deadline && <small>À compléter avant le coup d’envoi du premier match : {deadline.substring(8, 10)}/{deadline.substring(5, 7)} {deadline.substring(11, 16)}</small>}
        </div>
        <div className="bonus-actions">
          {scoring && <strong>{scoring.points || 0} pts bonus</strong>}
          <button type="button" onClick={saveBonus} disabled={locked || status === 'saving'}>
            {locked ? 'Verrouillé' : status === 'saving' ? 'Sauvegarde...' : 'Sauvegarder les bonus'}
          </button>
          {status === 'saved' && <span className="bonus-status saved">Enregistré</span>}
          {status && !['idle', 'dirty', 'saving', 'saved'].includes(status) && <span className="bonus-status error">Erreur</span>}
        </div>
      </div>

      <div className="bonus-grid">
        <div className="bonus-card bonus-groups-card">
          <h3>Vainqueurs de groupes</h3>
          <div className="bonus-group-grid">
            {GROUP_CODES.map(group => (
              <label key={group}>
                <span>Groupe {group}</span>
                <select disabled={locked} value={bonus.group_winners?.[group] || ''} onChange={(event) => updateGroupWinner(group, event.target.value)}>
                  {renderTeamOption('')}
                  {(groupTeams[group] || []).map(renderTeamOption)}
                </select>
              </label>
            ))}
          </div>
        </div>

        <div className="bonus-card bonus-final-card">
          <h3>Phase finale</h3>
          <label>
            <span>Champion du monde · 15 pts</span>
            <select disabled={locked} value={bonus.champion} onChange={(event) => updateField('champion', event.target.value)}>
              {renderTeamOption('')}
              {allTeams.map(renderTeamOption)}
            </select>
          </label>
          <label>
            <span>Finaliste perdant · 10 pts</span>
            <select disabled={locked} value={bonus.runner_up} onChange={(event) => updateField('runner_up', event.target.value)}>
              {renderTeamOption('')}
              {allTeams.map(renderTeamOption)}
            </select>
          </label>
          <div className="semifinalists-box">
            <span>Demi-finalistes · 5 pts chacun</span>
            {bonus.semifinalists.map((team, index) => (
              <label className="semifinalist-row" key={`semi-${index}`}>
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

      <style>{`
        .bonus-panel { background: rgba(255,255,255,.96); border: 1px solid rgba(255,255,255,.55); border-radius: 20px; padding: 16px; margin-bottom: 16px; box-shadow: 0 18px 45px rgba(0,0,0,.18); }
        .bonus-panel-loading { color: #475569; font-weight: 900; }
        .bonus-panel-locked { opacity: .9; }
        .bonus-panel-header { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; margin-bottom: 14px; }
        .bonus-eyebrow { display: inline-flex; padding: 4px 9px; border-radius: 999px; background: #fff7ed; color: #c2410c; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px; }
        .bonus-panel h2 { margin: 0 0 6px; color: #0f172a; }
        .bonus-panel h3 { margin: 0 0 12px; color: #0f766e; }
        .bonus-panel p { margin: 0 0 6px; color: #475569; font-size: 13px; line-height: 1.45; }
        .bonus-panel small { color: #64748b; font-size: 11px; font-weight: 800; }
        .bonus-actions { min-width: 190px; display: grid; gap: 8px; justify-items: end; }
        .bonus-actions strong { color: #d97706; font-size: 20px; }
        .bonus-actions button { border: 0; border-radius: 999px; padding: 9px 13px; background: linear-gradient(135deg, #0f766e, #d97706); color: white; font-size: 12px; font-weight: 950; cursor: pointer; }
        .bonus-actions button:disabled { cursor: not-allowed; opacity: .6; }
        .bonus-status { font-size: 11px; font-weight: 950; }
        .bonus-status.saved { color: #047857; }
        .bonus-status.error { color: #b91c1c; }
        .bonus-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(280px, .65fr); gap: 14px; }
        .bonus-card { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 16px; padding: 14px; }
        .bonus-group-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); gap: 10px; }
        .bonus-panel label { display: grid; gap: 5px; color: #334155; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; }
        .bonus-panel select { width: 100%; min-width: 0; border: 1.5px solid #cbd5e1; border-radius: 11px; background: white; color: #0f172a; padding: 8px 9px; font-size: 13px; font-weight: 850; outline: none; }
        .bonus-panel select:disabled { color: #94a3b8; background: #f1f5f9; }
        .bonus-final-card { display: grid; gap: 12px; }
        .semifinalists-box { display: grid; gap: 8px; }
        .semifinalists-box > span { color: #334155; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; }
        .semifinalist-row { grid-template-columns: 34px 1fr; align-items: center; text-transform: none; letter-spacing: 0; }
        .bonus-flag { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: #e2e8f0; overflow: hidden; border: 2px solid white; box-shadow: 0 5px 14px rgba(15,23,42,.14); }
        .bonus-flag img { width: 100%; height: 100%; object-fit: cover; }
        @media (max-width: 900px) { .bonus-panel-header, .bonus-grid { grid-template-columns: 1fr; display: grid; } .bonus-actions { justify-items: stretch; } }
      `}</style>
    </section>
  );
}

export default BonusPredictionsPanel;
