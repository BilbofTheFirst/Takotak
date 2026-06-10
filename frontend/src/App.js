import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Predictions from './pages/Predictions';
import BonusPredictions from './pages/BonusPredictions';
import Rankings from './pages/Rankings';
import UserStats from './pages/UserStats';
import Admin from './pages/Admin';
import Rules from './pages/Rules';
import Simulation from './pages/Simulation';

function Navigation({ user, onLogout }) {
  if (!user) return null;

  return (
    <nav className="top-nav">
      <div className="brand">
        <Link to="/predictions">⚽ TakoTak</Link>
      </div>

      <div className="nav-links">
        <Link to="/predictions">🎯 Pronostics</Link>
        <Link to="/bonus">🎁 Bonus</Link>
        <Link to="/rankings">🏆 Classement</Link>
        <Link to="/stats">📊 Mes Stats</Link>
        <Link to="/simulation">🎮 Simulation</Link>
        <Link to="/rules">📋 Règles</Link>
        {user?.is_admin && <Link to="/admin">⚙️ Admin</Link>}
      </div>

      <div className="nav-user">
        <span>Bienvenue, {user.username}</span>
        <button onClick={onLogout} className="button button-danger button-small">
          Déconnexion
        </button>
      </div>
    </nav>
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

  const handleLogin = (userData) => {
    setUser(userData);
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
        <Route path="/predictions" element={user ? <Predictions /> : <Home onLogin={handleLogin} />} />
        <Route path="/bonus" element={user ? <BonusPredictions /> : <Home onLogin={handleLogin} />} />
        <Route path="/rankings" element={<Rankings />} />
        <Route path="/stats" element={user ? <UserStats /> : <Home onLogin={handleLogin} />} />
        <Route path="/simulation" element={user ? <Simulation /> : <Home onLogin={handleLogin} />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/admin" element={user?.is_admin ? <Admin /> : <Predictions />} />
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
