import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as storage from '../../services/storageService';
import type { Application, Document, DocumentType } from '../../types';
import { FileUp, CheckCircle, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DriverRequirements() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    vehicleMake: 'Honda',
    vehicleModel: 'TMX 125',
    plateNumber: '123-XYZ',
    motorNumber: 'ENG-994821',
    chassisNumber: 'CHS-881204',
    vehicleColor: 'Red / Metallic Chrome',
    todaName: 'BASTODA (Baliuag Poblacion TODA)',
    routeArea: 'Poblacion - Public Market - Plaza Naning',
    licenseNumber: 'N02-18-998234',
  });

  const [uploadedFiles, setUploadedFiles] = useState<{ [key in DocumentType]?: string }>({
    or_cr: 'or_cr_scanned.pdf',
    barangay_clearance: 'brgy_clearance.pdf',
    drivers_license: 'driver_license.jpg',
    toda_cert: 'toda_membership.pdf',
    id_photo: 'id_photo.png',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleFileUpload = (type: DocumentType, fileName: string) => {
    setUploadedFiles(prev => ({ ...prev, [type]: fileName }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const docs: Document[] = Object.entries(uploadedFiles).map(([type, fileName], idx) => ({
      id: `doc-${idx + 10}`,
      name: type.replace('_', ' ').toUpperCase(),
      type: type as DocumentType,
      fileName: fileName || `${type}.pdf`,
      uploadedAt: new Date().toISOString(),
      status: 'uploaded',
    }));

    const newApp: Application = {
      id: `APP-2026-${Math.floor(100 + Math.random() * 900)}`,
      applicantId: user.id,
      applicantName: `${user.firstName} ${user.lastName}`,
      applicantRole: 'driver',
      type: 'new',
      status: 'pending_inspection',
      driverName: `${user.firstName} ${user.lastName}`,
      licenseNumber: formData.licenseNumber,
      vehicleMake: formData.vehicleMake,
      vehicleModel: formData.vehicleModel,
      plateNumber: formData.plateNumber,
      motorNumber: formData.motorNumber,
      chassisNumber: formData.chassisNumber,
      vehicleColor: formData.vehicleColor,
      todaName: formData.todaName,
      routeArea: formData.routeArea,
      documents: docs,
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
      navigate('/driver/inspection');
    }, 2000);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="glass-container" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="pill-badge pill-cyan">Step 1 of Workflow</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Driver Requirements</span>
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Submit Driver Requirements
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '2rem' }}>
          I-upload ang mga kailangang dokumento: OR/CR, Barangay Clearance, Lisensya, TODA Certification, at ID Photo.
        </p>

        {submitted ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            <CheckCircle size={56} color="#10b981" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>Matagumpay na Naitala!</h3>
            <p style={{ color: '#cbd5e1', marginTop: '0.5rem' }}>
              Naisumite na ang inyong requirements. Papunta na sa **Inspection & Stenciling** step...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* Driver & Vehicle Details */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', marginBottom: '1rem' }}>
                Impormasyon ng Makina at Lisensya
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Driver License Number
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    value={formData.licenseNumber}
                    onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Plate / Body Number
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    value={formData.plateNumber}
                    onChange={e => setFormData({ ...formData, plateNumber: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Engine / Motor Number
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    value={formData.motorNumber}
                    onChange={e => setFormData({ ...formData, motorNumber: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Chassis Number
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    value={formData.chassisNumber}
                    onChange={e => setFormData({ ...formData, chassisNumber: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Vehicle Make & Model
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    value={`${formData.vehicleMake} ${formData.vehicleModel}`}
                    onChange={e => setFormData({ ...formData, vehicleMake: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Assigned TODA Association
                  </label>
                  <select
                    className="glass-input glass-select"
                    value={formData.todaName}
                    onChange={e => setFormData({ ...formData, todaName: e.target.value })}
                  >
                    <option value="BASTODA (Baliuag Poblacion TODA)">BASTODA (Baliuag Poblacion TODA)</option>
                    <option value="SMTODA (Sabang Terminal TODA)">SMTODA (Sabang Terminal TODA)</option>
                    <option value="TARTODA (Tarcan Highway TODA)">TARTODA (Tarcan Highway TODA)</option>
                    <option value="PAGTODA (Pagala Commercial TODA)">PAGTODA (Pagala Commercial TODA)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Document Upload Grid */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', marginBottom: '1rem' }}>
                Requirements File Upload Checklist
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { key: 'or_cr', title: 'OR / CR (Vehicle Registration)', req: 'Scanned official receipt and certificate of registration' },
                  { key: 'barangay_clearance', title: 'Barangay Clearance', req: 'Proof of residency in Baliwag' },
                  { key: 'drivers_license', title: 'Driver License (Lisensya)', req: 'Valid Professional Driver License' },
                  { key: 'toda_cert', title: 'TODA Certification', req: 'Certification from TODA President' },
                  { key: 'id_photo', title: '2x2 ID Photo', req: 'Recent colored photo with white background' },
                ].map(doc => (
                  <div key={doc.key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <div>
                      <strong style={{ color: '#ffffff', display: 'block', fontSize: '0.95rem' }}>{doc.title}</strong>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{doc.req}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {uploadedFiles[doc.key as DocumentType] ? (
                        <span className="pill-badge pill-emerald"><CheckCircle size={14} /> Attached</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleFileUpload(doc.key as DocumentType, `${doc.key}_uploaded.pdf`)}
                          className="btn-glass"
                          style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                        >
                          <UploadCloud size={16} /> Choose File
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-glass btn-primary-glass" style={{ padding: '1rem', fontSize: '1.05rem' }}>
              <FileUp size={20} /> Proceed to Stenciling & Inspection
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
