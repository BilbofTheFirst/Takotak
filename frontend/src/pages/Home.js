import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, passwordResetService } from '../services/api';

function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const resetMessages = () => {
    setError('');
    setSuccess('');
    setResetUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      if (isForgotPassword) {
        const response = await passwordResetService.request(email);
        setSuccess(response.data.message || 'Si un compte existe avec cet email, un lien de réinitialisation a été généré.');
        if (response.data.reset_url) {
          setResetUrl(response.data.reset_url);
        }
        setLoading(false);
        return;
      }

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

  const switchMode = (mode) => {
    setIsForgotPassword(mode === 'forgot');
    setIsLogin(mode !== 'register');
    resetMessages();
    setEmail('');
    setPassword('');
    setUsername('');
  };

  const PRIMARY = '#2563eb';
  const SECONDARY = '#ec4899';
  const GRADIENT = `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`;

  const title = isForgotPassword ? 'Mot de passe oublié' : (isLogin ? 'Bienvenue!' : 'Créer un compte');
  const subtitle = isForgotPassword
    ? 'Indique ton email pour générer un lien de réinitialisation'
    : (isLogin ? 'Connecte-toi pour voir tes prédictions' : 'Rejoins la compétition');

  return (
    <div style={{ minHeight: '100vh', background: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '450px', background: 'white', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        <div style={{ background: GRADIENT, padding: '40px 20px', textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontSize: '48px', margin: '0 0 10px 0' }}>🏆</h1>
          <h2 style={{ fontSize: '32px', margin: '0 0 5px 0', fontWeight: 'bold' }}>TakoTak</h2>
          <p style={{ margin: '0', opacity: 0.9, fontSize: '14px' }}>Prédictions Coupe du Monde 2026</p>
        </div>

        <div style={{ padding: '40px' }}>
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '22px', marginBottom: '5px', color: '#333' }}>
              {title}
            </h3>
            <p style={{ color: '#999', margin: '0', fontSize: '14px' }}>
              {subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {!isLogin && !isForgotPassword && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#555' }}>Nom d'utilisateur</label>
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
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#555' }}>Email</label>
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

            {!isForgotPassword && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#555' }}>Mot de passe</label>
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
            )}

            {error && (
              <div style={alertStyle('#fee', '#fcc', '#c33')}>
                ❌ {error}
              </div>
            )}

            {success && (
              <div style={alertStyle('#efe', '#cfc', '#3c3')}>
                ✅ {success}
              </div>
            )}

            {resetUrl && (
              <div style={alertStyle('#eff6ff', '#bfdbfe', '#1d4ed8')}>
                🔗 Lien de test :{' '}
                <a href={resetUrl} style={{ color: '#1d4ed8', fontWeight: 'bold' }}>
                  Réinitialiser le mot de passe
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '14px',
                background: loading ? '#ccc' : GRADIENT,
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
              }}
            >
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', originX: '50%', originY: '50%' }}>⏳</span>
                  {isForgotPassword ? 'Génération...' : (isLogin ? 'Connexion...' : 'Création du compte...')}
                </>
              ) : (
                isForgotPassword ? '🔁 Générer le lien' : (isLogin ? '🔓 Connexion' : '✨ Créer mon compte')
              )}
            </button>
          </form>

          <div style={{ marginTop: '25px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
            {!isForgotPassword && isLogin && (
              <button
                onClick={() => switchMode('forgot')}
                style={linkButtonStyle(PRIMARY)}
                onMouseOver={(e) => e.target.style.color = SECONDARY}
                onMouseOut={(e) => e.target.style.color = PRIMARY}
              >
                Mot de passe oublié ?
              </button>
            )}

            <p style={{ margin: '12px 0 10px 0', color: '#666', fontSize: '14px' }}>
              {isForgotPassword
                ? 'Tu te souviens finalement de ton mot de passe ? '
                : (isLogin ? "Tu n'as pas de compte? " : 'Tu as déjà un compte? ')}
            </p>
            <button
              onClick={() => switchMode(isForgotPassword ? 'login' : (isLogin ? 'register' : 'login'))}
              style={linkButtonStyle(PRIMARY)}
              onMouseOver={(e) => e.target.style.color = SECONDARY}
              onMouseOut={(e) => e.target.style.color = PRIMARY}
            >
              {isForgotPassword ? 'Me connecter' : (isLogin ? 'Créer un compte' : 'Me connecter')}
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
