import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import * as supabaseService from '../services/supabaseService';
import type { UserRole } from '../types';

export function RegisterPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    address: '',
    todaName: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'driver' as UserRole,
  });

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.role !== 'driver' && form.role !== 'operator') {
      showToast('Registration is only permitted for Tricycle Drivers and Franchise Operators.', 'error');
      return;
    }

    if (form.password !== form.confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (form.password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await supabaseService.registerUserAsync({
        username: form.username,
        password: form.password,
        role: form.role,
        firstName: form.firstName,
        lastName: form.lastName,
        middleName: form.middleName || undefined,
        email: form.email,
        phone: form.phone,
        address: form.address,
        todaName: form.todaName || undefined,
      });

      if (res.user) {
        setSubmitted(true);
        showToast('Account successfully created! Awaiting Security Admin approval before login.', 'success');
      } else {
        showToast(res.error || 'Failed to process registration.', 'error');
      }
    } catch {
      showToast('An error occurred during registration.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div className="glass-container animate-fade-in" style={{ maxWidth: '540px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <CheckCircle2 size={36} color="#4ade80" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
            Registration Submitted Successfully!
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Your account request for <strong style={{ color: '#38bdf8' }}>{form.role === 'driver' ? 'Tricycle Driver' : 'Franchise Operator'}</strong> is under verification by the Local Government <strong>Security Admin</strong>.
          </p>
          <div style={{ padding: '1rem', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '10px', marginBottom: '1.75rem', textAlign: 'left', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <ShieldAlert size={20} color="#facc15" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ fontSize: '0.85rem', color: '#fef08a', lineHeight: '1.5' }}>
              You will be able to log in using your username and password once your account is approved by the Security Administrator.
            </span>
          </div>
          <button 
            type="button" 
            onClick={() => navigate('/login')} 
            className="btn-glass btn-primary-glass" 
            style={{ width: '100%', padding: '0.85rem' }}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="glass-container animate-fade-in" style={{ maxWidth: '650px', width: '100%', padding: '2.5rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/baliuag-logo.png" alt="Baliwag Seal" style={{ height: '64px', width: 'auto', marginBottom: '0.75rem' }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>Create New Account</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Baliuag Tricycle Franchise & MTOP System</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
              Register As * <span style={{ color: '#64748b', fontSize: '0.75rem' }}>(Driver or Operator only)</span>
            </label>
            <select
              className="glass-input glass-select"
              value={form.role}
              onChange={e => updateField('role', e.target.value)}
            >
              <option value="driver">Tricycle Driver</option>
              <option value="operator">Franchise Operator</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>First Name *</label>
              <input type="text" className="glass-input" value={form.firstName} onChange={e => updateField('firstName', e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Last Name *</label>
              <input type="text" className="glass-input" value={form.lastName} onChange={e => updateField('lastName', e.target.value)} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Email Address *</label>
              <input type="email" className="glass-input" value={form.email} onChange={e => updateField('email', e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Phone Number *</label>
              <input type="tel" className="glass-input" placeholder="0917-000-0000" value={form.phone} onChange={e => updateField('phone', e.target.value)} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Address *</label>
              <input type="text" className="glass-input" placeholder="Brgy. Poblacion, Baliwag" value={form.address} onChange={e => updateField('address', e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>TODA Affiliation (Optional)</label>
              <input type="text" className="glass-input" placeholder="Example: BASTODA" value={form.todaName} onChange={e => updateField('todaName', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Username *</label>
              <input type="text" className="glass-input" value={form.username} onChange={e => updateField('username', e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Password *</label>
              <input type={showPassword ? 'text' : 'password'} className="glass-input" value={form.password} onChange={e => updateField('password', e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Confirm Password *</label>
              <input type={showPassword ? 'text' : 'password'} className="glass-input" value={form.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} required />
            </div>
          </div>

          <button type="submit" className="btn-glass btn-primary-glass" style={{ padding: '0.95rem', fontSize: '1rem', marginTop: '0.5rem' }} disabled={loading}>
            <UserPlus size={18} /> {loading ? 'Registering...' : 'Register Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/login" style={{ color: '#38bdf8', fontSize: '0.88rem', textDecoration: 'none' }}>
            Already have an account? Sign in here
          </Link>
        </div>

      </div>
    </div>
  );
}
