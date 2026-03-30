import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/layout/Header';
import { useToast } from '../../components/ui/Toast';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StarRating } from '../../components/ui/StarRating';
import { Save, User, QrCode, Download, Shield, Bike } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import * as storage from '../../services/storageService';

export function ProfilePage() {
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

  const driver = storage.getDriverByUserId(user.id);
  const franchises = storage.getFranchisesByUser(user.id);
  const activeFranchise = franchises.find(f => f.status === 'active');

  // QR code links to the public driver profile
  const profileUrl = `${window.location.origin}/driver/${driver?.id || ''}`;

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(form);
    showToast('Profile updated successfully!', 'success');
  };

  const handlePrintQR = () => {
    if (!driver) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Driver QR - ${driver.firstName} ${driver.lastName}</title>
        <style>
          body { font-family: 'Arial', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
          .qr-card { background: white; padding: 40px; border-radius: 16px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 360px; }
          .qr-card h1 { font-size: 14px; color: #1E3A5F; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px; }
          .qr-card h2 { font-size: 11px; color: #999; margin: 0 0 20px; }
          .qr-img { margin: 0 auto 16px; }
          .driver-name { font-size: 20px; font-weight: 700; color: #1E3A5F; margin: 0 0 4px; }
          .plate { font-size: 24px; font-weight: 800; color: #D4A843; margin: 8px 0; letter-spacing: 2px; }
          .toda { font-size: 13px; color: #666; margin: 4px 0; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-top: 12px; }
          .status--active { background: #e8f5e9; color: #27ae60; }
          .status--inactive { background: #fce4ec; color: #e74c3c; }
          .footer { font-size: 10px; color: #bbb; margin-top: 20px; }
          .scan-text { font-size: 12px; color: #888; margin-top: 12px; }
          @media print { body { background: white; } .qr-card { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="qr-card">
          <h1>Baliuag City LGU</h1>
          <h2>Tricycle Registration System</h2>
          <div class="qr-img">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}" width="200" height="200" />
          </div>
          <p class="driver-name">${driver.firstName} ${driver.middleName ? driver.middleName + ' ' : ''}${driver.lastName}</p>
          <p class="plate">${driver.plateNumber}</p>
          <p class="toda">${driver.todaName}</p>
          <p class="toda">${driver.routeArea}</p>
          <span class="status status--${driver.status === 'active' ? 'active' : 'inactive'}">
            ${driver.status === 'active' ? '✓ VERIFIED DRIVER' : '✗ NOT VERIFIED'}
          </span>
          <p class="scan-text">Scan QR code to verify this driver</p>
          <p class="footer">© ${new Date().getFullYear()} Baliuag City TODA Federation</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="page">
      <Header title="My Profile" subtitle="Manage your personal information and driver QR code" />

      <div className="page__content">
        {/* Driver QR Code Section */}
        {driver && (
          <div className="card qr-profile-card">
            <div className="card__header">
              <h3 className="card__title"><QrCode size={18} /> My Driver QR Code</h3>
              <button className="btn btn--outline btn--sm" onClick={handlePrintQR}>
                <Download size={14} /> Print / Save
              </button>
            </div>
            <div className="card__body">
              <div className="qr-profile">
                <div className="qr-profile__qr-section">
                  <div className="qr-profile__qr-wrapper">
                    <QRCodeSVG
                      value={profileUrl}
                      size={180}
                      bgColor="#ffffff"
                      fgColor="#1E3A5F"
                      level="H"
                      imageSettings={{
                        src: '',
                        height: 0,
                        width: 0,
                        excavate: false,
                      }}
                    />
                  </div>
                  <p className="qr-profile__scan-text">Passengers scan this to verify you</p>
                </div>

                <div className="qr-profile__info-section">
                  <div className="qr-profile__driver-header">
                    <div className="qr-profile__avatar">
                      {driver.firstName[0]}{driver.lastName[0]}
                    </div>
                    <div>
                      <h3>{driver.firstName} {driver.middleName ? driver.middleName + ' ' : ''}{driver.lastName}</h3>
                      <StatusBadge status={driver.status} />
                    </div>
                  </div>

                  <div className="qr-profile__details">
                    <div className="qr-profile__detail-row">
                      <Bike size={14} />
                      <span className="qr-profile__detail-label">Plate Number</span>
                      <span className="qr-profile__plate">{driver.plateNumber}</span>
                    </div>
                    <div className="qr-profile__detail-row">
                      <Shield size={14} />
                      <span className="qr-profile__detail-label">License</span>
                      <span>{driver.licenseNumber}</span>
                    </div>
                    <div className="qr-profile__detail-row">
                      <span className="qr-profile__detail-label" style={{ marginLeft: '22px' }}>TODA</span>
                      <span>{driver.todaName}</span>
                    </div>
                    <div className="qr-profile__detail-row">
                      <span className="qr-profile__detail-label" style={{ marginLeft: '22px' }}>Route</span>
                      <span>{driver.routeArea}</span>
                    </div>
                    {activeFranchise && (
                      <div className="qr-profile__detail-row">
                        <span className="qr-profile__detail-label" style={{ marginLeft: '22px' }}>Valid Until</span>
                        <span>{new Date(activeFranchise.expiresAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="qr-profile__detail-row">
                      <span className="qr-profile__detail-label" style={{ marginLeft: '22px' }}>Rating</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <StarRating rating={Math.round(driver.averageRating)} size={14} />
                        {driver.averageRating} / 5
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!driver && (
          <div className="alert alert--info" style={{ marginBottom: 'var(--space-lg)' }}>
            <QrCode size={18} />
            <div>
              <strong>No Driver QR Code Yet</strong> — Your QR code will be generated once your franchise application is approved by the LGU.
            </div>
          </div>
        )}

        <div className="page__grid page__grid--profile">
          {/* Profile Card */}
          <div className="card">
            <div className="card__body">
              <div className="profile-card">
                <div className="profile-card__avatar">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <h3 className="profile-card__name">{user.firstName} {user.middleName ? user.middleName + ' ' : ''}{user.lastName}</h3>
                <p className="profile-card__role">Tricycle Operator / Driver</p>
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

          {/* Edit Form */}
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
                    <label className="form-label">Middle Name</label>
                    <input className="form-input" value={form.middleName} onChange={e => updateField('middleName', e.target.value)} />
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
                <button type="submit" className="btn btn--primary">
                  <Save size={16} /> Save Changes
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
