import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as storage from '../../services/storageService';
import type { Application } from '../../types';
import { FileUp, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SubmitRequirements() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    vehicleMake: 'Suzuki',
    vehicleModel: 'GD 110',
    plateNumber: '992-XYZ',
    motorNumber: 'ENG-001923',
    chassisNumber: 'CHS-554109',
    vehicleColor: 'Red',
    todaName: 'SMTODA (Sabang Terminal TODA)',
    routeArea: 'Sabang - SM City Baliwag',
    driverName: 'Pedro Penduko',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newApp: Application = {
      id: `APP-2026-${Math.floor(100 + Math.random() * 900)}`,
      applicantId: user.id,
      applicantName: `${user.firstName} ${user.lastName}`,
      applicantRole: 'operator',
      type: 'renewal',
      status: 'pending_inspection',
      driverName: formData.driverName,
      vehicleMake: formData.vehicleMake,
      vehicleModel: formData.vehicleModel,
      plateNumber: formData.plateNumber,
      motorNumber: formData.motorNumber,
      chassisNumber: formData.chassisNumber,
      vehicleColor: formData.vehicleColor,
      todaName: formData.todaName,
      routeArea: formData.routeArea,
      documents: [
        { id: 'doc-1', name: 'OR / CR', type: 'or_cr', fileName: 'orcr_renewal.pdf', uploadedAt: new Date().toISOString(), status: 'uploaded' },
      ],
      baseFee: 450,
      todaFee: 800,
      latePenalty: 0,
      totalFee: 1250,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.saveApplication(newApp);
    setSubmitted(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="glass-container" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="pill-badge pill-emerald">Operator Application</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Submit Requirements</span>
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Magsumite ng Requirements para sa Renewal o Bagong Aplikasyon
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '2rem' }}>
          I-fill up ang impormasyon ng tricycle at driver para sa pag-renew ng MTOP franchise.
        </p>

        {submitted ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            <CheckCircle size={56} color="#10b981" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>Naisumite na ang Aplikasyon!</h3>
            <p style={{ color: '#cbd5e1', marginTop: '0.5rem' }}>Bumabalik sa Dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Pangalan ng Assigned Driver</label>
                <input type="text" className="glass-input" value={formData.driverName} onChange={e => setFormData({ ...formData, driverName: e.target.value })} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Plate Number</label>
                <input type="text" className="glass-input" value={formData.plateNumber} onChange={e => setFormData({ ...formData, plateNumber: e.target.value })} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Engine Number</label>
                <input type="text" className="glass-input" value={formData.motorNumber} onChange={e => setFormData({ ...formData, motorNumber: e.target.value })} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Chassis Number</label>
                <input type="text" className="glass-input" value={formData.chassisNumber} onChange={e => setFormData({ ...formData, chassisNumber: e.target.value })} required />
              </div>
            </div>

            <button type="submit" className="btn-glass btn-emerald-glass" style={{ padding: '1rem', fontSize: '1.05rem' }}>
              <FileUp size={20} /> Submit Franchise Renewal Application
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
