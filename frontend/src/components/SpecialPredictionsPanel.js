import React, { useEffect, useMemo, useState } from 'react';
import { specialPredictionsService } from '../services/api';
import PublicSpecialPredictionsTable from './PublicSpecialPredictionsTable';

const formatDeadline = (deadline) => {
  if (!deadline) return null;
  return `${deadline.substring(8, 10)}/${deadline.substring(5, 7)} à ${deadline.substring(11, 16)}`;
};

const getAutoPlacement = () => {
  if (typeof window === 'undefined') return 'always';
  if (window.location.pathname.startsWith('/bonus')) return 'bonus';
  if (window.location.pathname.startsWith('/predictions')) return 'predictions';
  return 'always';
};

const getMatchdayCopy = (matchday, isBonusPlacement) => {
  const isSecond = Number(matchday) === 2;
  if (isSecond) {
    return {
      eyebrow: '⚡ Spéciaux deuxième journée',
      title: isBonusPlacement ? 'Résultat des spéciaux deuxième journée' : 'Paris globaux sur la deuxième journée',
      description: isBonusPlacement
        ? 'Les spéciaux de deuxième journée sont verrouillés. Tu peux suivre ton score dès que les résultats sont calculés.'
        : 'Deuxième journée = le deuxième match de chaque équipe, donc 24 matchs au total.',
      lockedText: '🔒 Les pronostics spéciaux de deuxième journée sont verrouillés. Tu peux maintenant consulter les pronos du groupe dans un tableau global.'
    };
  }

  return {
    eyebrow: '⚡ Spéciaux première journée',
    title: isBonusPlacement ? 'Résultat des spéciaux première journée' : 'Paris globaux sur les premiers matchs',
    description: isBonusPlacement
      ? 'Les spéciaux sont maintenant verrouillés et ont rejoint les bonus. Tu peux suivre ton score dès que les résultats sont calculés.'
      : 'Première journée = le premier match de chaque équipe, donc 24 matchs au total. Ce n’est pas uniquement les matchs du 11 juin.',
    lockedText: '🔒 Les pronostics spéciaux sont verrouillés. Tu peux maintenant consulter les pronos du groupe dans un tableau global.'
  };
};

function SpecialPredictionsPanel({ placement = 'auto', currentUserId, matchday = 1, collapsible = false, defaultCollapsed = false }) {
  const [definitions, setDefinitions] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [actual, setActual] = useState({});
  const [currentActual, setCurrentActual] = useState({});
  const [scoring, setScoring] = useState(null);
  const [locked, setLocked] = useState(false);
  const [complete, setComplete] = useState(false);
  const [deadline, setDeadline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('idle');
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const effectivePlacement = placement === 'auto' ? getAutoPlacement() : placement;

  const applyPayload = (payload = {}) => {
    setDefinitions(payload.definitions || []);
    setPredictions(payload.predictions || {});
    setActual(payload.actual || {});
    setCurrentActual(payload.current_actual || payload.actual || {});
    setScoring(payload.scoring || null);
    setLocked(Boolean(payload.locked));
    setComplete(Boolean(payload.complete));
    setDeadline(payload.deadline || null);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const response = await specialPredictionsService.get(matchday);
        if (mounted) applyPayload(response.data);
      } catch (error) {
        console.error('Erreur chargement pronostics spéciaux:', error);
        if (mounted) setStatus('error');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [matchday]);

  const maxPoints = useMemo(
    () => definitions.reduce((sum, definition) => sum + Number(definition.max_points || 0), 0),
    [definitions]
  );

  const completed = definitions.filter(definition => {
    const value = predictions[definition.code];
    return value !== '' && value !== null && value !== undefined;
  }).length;

  const updatePrediction = (code, value) => {
    if (value !== '') {
      const numberValue = Number(value);
      if (!Number.isInteger(numberValue) || numberValue < 0 || numberValue > 300) return;
    }

    setPredictions(prev => ({ ...prev, [code]: value }));
    setStatus('dirty');
  };

  const save = async () => {
    setStatus('saving');
    try {
      const response = await specialPredictionsService.save({ predictions, matchday }, matchday);
      applyPayload(response.data);
      setStatus('saved');
    } catch (error) {
      console.error('Erreur sauvegarde pronostics spéciaux:', error.response?.data || error);
      setStatus('error');
    }
  };

  if (loading) {
    if (effectivePlacement === 'bonus' || effectivePlacement === 'predictions') return null;
    return <section className="special-panel special-loading">Chargement des pronostics spéciaux...</section>;
  }

  if (effectivePlacement === 'bonus' && !locked) return null;
  if (effectivePlacement === 'predictions' && locked) return null;

  const isBonusPlacement = effectivePlacement === 'bonus';
  const copy = getMatchdayCopy(matchday, isBonusPlacement);

  return (
    <section className={`special-panel ${locked ? 'is-locked' : ''} ${isBonusPlacement ? 'in-bonus-page' : ''} ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="special-header">
        <div>
          <span className="special-eyebrow">{copy.eyebrow}</span>
          <h2>{copy.title}</h2>
          <p>{copy.description}</p>
          {deadline && <small>Verrouillage : {formatDeadline(deadline)}</small>}
        </div>

        <div className="special-actions">
          <div className="special-score"><span>Score spécial</span><strong>{scoring?.points || 0}</strong><em>/ {maxPoints} pts</em></div>
          {collapsible && (
            <button type="button" className="collapse-toggle" onClick={() => setCollapsed(prev => !prev)}>
              {collapsed ? 'Déplier' : 'Réduire'}
            </button>
          )}
          {!collapsed && (
            <button type="button" onClick={save} disabled={locked || status === 'saving'}>
              {locked ? 'Verrouillés' : status === 'saving' ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          )}
          {!collapsed && status === 'saved' && <span className="special-status saved">✅ Enregistré</span>}
          {!collapsed && status === 'dirty' && <span className="special-status dirty">✍️ Non sauvegardé</span>}
          {!collapsed && status === 'error' && <span className="special-status error">⚠️ Erreur</span>}
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="special-progress">
            <div><strong>{completed}/{definitions.length}</strong><span>remplis</span></div>
            <div><strong>{maxPoints}</strong><span>points max</span></div>
            <div><strong>{complete ? 'Oui' : 'Non'}</strong><span>résultats complets</span></div>
          </div>

          {locked && <div className="special-lock">{copy.lockedText}</div>}
          {locked && <PublicSpecialPredictionsTable locked={locked} currentUserId={currentUserId} matchday={matchday} />}

          <div className="special-grid">
            {definitions.map(definition => {
              const detail = scoring?.details?.[definition.code];
              const actualValue = actual?.[definition.code];
              const currentValue = currentActual?.[definition.code];
              return (
                <article className="special-card" key={definition.code}>
                  <div className="special-title"><div><span>{definition.max_points} pts max</span><h3>{definition.label}</h3></div><strong>{detail?.points ?? '-'}</strong></div>
                  <p>{definition.description}</p>
                  <label><span>Ton prono</span><input type="number" min="0" max="300" inputMode="numeric" disabled={locked} value={predictions[definition.code] ?? ''} onChange={(event) => updatePrediction(definition.code, event.target.value)} placeholder="0" /></label>
                  <div className="special-result"><span>Résultat réel</span><strong>{actualValue ?? 'En attente'}</strong></div>
                  {locked && <div className="special-result current"><span>Résultat actuel</span><strong>{currentValue ?? 'En attente'}</strong></div>}
                  <small>Tout pile = {definition.max_points} pts, puis -{definition.point_loss_per_gap} par écart.</small>
                </article>
              );
            })}
          </div>
        </>
      )}

      <style>{`
        .special-panel { background: rgba(255,255,255,.96); border: 1px solid rgba(255,255,255,.55); border-radius: 20px; padding: 16px; margin-bottom: 16px; box-shadow: 0 18px 55px rgba(0,0,0,.2); }
        .special-panel.is-collapsed { padding-bottom: 12px; }
        .special-loading { color: #475569; font-weight: 900; }
        .special-header { display: grid; grid-template-columns: minmax(0, 1fr) 230px; gap: 18px; margin-bottom: 14px; }
        .is-collapsed .special-header { margin-bottom: 0; }
        .special-eyebrow { display: inline-flex; padding: 5px 10px; border-radius: 999px; background: #ecfdf5; color: #047857; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px; }
        .special-panel h2 { margin: 0 0 6px; color: #0f172a; font-size: 26px; letter-spacing: -.03em; }
        .special-panel h3 { margin: 2px 0 0; color: #0f172a; font-size: 18px; }
        .special-panel p { margin: 0 0 7px; color: #475569; font-size: 14px; line-height: 1.5; }
        .special-panel small { color: #64748b; font-size: 11px; font-weight: 850; }
        .special-actions { display: grid; gap: 8px; }
        .special-score { display: grid; justify-items: center; border-radius: 16px; padding: 13px; color: white; background: linear-gradient(135deg, #2563eb, #0f766e); }
        .special-score span, .special-score em { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; opacity: .82; font-style: normal; }
        .special-score strong { font-size: 36px; line-height: 1; color: #fff7ed; }
        .special-actions button { border: 0; border-radius: 999px; padding: 10px 13px; background: #0f172a; color: white; font-size: 12px; font-weight: 950; cursor: pointer; }
        .special-actions button.collapse-toggle { background: #e2e8f0; color: #334155; box-shadow: none; }
        .special-actions button:disabled { cursor: not-allowed; opacity: .6; }
        .special-status { font-size: 11px; font-weight: 950; text-align: center; }
        .special-status.saved { color: #047857; } .special-status.dirty { color: #92400e; } .special-status.error { color: #b91c1c; }
        .special-progress { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 14px; }
        .special-progress div { border-radius: 14px; padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
        .special-progress strong { display: block; color: #2563eb; font-size: 18px; }
        .special-progress span, .special-title span, .special-card label span, .special-result span { display: block; color: #0f766e; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .06em; }
        .special-lock { margin-bottom: 14px; padding: 10px 12px; border-radius: 14px; color: #713f12; background: #fef3c7; border: 1px solid rgba(251,191,36,.5); font-size: 12px; font-weight: 900; }
        .special-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .special-card { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 18px; padding: 14px; }
        .special-title { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
        .special-title strong { color: #2563eb; font-size: 24px; }
        .special-card label { display: grid; gap: 6px; margin: 12px 0; }
        .special-card input { width: 100%; box-sizing: border-box; border: 1.5px solid #cbd5e1; border-radius: 13px; background: white; color: #0f172a; padding: 10px 11px; font-size: 18px; font-weight: 950; }
        .special-card input:disabled { color: #94a3b8; background: #f1f5f9; }
        .special-result { display: flex; justify-content: space-between; gap: 10px; padding: 9px 10px; border-radius: 13px; background: white; border: 1px solid #e2e8f0; }
        .special-result.current { margin-top: 7px; background: #ecfdf5; border-color: #bbf7d0; }
        .special-result strong { color: #d97706; }
        .special-result.current strong { color: #047857; }
        @media (max-width: 940px) { .special-header, .special-grid { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .special-progress { grid-template-columns: 1fr; } .special-panel { padding: 12px; } }
      `}</style>
    </section>
  );
}

export default SpecialPredictionsPanel;
