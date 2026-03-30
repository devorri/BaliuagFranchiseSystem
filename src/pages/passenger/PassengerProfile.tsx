import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/layout/Header';
import { useToast } from '../../components/ui/Toast';
import { Save, User } from 'lucide-react';

export function PassengerProfile() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    middleName: user?.middleName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  if (!user) return null;

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(form);
    showToast('Profile updated successfully!', 'success');
  };

  return (
    <div className="page">
      <Header title="My Profile" subtitle="Manage your personal information" />

      <div className="page__content">
        <div className="page__grid page__grid--profile">
          <div className="card">
            <div className="card__body">
              <div className="profile-card">
                <div className="profile-card__avatar">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <h3 className="profile-card__name">{user.firstName} {user.middleName ? user.middleName + ' ' : ''}{user.lastName}</h3>
                <p className="profile-card__role">Passenger</p>
                <div className="profile-card__details">
                  <div className="profile-card__item">
                    <span className="profile-card__label">Username</span>
                    <span className="profile-card__value">{user.username}</span>
                  </div>
                  <div className="profile-card__item">
                    <span className="profile-card__label">Member Since</span>
                    <span className="profile-card__value">{new Date(user.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card__header">
              <h3 className="card__title"><User size={18} /> Edit Profile</h3>
            </div>
            <div className="card__body">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input className="form-input" value={form.firstName} onChange={e => updateField('firstName', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input className="form-input" value={form.lastName} onChange={e => updateField('lastName', e.target.value)} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" value={form.email} onChange={e => updateField('email', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={form.phone} onChange={e => updateField('phone', e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={form.address} onChange={e => updateField('address', e.target.value)} required />
                </div>
                <button type="submit" className="btn btn--primary"><Save size={16} /> Save Changes</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
