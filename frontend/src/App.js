import React, { Suspense, lazy, useCallback, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import api, { bonusPredictionsService, specialPredictionsService } from './services/api';
import UserAvatar from './components/UserAvatar';
import TakotakLogo from './components/TakotakLogo';
import PredictionReminderModal from './components/PredictionReminderModal';
import './nav-status.css';
import './mobile-responsive.css';
import './simulation-responsive.css';
import './rankings-row-highlight.css';

const Home = lazy(() => import('./pages/Home'));
const Predictions = lazy(() => import('./pages/Predictions'));
const BonusPredictions = lazy(() => import('./pages/BonusPredictions'));
const Rankings = lazy(() => import('./pages/Rankings'));
const UserStats = lazy(() => import('./pages/UserStats'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminMonitoring = lazy(() => import('./pages/AdminMonitoring'));
const Rules = lazy(() => import('./pages/Rules'));
const Simulation = lazy(() => import('./pages/Simulation'));
const Profile = lazy(() => import('./pages/Profile'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

const GROUP_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const BONUS_STATUS_REFRESH_EVENT = 'takotak:bonus-status-refresh';
const REMINDER_SESSION_KEY = 'takotak:prediction-reminder-shown';

const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== '';

const hasPendingBonusPredictions = (data) => {
  if (!data || data.locked) return false;

  const prediction = data.prediction || {};
  const groupWinners = prediction.group_winners || {};
  const semifinalists = Array.isArray(prediction.semifinalists)
    ? prediction.semifinalists.filter(hasValue)
    : [];

  return (
    GROUP_CODES.some(group => !hasValue(groupWinners[group])) ||
    !hasValue(prediction.champion) ||
    !hasValue(prediction.runner_up) ||
    semifinalists.length < 4
  );
};

const hasPendingSpecialPredictions = (data) => {
  if (!data || data.locked) return false;

  const definitions = data.definitions || [];
  const predictions = data.predictions || {};

  return definitions.some(definition => !hasValue(predictions[definition.code]));
};

export const refreshBonusAttentionStatus = () => {
  window.dispatchEvent(new Event(BONUS_STATUS_REFRESH_EVENT));
};

function PageLoader() {
  return (
    <div className="route-loader-page">
      <div className="route-loader-card">⚽ Chargement...</div>
      <style>{`
        .route-loader-page {
          min-height: calc(100vh - 58px);
          display: grid;
          place-items: center;
          padding: 24px;
          background: linear-gradient(135deg, #071b16 0%, #0f172a 52%, #111827 100%);
        }
        .route-loader-card {
          padding: 18px 24px;
          border-radius: 18px;
          color: white;
          background: rgba(255,255,255,.1);
          border: 1px solid rgba(255,255,255,.16);
          font-size: 15px;
          font-weight: 900;
          box-shadow: 0 18px 45px rgba(0,0,0,.2);
        }
      `}</style>
    </div>
  );
}

function Navigation({ user, onLogout, hasBonusAttention, hasPredictionAttention }) {
  const [menuOpen, setMenuOpen] = useState(false);
  if (!user) return null;

  const closeMenu = () => setMenuOpen(false);
  const predictionsClassName = hasPredictionAttention ? 'nav-attention-link' : '';
  const bonusClassName = hasBonusAttention ? 'nav-attention-link' : '';

  return (
    <nav className={`top-nav ${menuOpen ? 'mobile-open' : ''}`}>
      <div className="nav-mobile-header">
        <div className="brand">
          <Link to="/predictions" onClick={closeMenu} aria-label="TakOtak">
            <TakotakLogo size="small" withBadge />
          </Link>
        </div>

        <button
          type="button"
          className="mobile-menu-toggle"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setMenuOpen(prev => !prev)}
        >
          {menuOpen ? '✕ Fermer' : '☰ Menu'}
        </button>
      </div>

      <div className="nav-links">
        <Link to="/predictions" className={predictionsClassName} onClick={closeMenu}>🎯 Pronostics</Link>
        <Link to="/bonus" className={bonusClassName} onClick={closeMenu}>🎁 Bonus</Link>
        <Link to="/rankings" onClick={closeMenu}>🏆 Classement</Link>
        <Link to="/stats" onClick={closeMenu}>📊 Stats</Link>
        <Link to="/simulation" onClick={closeMenu}>🎮 Simulation</Link>
        <Link to="/rules" onClick={closeMenu}>📋 Règles</Link>
        {user?.is_admin && <Link to="/admin" onClick={closeMenu}>⚙️ Admin</Link>}
      </div>

      <div className="nav-user">
        <Link to="/profile" className="nav-profile-link" title="Mon profil" onClick={closeMenu}>
          <UserAvatar user={user} size={32} />
          <span>{user.username}</span>
        </Link>
        <button
          onClick={() => {
            closeMenu();
            onLogout();
          }}
          className="button button-danger button-small"
        >
          Déconnexion
        </button>
      </div>
    </nav>
  );
}

const ADMIN_TABS = [
  { value: 'monitoring', label: 'Monitoring', icon: '📡' },
  { value: 'matches', label: 'Matches', icon: '⚽' },
  { value: 'users', label: 'Utilisateurs', icon: '👥' }
];

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('monitoring');

  return (
    <div className="admin-tabs-page">
      <section className="admin-tabs-hero">
        <div>
          <span className="admin-tabs-eyebrow">Administration</span>
          <h1>⚙️ Panel Admin</h1>
          <p>Monitoring, encodage des matchs et gestion des utilisateurs au même endroit.</p>
        </div>

        <div className="admin-tabs-nav" role="tablist" aria-label="Sections admin">
          {ADMIN_TABS.map(tab => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.value}
              className={activeTab === tab.value ? 'active' : ''}
              onClick={() => setActiveTab(tab.value)}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <div className="admin-tab-content">
        {activeTab === 'monitoring' && <AdminMonitoring />}
        {activeTab === 'matches' && <Admin />}
        {activeTab === 'users' && <AdminUsers />}
      </div>

      <style>{`
        .admin-tabs-page {
          min-height: 100vh;
          padding: 24px 18px 42px;
          background: radial-gradient(circle at top left, rgba(217,119,6,.13), transparent 32%), radial-gradient(circle at top right, rgba(15,118,110,.16), transparent 32%), linear-gradient(135deg, #071b16 0%, #0f172a 44%, #111827 100%);
        }
        .admin-tabs-hero {
          width: min(1220px, 100%);
          margin: 0 auto 16px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 18px;
          align-items: end;
          color: white;
        }
        .admin-tabs-eyebrow {
          display: inline-flex;
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,.12);
          border: 1px solid rgba(255,255,255,.18);
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .08em;
          color: #fde68a;
          margin-bottom: 10px;
        }
        .admin-tabs-hero h1 {
          margin: 0 0 7px;
          font-size: clamp(28px, 3.4vw, 44px);
          line-height: 1;
          letter-spacing: -.04em;
        }
        .admin-tabs-hero p {
          margin: 0;
          color: rgba(255,255,255,.76);
          font-size: 14px;
          line-height: 1.5;
        }
        .admin-tabs-nav {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
          padding: 8px;
          border-radius: 18px;
          background: rgba(255,255,255,.1);
          border: 1px solid rgba(255,255,255,.16);
          box-shadow: 0 18px 45px rgba(0,0,0,.18);
          backdrop-filter: blur(10px);
        }
        .admin-tabs-nav button {
          border: 0;
          border-radius: 999px;
          padding: 10px 13px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: rgba(255,255,255,.78);
          background: rgba(255,255,255,.08);
          font-size: 13px;
          font-weight: 950;
          cursor: pointer;
          transition: transform .15s ease, background .15s ease, color .15s ease;
        }
        .admin-tabs-nav button:hover {
          transform: translateY(-1px);
          background: rgba(255,255,255,.15);
          color: white;
        }
        .admin-tabs-nav button.active {
          color: #0f172a;
          background: white;
          box-shadow: 0 10px 24px rgba(0,0,0,.18);
        }
        .admin-tab-content > .admin-page {
          min-height: auto;
          padding: 0;
          background: transparent;
        }
        .admin-tab-content > .admin-page > .admin-hero {
          display: none;
        }
        @media (max-width: 760px) {
          .admin-tabs-page { padding: 18px 10px 36px; }
          .admin-tabs-hero { grid-template-columns: 1fr; align-items: start; }
          .admin-tabs-nav { justify-content: stretch; }
          .admin-tabs-nav button { flex: 1 1 145px; justify-content: center; }
        }
      `}</style>
    </div>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [hasBonusAttention, setHasBonusAttention] = useState(false);
  const [hasPredictionAttention, setHasPredictionAttention] = useState(false);
  const [reminderStatus, setReminderStatus] = useState(null);
  const [showReminder, setShowReminder] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const refreshBonusStatus = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      setHasBonusAttention(false);
      setHasPredictionAttention(false);
      return;
    }

    const [attentionResult, bonusResult, specialResult] = await Promise.allSettled([
      api.get('/predictions/attention-status'),
      bonusPredictionsService.get(),
      specialPredictionsService.get()
    ]);

    if (attentionResult.status === 'fulfilled') {
      const attention = attentionResult.value.data || {};
      const pendingMatchPredictions = Number(attention.matches?.missing_count || 0) > 0;
      const pendingSpecial = Boolean(attention.special?.urgent);
      const pendingBonus = Boolean(attention.bonus?.urgent);

      setHasBonusAttention(pendingBonus);
      setHasPredictionAttention(pendingMatchPredictions || pendingSpecial);
      return;
    }

    const pendingBonus = bonusResult.status === 'fulfilled'
      ? hasPendingBonusPredictions(bonusResult.value.data)
      : false;
    const pendingSpecial = specialResult.status === 'fulfilled'
      ? hasPendingSpecialPredictions(specialResult.value.data)
      : false;

    setHasBonusAttention(pendingBonus);
    setHasPredictionAttention(pendingSpecial);
  }, []);

  const loadReminderStatus = useCallback(async () => {
    if (!localStorage.getItem('token') || sessionStorage.getItem(REMINDER_SESSION_KEY) === '1') {
      return;
    }

    try {
      const response = await api.get('/predictions/attention-status');
      if (response.data?.has_attention) {
        setReminderStatus(response.data);
        setShowReminder(true);
        sessionStorage.setItem(REMINDER_SESSION_KEY, '1');
      }
    } catch (error) {
      console.warn('Prediction reminder status unavailable', error.response?.data || error);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setHasBonusAttention(false);
      setHasPredictionAttention(false);
      setReminderStatus(null);
      setShowReminder(false);
      return undefined;
    }

    refreshBonusStatus();
    loadReminderStatus();
    const intervalId = window.setInterval(refreshBonusStatus, 60000);
    window.addEventListener(BONUS_STATUS_REFRESH_EVENT, refreshBonusStatus);
    window.addEventListener('focus', refreshBonusStatus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(BONUS_STATUS_REFRESH_EVENT, refreshBonusStatus);
      window.removeEventListener('focus', refreshBonusStatus);
    };
  }, [user, refreshBonusStatus, loadReminderStatus]);

  const handleUserUpdate = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const handleLogin = (userData) => {
    sessionStorage.removeItem(REMINDER_SESSION_KEY);
    handleUserUpdate(userData);
    navigate('/predictions');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem(REMINDER_SESSION_KEY);
    setUser(null);
    setHasBonusAttention(false);
    setHasPredictionAttention(false);
    setReminderStatus(null);
    setShowReminder(false);
    navigate('/');
  };

  return (
    <>
      <Navigation user={user} onLogout={handleLogout} hasBonusAttention={hasBonusAttention} hasPredictionAttention={hasPredictionAttention} />
      {showReminder && <PredictionReminderModal status={reminderStatus} onClose={() => setShowReminder(false)} />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={user ? <Predictions /> : <Home onLogin={handleLogin} />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/predictions" element={user ? <Predictions /> : <Home onLogin={handleLogin} />} />
          <Route path="/bonus" element={user ? <BonusPredictions /> : <Home onLogin={handleLogin} />} />
          <Route path="/rankings" element={user ? <Rankings currentUser={user} /> : <Home onLogin={handleLogin} />} />
          <Route path="/stats" element={user ? <UserStats /> : <Home onLogin={handleLogin} />} />
          <Route path="/simulation" element={user ? <Simulation /> : <Home onLogin={handleLogin} />} />
          <Route path="/profile" element={user ? <Profile user={user} onUserUpdate={handleUserUpdate} /> : <Home onLogin={handleLogin} />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/admin" element={user?.is_admin ? <AdminPanel /> : <Predictions />} />
        </Routes>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
