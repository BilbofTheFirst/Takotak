import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Predictions from './pages/Predictions';
import Rankings from './pages/Rankings';
import UserStats from './pages/UserStats';
import Admin from './pages/Admin';
import Rules from './pages/Rules';
import Simulation from './pages/Simulation';

function Navigation({ user, onLogout }) {
  if (!user) return null;

  return (
    <nav style={{ background: '#333', color: 'white', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '20px' }}>
        <Link to="/predictions" style={{ color: 'white', textDecoration: 'none' }}>🎯 Pronostics</Link>
        <Link to="/rankings" style={{ color: 'white', textDecoration: 'none' }}>🏆 Classement</Link>
        <Link to="/stats" style={{ color: 'white', textDecoration: 'none' }}>📊 Mes Stats</Link>
        <Link to="/simulation" style={{ color: 'white', textDecoration: 'none' }}>🎮 Simulation</Link>
        <Link to="/rules" style={{ color: 'white', textDecoration: 'none' }}>📋 Règles</Link>
        <Link to="/admin" style={{ color: 'white', textDecoration: 'none' }}>⚙️ Admin</Link>
      </div>
      <div>
        <span style={{ marginRight: '15px' }}>Bienvenue, {user.username}!</span>
        <button onClick={onLogout} style={{ padding: '5px 15px', background: '#dc3545', color: 'white', border: 'none', cursor: 'pointer' }}>
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
        <Route path="/rankings" element={<Rankings />} />
        <Route path="/stats" element={user ? <UserStats /> : <Home onLogin={handleLogin} />} />
        <Route path="/simulation" element={user ? <Simulation /> : <Home onLogin={handleLogin} />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/admin" element={user ? <Admin /> : <Home onLogin={handleLogin} />} />
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
