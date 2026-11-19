import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as supabaseService from '../services/supabaseService';
import type { User as SystemUser, SMSNotification } from '../types';
import { KeyRound, User, ArrowRight, AlertCircle, Eye, EyeOff, Search, CheckCircle2, Clock, XCircle, Smartphone } from 'lucide-react';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Account Approval Status Checker
  const [showStatusChecker, setShowStatusChecker] = useState(false);
  const [statusQuery, setStatusQuery] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [checkedUser, setCheckedUser] = useState<SystemUser | null | 'not_found'>(null);
  const [checkedSms, setCheckedSms] = useState<SMSNotification[]>([]);

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

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = statusQuery.trim().toLowerCase();
    if (!q) return;
    setStatusLoading(true);
    try {
      const allUsers = await supabaseService.getUsersAsync();
      const found = allUsers.find(
        u =>
          u.username.toLowerCase() === q ||
          (u.phone && u.phone.replace(/\D/g, '') === q.replace(/\D/g, '') && q.replace(/\D/g, '').length >= 7) ||
          (u.email && u.email.toLowerCase() === q)
      );
      if (found) {
        setCheckedUser(found);
        const sms = await supabaseService.getSMSNotificationsAsync(found.id);
        setCheckedSms(sms);
      } else {
        setCheckedUser('not_found');
        setCheckedSms([]);
      }
    } catch {
      setCheckedUser('not_found');
    } finally {
      setStatusLoading(false);
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
      case 'franchise_officer':
        navigate('/admin/applications');
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
        maxWidth: '540px',
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
                type={showPassword ? 'text' : 'password'}
                className="glass-input"
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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

        {/* Check Registration Approval / Rejection Status */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            type="button"
            onClick={() => setShowStatusChecker(!showStatusChecker)}
            className="btn-glass"
            style={{ width: '100%', padding: '0.6rem', fontSize: '0.82rem', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
          >
            <Search size={15} /> {showStatusChecker ? 'Hide Registration Status Checker' : 'Check Account Registration Approval / Rejection Status'}
          </button>

          {showStatusChecker && (
            <div className="glass-panel animate-fade-in" style={{ marginTop: '0.85rem', padding: '1rem' }}>
              <form onSubmit={handleCheckStatus} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  className="glass-input"
                  style={{ fontSize: '0.82rem', padding: '0.5rem 0.75rem' }}
                  placeholder="Enter username or phone (e.g. red or 09683348853)"
                  value={statusQuery}
                  onChange={e => setStatusQuery(e.target.value)}
                />
                <button type="submit" disabled={statusLoading} className="btn-glass btn-primary-glass" style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem' }}>
                  {statusLoading ? '...' : 'Check'}
                </button>
              </form>

              {checkedUser === 'not_found' && (
                <div style={{ fontSize: '0.8rem', color: '#fca5a5', textAlign: 'center', padding: '0.4rem' }}>
                  No account found matching "{statusQuery}".
                </div>
              )}

              {checkedUser && checkedUser !== 'not_found' && (
                <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#ffffff' }}>{checkedUser.firstName} {checkedUser.lastName} (@{checkedUser.username})</strong>
                    <span className={`pill-badge ${checkedUser.accountStatus === 'approved' ? 'pill-emerald' : checkedUser.accountStatus === 'rejected' ? 'pill-rose' : 'pill-orange'}`} style={{ fontSize: '0.72rem' }}>
                      {checkedUser.accountStatus === 'approved' && <><CheckCircle2 size={12} /> APPROVED</>}
                      {checkedUser.accountStatus === 'rejected' && <><XCircle size={12} /> REJECTED</>}
                      {checkedUser.accountStatus === 'pending' && <><Clock size={12} /> PENDING REVIEW</>}
                    </span>
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
                    TODA: <strong>{checkedUser.todaName || '—'}</strong> • Phone: <strong>{checkedUser.phone || '—'}</strong>
                  </div>
                  {checkedSms.length > 0 && (
                    <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '0.6rem', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
                      <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                        <Smartphone size={12} /> Latest SMS Notification Dispatched:
                      </div>
                      <div style={{ color: '#e2e8f0', fontSize: '0.76rem' }}>{checkedSms[0].message}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
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
