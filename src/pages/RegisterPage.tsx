import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bike, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import * as storage from '../services/storageService';

export function RegisterPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    role: 'operator' as 'operator' | 'passenger',
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

    if (storage.usernameExists(form.username)) {
      showToast('Username already taken.', 'error');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      storage.createUser({
        username: form.username,
        password: form.password,
        role: form.role,
        firstName: form.firstName,
        lastName: form.lastName,
        middleName: form.middleName || undefined,
        email: form.email,
        phone: form.phone,
        address: form.address,
      });
      showToast('Account created successfully! Please login.', 'success');
      navigate('/login');
      setLoading(false);
    }, 800);
  };

  return (
    <div className="auth-page">
      <div className="auth-page__bg"></div>
      <div className="auth-card auth-card--wide">
        <div className="auth-card__header">
          <Link to="/" className="auth-card__brand">
            <Bike size={32} />
          </Link>
          <h1 className="auth-card__title">Create Account</h1>
          <p className="auth-card__subtitle">Join the Baliuag City Tricycle System</p>
        </div>

        <form className="auth-card__form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Register As *</label>
            <div className="role-selector">
              <button 
                type="button" 
                className={`role-btn ${form.role === 'operator' ? 'role-btn--active' : ''}`}
                onClick={() => updateField('role', 'operator')}
              >
                Tricycle Operator / Driver
              </button>
              <button 
                type="button" 
                className={`role-btn ${form.role === 'passenger' ? 'role-btn--active' : ''}`}
                onClick={() => updateField('role', 'passenger')}
              >
                Passenger / Commuter
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">First Name *</label>
              <input id="firstName" type="text" className="form-input" placeholder="Juan" value={form.firstName} onChange={e => updateField('firstName', e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="middleName" className="form-label">Middle Name</label>
              <input id="middleName" type="text" className="form-input" placeholder="Dela" value={form.middleName} onChange={e => updateField('middleName', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="lastName" className="form-label">Last Name *</label>
              <input id="lastName" type="text" className="form-input" placeholder="Cruz" value={form.lastName} onChange={e => updateField('lastName', e.target.value)} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address *</label>
              <input id="email" type="email" className="form-input" placeholder="juan@email.com" value={form.email} onChange={e => updateField('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="phone" className="form-label">Phone Number *</label>
              <input id="phone" type="tel" className="form-input" placeholder="0917-123-4567" value={form.phone} onChange={e => updateField('phone', e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address" className="form-label">Complete Address *</label>
            <input id="address" type="text" className="form-input" placeholder="Brgy. Poblacion, Baliuag, Bulacan" value={form.address} onChange={e => updateField('address', e.target.value)} required />
          </div>

          <hr className="form-divider" />

          <div className="form-group">
            <label htmlFor="reg-username" className="form-label">Username *</label>
            <input id="reg-username" type="text" className="form-input" placeholder="Choose a username" value={form.username} onChange={e => updateField('username', e.target.value)} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-password" className="form-label">Password *</label>
              <div className="form-input-wrapper">
                <input id="reg-password" type={showPassword ? 'text' : 'password'} className="form-input" placeholder="Min. 6 characters" value={form.password} onChange={e => updateField('password', e.target.value)} required />
                <button type="button" className="form-input-icon" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password *</label>
              <input id="confirmPassword" type={showPassword ? 'text' : 'password'} className="form-input" placeholder="Repeat password" value={form.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} required />
            </div>
          </div>

          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? <span className="btn__spinner"></span> : <><UserPlus size={18} /> Create Account</>}
          </button>
        </form>

        <div className="auth-card__footer">
          <p>Already have an account? <Link to="/login">Sign in here</Link></p>
        </div>
      </div>
    </div>
  );
}
