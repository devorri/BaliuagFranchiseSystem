import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, User, ArrowRight, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, sessionError, clearSessionError } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    clearSessionError();
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (result.success && result.user) {
      redirectUser(result.user.role);
    } else {
      setError(result.error || 'Invalid username or password. Please try again.');
    }
  };

  const redirectUser = (role: string) => {
    switch (role) {
      case 'driver':
        navigate('/driver');
        break;
      case 'president':
      case 'toda_president':
        navigate('/toda');
        break;
      case 'admin':
        navigate('/admin/accounts');
        break;
      case 'operator':
        navigate('/dashboard');
        break;
      default:
        navigate('/login');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative'
    }}>
      <div className="glass-container animate-fade-in" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '2.75rem 2.25rem',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Logo Branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src="/baliuag-logo.png"
            alt="City of Baliwag Seal"
            style={{ height: '70px', width: 'auto', marginBottom: '0.75rem', filter: 'drop-shadow(0 0 12px rgba(6, 182, 212, 0.5))' }}
          />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            City of Baliwag
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Tricycle Franchise & MTOP Portal
          </span>
        </div>

        {/* Single Session Notice Alert */}
        {sessionError && (
          <div style={{
            background: 'rgba(234, 179, 8, 0.15)',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            color: '#fde047',
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            fontSize: '0.88rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            lineHeight: '1.4'
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{sessionError}</span>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            fontSize: '0.88rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="glass-input"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                className="glass-input"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-glass btn-primary-glass" 
            style={{ padding: '0.95rem', fontSize: '1.05rem', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Log In to Portal'} <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Link to="/register" style={{ color: '#38bdf8', fontSize: '0.88rem', textDecoration: 'none', fontWeight: 600 }}>
            Don't have an account? Register here
          </Link>
          <Link to="/" style={{ color: '#94a3b8', fontSize: '0.88rem', textDecoration: 'none' }}>
            ← Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}
