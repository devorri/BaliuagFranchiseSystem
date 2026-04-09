import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bike, Eye, EyeOff, LogIn } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && user) {
    const path = user.role === 'admin' ? '/admin' : user.role === 'passenger' ? '/passenger' : '/dashboard';
    navigate(path, { replace: true });
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const user = login(username, password);
      if (user) {
        showToast(`Welcome back, ${user.firstName}!`, 'success');
        const path = user.role === 'admin' ? '/admin' : user.role === 'passenger' ? '/passenger' : '/dashboard';
        navigate(path);
      } else {
        showToast('Invalid username or password.', 'error');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="auth-page">
      <div className="auth-page__bg"></div>
      <div className="auth-card">
        <div className="auth-card__header">
          <Link to="/" className="auth-card__brand">
            <Bike size={32} />
          </Link>
          <h1 className="auth-card__title">Welcome Back</h1>
          <p className="auth-card__subtitle">Sign in to your account</p>
        </div>

        <form className="auth-card__form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              id="username"
              type="text"
              className="form-input"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="form-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="form-input-icon"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? (
              <span className="btn__spinner"></span>
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-card__footer">
          <p>Don't have an account? <Link to="/register">Register here</Link></p>
        </div>

        <div className="auth-card__demo">
          <p className="auth-card__demo-title">Demo Credentials</p>
          <div className="auth-card__demo-grid">
            <button type="button" className="auth-card__demo-btn" onClick={() => { setUsername('admin'); setPassword('admin123'); }}>
              <strong>Admin</strong>
              <span>admin</span>
            </button>
            <button type="button" className="auth-card__demo-btn" onClick={() => { setUsername('jcruz'); setPassword('password123'); }}>
              <strong>Operator</strong>
              <span>jcruz</span>
            </button>
            <button type="button" className="auth-card__demo-btn" onClick={() => { setUsername('mlopez'); setPassword('password123'); }}>
              <strong>Passenger</strong>
              <span>mlopez</span>
            </button>
          </div>
          <button 
            type="button" 
            className="btn btn--ghost btn--sm btn--full" 
            style={{ marginTop: 'var(--space-md)', opacity: 0.6 }}
            onClick={() => {
              sessionStorage.clear();
              window.location.reload();
            }}
          >
            Reset System Data (Clears All)
          </button>
        </div>
      </div>
    </div>
  );
}
