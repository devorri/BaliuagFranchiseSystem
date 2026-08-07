import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, User, ArrowRight, ShieldCheck, UserCheck, Award, Bike } from 'lucide-react';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = login(username, password);
    if (user) {
      redirectUser(user.role);
    } else {
      setError('Maling username o password. Pakisubukan muli.');
    }
  };

  const quickLogin = (u: string, p: string) => {
    setError('');
    const user = login(u, p);
    if (user) {
      redirectUser(user.role);
    }
  };

  const redirectUser = (role: string) => {
    switch (role) {
      case 'driver':
        navigate('/driver');
        break;
      case 'toda_president':
        navigate('/toda');
        break;
      case 'admin':
        navigate('/admin');
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
            alt="Lungsod ng Baliwag Seal"
            style={{ height: '70px', width: 'auto', marginBottom: '0.75rem', filter: 'drop-shadow(0 0 12px rgba(6, 182, 212, 0.5))' }}
          />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Lungsod ng Baliwag
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Tricycle Franchise & MTOP Portal
          </span>
        </div>

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
                placeholder="Gamiting username"
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
                placeholder="Gamiting password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-glass btn-primary-glass" style={{ padding: '0.95rem', fontSize: '1.05rem', marginTop: '0.5rem' }}>
            Mag-log in sa Portal <ArrowRight size={18} />
          </button>
        </form>

        {/* 1-Click Quick Demo Preset Cards */}
        <div style={{ marginTop: '2.25rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'block', textAlign: 'center', marginBottom: '1rem' }}>
            ⚡ 1-Click Quick Demo Login Presets
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              onClick={() => quickLogin('driver', 'driver123')}
              className="btn-glass"
              style={{ padding: '0.65rem', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'center' }}
            >
              <Bike size={18} color="#38bdf8" />
              <strong>Driver</strong>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>driver / driver123</span>
            </button>

            <button
              onClick={() => quickLogin('todapres', 'toda123')}
              className="btn-glass"
              style={{ padding: '0.65rem', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'center' }}
            >
              <Award size={18} color="#c084fc" />
              <strong>TODA President</strong>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>todapres / toda123</span>
            </button>

            <button
              onClick={() => quickLogin('admin', 'admin123')}
              className="btn-glass"
              style={{ padding: '0.65rem', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'center' }}
            >
              <ShieldCheck size={18} color="#fb923c" />
              <strong>Admin</strong>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>admin / admin123</span>
            </button>

            <button
              onClick={() => quickLogin('operator', 'operator123')}
              className="btn-glass"
              style={{ padding: '0.65rem', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'center' }}
            >
              <UserCheck size={18} color="#34d399" />
              <strong>Operator</strong>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>operator / operator123</span>
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/" style={{ color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'none' }}>
            ← Bumalik sa Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}
