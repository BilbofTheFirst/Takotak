import React, { Suspense, lazy, useCallback, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import UserAvatar from './components/UserAvatar';
import './nav-status.css';
import './mobile-responsive.css';
import './simulation-responsive.css';

const Home = lazy(() => import('./pages/Home'));
const Predictions = lazy(() => import('./pages/Predictions'));
const BonusPredictions = lazy(() => import('./pages/BonusPredictions'));
const Rankings = lazy(() => import('./pages/Rankings'));
const UserStats = lazy(() => import('./pages/UserStats'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const Rules = lazy(() => import('./pages/Rules'));
const Simulation = lazy(() => import('./pages/Simulation'));
const Profile = lazy(() => import('./pages/Profile'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

const BONUS_NEON_END_AT = new Date('2026-06-11T00:00:00+02:00');

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

function Navigation({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  if (!user) return null;

  const closeMenu = () => setMenuOpen(false);
  const bonusClassName = new Date() < BONUS_NEON_END_AT ? 'nav-bonus-link' : '';

  return (
    <nav className={`top-nav ${menuOpen ? 'mobile-open' : ''}`}>
      <div className="nav-mobile-header">
        <div className="brand">
          <Link to="/predictions" onClick={closeMenu}>⚽ TakoTak</Link>
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
        <Link to="/predictions" onClick={closeMenu}>🎯 Pronostics</Link>
        <Link to="/bonus" className={bonusClassName} onClick={closeMenu}>🎁 Bonus</Link>
        <Link to="/rankings" onClick={closeMenu}>🏆 Classement</Link>
        <Link to="/stats" onClick={closeMenu}>📊 Mes Stats</Link>
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

function AdminPanel() {
  return (
    <>
      <Admin />
      <AdminUsers />
    </>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleUserUpdate = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const handleLogin = (userData) => {
    handleUserUpdate(userData);
    navigate('/predictions');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <>
      <Navigation user={user} onLogout={handleLogout} />
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
