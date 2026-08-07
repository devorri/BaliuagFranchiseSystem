import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import * as storage from '../services/storageService';
import type { UserRole, User } from '../types';

export function RegisterPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    address: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'driver' as UserRole,
  });

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (form.password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const newUser: User = {
        id: `user-${Date.now()}`,
        username: form.username,
        password: form.password,
        role: form.role,
        firstName: form.firstName,
        lastName: form.lastName,
        middleName: form.middleName || undefined,
        email: form.email,
        phone: form.phone,
        address: form.address,
        createdAt: new Date().toISOString(),
      };

      storage.saveUser(newUser);
      showToast('Account created successfully! Please login.', 'success');
      navigate('/login');
      setLoading(false);
    }, 800);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="glass-container animate-fade-in" style={{ maxWidth: '650px', width: '100%', padding: '2.5rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/baliuag-logo.png" alt="Baliuag Seal" style={{ height: '64px', width: 'auto', marginBottom: '0.75rem' }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>Create New Account</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Baliwag Tricycle Franchise & MTOP System</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Register As *</label>
            <select
              className="glass-input glass-select"
              value={form.role}
              onChange={e => updateField('role', e.target.value)}
            >
              <option value="driver">Tricycle Driver</option>
              <option value="toda_president">TODA President</option>
              <option value="operator">Franchise Operator</option>
              <option value="admin">Municipal Admin</option>
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
              <input type="tel" className="glass-input" value={form.phone} onChange={e => updateField('phone', e.target.value)} required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Address *</label>
            <input type="text" className="glass-input" value={form.address} onChange={e => updateField('address', e.target.value)} required />
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
            <UserPlus size={18} /> Register Account
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/login" style={{ color: '#38bdf8', fontSize: '0.88rem', textDecoration: 'none' }}>
            May account na? Mag-sign in dito
          </Link>
        </div>

      </div>
    </div>
  );
}
