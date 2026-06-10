import React, { useCallback, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Predictions from './pages/Predictions';
import BonusPredictions from './pages/BonusPredictions';
import Rankings from './pages/Rankings';
import UserStats from './pages/UserStats';
import Admin from './pages/Admin';
import AdminUsers from './pages/AdminUsers';
import Rules from './pages/Rules';
import Simulation from './pages/Simulation';
import Profile from './pages/Profile';
import ResetPassword from './pages/ResetPassword';
import UserAvatar from './components/UserAvatar';
import './nav-status.css';
import './mobile-responsive.css';

function Navigation({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  if (!user) return null;

  const closeMenu = () => setMenuOpen(false);

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
        <Link to="/bonus" className="nav-bonus-link" onClick={closeMenu}>🎁 Bonus</Link>
        {user?.is_admin ? (
          <Link to="/rankings" onClick={closeMenu}>🏆 Classement</Link>
        ) : (
          <span className="nav-rankings-locked" title="Classement en construction">
            🏆 Classement <small>en construction</small>
          </span>
        )}
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

function RankingsLocked() {
  return (
    <div className="ranking-locked-page">
      <div className="ranking-locked-card">
        <h1>🚧 Classement en construction</h1>
        <p>Le classement est encore en préparation et sera ouvert à tout le monde bientôt. En attendant, concentre-toi sur tes pronostics et surtout sur les bonus.</p>
      </div>
    </div>
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
      <Routes>
        <Route path="/" element={user ? <Predictions /> : <Home onLogin={handleLogin} />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/predictions" element={user ? <Predictions /> : <Home onLogin={handleLogin} />} />
        <Route path="/bonus" element={user ? <BonusPredictions /> : <Home onLogin={handleLogin} />} />
        <Route path="/rankings" element={user?.is_admin ? <Rankings /> : <RankingsLocked />} />
        <Route path="/stats" element={user ? <UserStats /> : <Home onLogin={handleLogin} />} />
        <Route path="/simulation" element={user ? <Simulation /> : <Home onLogin={handleLogin} />} />
        <Route path="/profile" element={user ? <Profile user={user} onUserUpdate={handleUserUpdate} /> : <Home onLogin={handleLogin} />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/admin" element={user?.is_admin ? <AdminPanel /> : <Predictions />} />
      </Routes>
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
