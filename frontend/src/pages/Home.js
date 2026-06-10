import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import TakotakLogo from '../components/TakotakLogo';

function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let response;
      if (isLogin) {
        response = await authService.login(email, password);
        setSuccess('Connexion réussie! Redirection...');
      } else {
        response = await authService.register(username, email, password);
        setSuccess('Compte créé avec succès! Redirection...');
      }

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      setTimeout(() => {
        window.location.href = '/predictions';
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
      setLoading(false);
    }
  };

  const PRIMARY = '#0f766e';
  const SECONDARY = '#d97706';
  const GRADIENT = `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`;

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top left, rgba(217,119,6,.22), transparent 32%), radial-gradient(circle at top right, rgba(15,118,110,.24), transparent 34%), linear-gradient(135deg, #071b16 0%, #0f172a 45%, #111827 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '470px', background: 'white', borderRadius: '24px', boxShadow: '0 24px 70px rgba(0,0,0,0.35)', overflow: 'hidden', border: '1px solid rgba(255,255,255,.5)' }}>

        <div style={{ background: 'linear-gradient(135deg, rgba(15,118,110,.98), rgba(217,119,6,.98))', padding: '40px 20px 36px', textAlign: 'center', color: 'white' }}>
          <TakotakLogo size="large" />
          <p style={{ margin: '12px 0 0', opacity: 0.9, fontSize: '14px', fontWeight: 800 }}>Prédictions Coupe du Monde 2026</p>
        </div>

        <div style={{ padding: '40px' }}>
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '22px', marginBottom: '5px', color: '#333' }}>
              {isLogin ? 'Bienvenue!' : 'Créer un compte'}
            </h3>
            <p style={{ color: '#999', margin: '0', fontSize: '14px' }}>
              {isLogin ? 'Connecte-toi pour voir tes prédictions' : 'Rejoins la compétition'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {!isLogin && (
              <div>
                <label style={labelStyle}>Nom d'utilisateur</label>
                <input
                  type="text"
                  placeholder="ton_pseudo"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  style={inputStyle(loading)}
                  onFocus={(e) => e.target.style.borderColor = PRIMARY}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                placeholder="ton@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                style={inputStyle(loading)}
                onFocus={(e) => e.target.style.borderColor = PRIMARY}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            <div>
              <label style={labelStyle}>Mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={inputStyle(loading)}
                onFocus={(e) => e.target.style.borderColor = PRIMARY}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            {error && <div style={alertStyle('#fee', '#fcc', '#c33')}>❌ {error}</div>}
            {success && <div style={alertStyle('#efe', '#cfc', '#3c3')}>✅ {success}</div>}

            <button type="submit" disabled={loading} style={submitButtonStyle(loading, GRADIENT)}>
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', originX: '50%', originY: '50%' }}>⏳</span>
                  {isLogin ? 'Connexion...' : 'Création du compte...'}
                </>
              ) : (
                isLogin ? '🔓 Connexion' : '✨ Créer mon compte'
              )}
            </button>
          </form>

          <div style={{ marginTop: '25px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
            <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
              {isLogin ? "Tu n'as pas de compte? " : 'Tu as déjà un compte? '}
            </p>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
                setEmail('');
                setPassword('');
                setUsername('');
              }}
              style={linkButtonStyle(PRIMARY)}
              onMouseOver={(e) => e.target.style.color = SECONDARY}
              onMouseOut={(e) => e.target.style.color = PRIMARY}
            >
              {isLogin ? 'Créer un compte' : 'Me connecter'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '14px',
  fontWeight: '500',
  color: '#555'
};

const inputStyle = (loading) => ({
  width: '100%',
  padding: '12px',
  border: '2px solid #e0e0e0',
  borderRadius: '10px',
  fontSize: '14px',
  transition: 'all 0.3s',
  boxSizing: 'border-box',
  cursor: loading ? 'not-allowed' : 'text',
  opacity: loading ? 0.6 : 1
});

const alertStyle = (background, border, color) => ({
  padding: '12px',
  background,
  border: `1px solid ${border}`,
  borderRadius: '10px',
  color,
  fontSize: '14px',
  animation: 'slideDown 0.3s ease-out'
});

const submitButtonStyle = (loading, gradient) => ({
  padding: '14px',
  background: loading ? '#ccc' : gradient,
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: loading ? 'not-allowed' : 'pointer',
  transition: 'all 0.3s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  opacity: loading ? 0.7 : 1
});

const linkButtonStyle = (color) => ({
  background: 'none',
  border: 'none',
  color,
  cursor: 'pointer',
  textDecoration: 'underline',
  fontSize: '14px',
  fontWeight: 'bold',
  transition: 'all 0.3s'
});

export default Home;
