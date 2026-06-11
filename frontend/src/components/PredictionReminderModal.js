import React from 'react';
import { Link } from 'react-router-dom';

const formatTime = (value) => value ? value.substring(11, 16) : '--:--';

function PredictionReminderModal({ status, onClose }) {
  if (!status?.has_attention) return null;

  const matchMissing = status.matches?.missing_count || 0;
  const bonusMissing = status.bonus?.urgent ? status.bonus?.missing_count || 0 : 0;
  const specialMissing = status.special?.urgent ? status.special?.missing_count || 0 : 0;
  const totalMissing = status.total_missing || matchMissing + bonusMissing + specialMissing;

  return (
    <div className="reminder-overlay" role="dialog" aria-modal="true" aria-labelledby="prediction-reminder-title">
      <div className="reminder-modal">
        <button type="button" className="reminder-close" onClick={onClose} aria-label="Fermer">×</button>

        <div className="reminder-badge">⏰ Attention</div>
        <h2 id="prediction-reminder-title">Il te reste {totalMissing} prono{totalMissing > 1 ? 's' : ''} à faire</h2>
        <p className="reminder-intro">
          Pense à compléter ce qui arrive bientôt. Les bonus et les spéciaux peuvent rapporter beaucoup de points.
        </p>

        <div className="reminder-summary">
          <div><strong>{matchMissing}</strong><span>matchs dans les 24h</span></div>
          <div><strong>{bonusMissing}</strong><span>bonus long terme</span></div>
          <div><strong>{specialMissing}</strong><span>spéciaux J1</span></div>
        </div>

        {status.matches?.missing?.length > 0 && (
          <div className="reminder-section">
            <h3>Matchs à pronostiquer dans les 24 prochaines heures</h3>
            <ul>
              {status.matches.missing.slice(0, 5).map(match => (
                <li key={match.id}><strong>{formatTime(match.start_time)}</strong> {match.team1} - {match.team2}</li>
              ))}
            </ul>
            {status.matches.missing.length > 5 && <small>+ {status.matches.missing.length - 5} autre{status.matches.missing.length - 5 > 1 ? 's' : ''}</small>}
          </div>
        )}

        {bonusMissing > 0 && (
          <div className="reminder-section warning">
            <h3>Bonus long terme incomplets</h3>
            <p>{bonusMissing} champ{bonusMissing > 1 ? 's' : ''} à compléter avant verrouillage.</p>
          </div>
        )}

        {specialMissing > 0 && (
          <div className="reminder-section warning">
            <h3>Spéciaux première journée incomplets</h3>
            <p>{specialMissing} question{specialMissing > 1 ? 's' : ''} à compléter pour la première journée complète (24 matchs).</p>
          </div>
        )}

        <div className="reminder-actions">
          <Link to="/predictions" onClick={onClose}>Compléter mes pronos</Link>
          <button type="button" onClick={onClose}>Plus tard</button>
        </div>
      </div>

      <style>{`
        .reminder-overlay { position: fixed; inset: 0; z-index: 2000; display: grid; place-items: center; padding: 18px; background: rgba(2, 6, 23, .62); backdrop-filter: blur(6px); }
        .reminder-modal { position: relative; width: min(520px, 100%); border-radius: 24px; padding: 22px; background: #fff; color: #0f172a; box-shadow: 0 28px 90px rgba(0,0,0,.36); border: 1px solid rgba(255,255,255,.7); }
        .reminder-close { position: absolute; top: 12px; right: 12px; width: 34px; height: 34px; border: 0; border-radius: 50%; background: #f1f5f9; color: #334155; font-size: 24px; line-height: 1; cursor: pointer; }
        .reminder-badge { display: inline-flex; padding: 6px 11px; border-radius: 999px; background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 950; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 10px; }
        .reminder-modal h2 { margin: 0 36px 8px 0; font-size: clamp(24px, 4vw, 34px); line-height: 1.05; letter-spacing: -.04em; }
        .reminder-intro { margin: 0 0 15px; color: #475569; font-size: 14px; line-height: 1.45; }
        .reminder-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
        .reminder-summary div { border-radius: 16px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
        .reminder-summary strong { display: block; color: #d97706; font-size: 26px; line-height: 1; }
        .reminder-summary span { display: block; margin-top: 6px; color: #475569; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .04em; }
        .reminder-section { border-radius: 16px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; margin-bottom: 10px; }
        .reminder-section.warning { background: #fff7ed; border-color: #fed7aa; }
        .reminder-section h3 { margin: 0 0 8px; font-size: 14px; color: #0f766e; }
        .reminder-section p { margin: 0; color: #334155; font-size: 13px; font-weight: 800; }
        .reminder-section ul { margin: 0; padding-left: 18px; color: #334155; font-size: 13px; line-height: 1.45; }
        .reminder-section li strong { color: #0f766e; }
        .reminder-section small { display: block; margin-top: 6px; color: #64748b; font-weight: 850; }
        .reminder-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 14px; }
        .reminder-actions a, .reminder-actions button { border: 0; border-radius: 999px; padding: 10px 14px; font-size: 13px; font-weight: 950; cursor: pointer; text-decoration: none; }
        .reminder-actions a { background: linear-gradient(135deg, #0f766e, #d97706); color: white; box-shadow: 0 10px 22px rgba(15,118,110,.2); }
        .reminder-actions button { background: #e2e8f0; color: #0f172a; }
        @media (max-width: 560px) { .reminder-modal { padding: 18px; } .reminder-summary { grid-template-columns: 1fr; } .reminder-actions { flex-direction: column; } .reminder-actions a, .reminder-actions button { text-align: center; width: 100%; box-sizing: border-box; } }
      `}</style>
    </div>
  );
}

export default PredictionReminderModal;
