import { useState } from 'react';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { getUsersAsync, saveApplicationAsync, uploadFileToBucketAsync } from '../../services/supabaseService';
import type { Application, User } from '../../types';
import { franchiseFeeFor, type Residency } from '../../services/fees';
import { FileUp, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SubmitRequirements() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    vehicleMake: '',
    vehicleModel: '',
    plateNumber: '',
    motorNumber: '',
    chassisNumber: '',
    vehicleColor: '',
    todaName: 'SMTODA (Sabang Terminal TODA)',
    routeArea: '',
    driverName: '',
  });

  const [drivers, setDrivers] = useState<User[]>([]);
  const [driverId, setDriverId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState<{ name: string; url: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  const [residency, setResidency] = useState<Residency>('baliwag_resident');

  useEffect(() => {
    getUsersAsync().then(users => setDrivers(users.filter(driver => driver.role === 'driver' && driver.accountStatus === 'approved')));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !uploadedDocument || uploading) return;

    // Keep the selected id authoritative.  Do not trust the copied name from
    // the form because it can become stale after an account is changed.
    const selectedDriver = drivers.find(driver => driver.id === driverId);
    if (!selectedDriver || selectedDriver.role !== 'driver' || selectedDriver.accountStatus !== 'approved') {
      setSubmissionError('Pumili ng valid at approved na Driver account bago magsumite ng application.');
      return;
    }

    const newApp: Application = {
      id: crypto.randomUUID(),
      applicantId: user.id,
      applicantName: `${user.firstName} ${user.lastName}`,
      applicantRole: 'operator',
      driverId,
      type: 'new',
      residency,
      status: 'pending_driver_requirements',
      driverName: `${selectedDriver.firstName} ${selectedDriver.lastName}`,
      vehicleMake: formData.vehicleMake,
      vehicleModel: formData.vehicleModel,
      plateNumber: formData.plateNumber,
      motorNumber: formData.motorNumber,
      chassisNumber: formData.chassisNumber,
      vehicleColor: formData.vehicleColor,
      todaName: formData.todaName,
      routeArea: formData.routeArea,
      documents: [{ id: 'doc-1', name: 'OR / CR', type: 'or_cr', fileName: uploadedDocument.name, fileUrl: uploadedDocument.url, uploadedAt: new Date().toISOString(), status: 'uploaded' }],
      baseFee: franchiseFeeFor(residency),
      todaFee: 0,
      latePenalty: 0,
      totalFee: franchiseFeeFor(residency),
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSubmissionError('');
    try {
      await saveApplicationAsync(newApp, true);
      setSubmitted(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Hindi na-save ang application. Pakisubukang muli.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="glass-container" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="pill-badge pill-emerald">Operator Application</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Submit Requirements</span>
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Submit Requirements for Renewal or New Application
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '2rem' }}>
          Fill in the tricycle and driver details to renew or apply for an MTOP franchise.
        </p>
        {!isSupabaseConfigured() && (
          <p role="status" style={{ color: '#fbbf24', marginBottom: '1rem' }}>
            Local preview mode: files are not shared with other accounts. Configure Supabase to send files to reviewers.
          </p>
        )}

        {submitted ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            <CheckCircle size={56} color="#10b981" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>Application Submitted!</h3>
            <p style={{ color: '#cbd5e1', marginTop: '0.5rem' }}>Redirecting to Dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {submissionError && <p role="alert" style={{ color: '#f87171' }}>{submissionError}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Applicant residency</label>
                <select className="glass-input glass-select" value={residency} onChange={e => setResidency(e.target.value as Residency)}>
                  <option value="baliwag_resident">Baliwag resident — ₱450</option>
                  <option value="non_resident">Non-resident of Baliwag — ₱550</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Assigned Driver</label>
                <select
                  className="glass-input glass-select"
                  value={driverId}
                  onChange={e => {
                    const selectedDriver = drivers.find(driver => driver.id === e.target.value);
                    setDriverId(e.target.value);
                    setFormData({ ...formData, driverName: selectedDriver ? `${selectedDriver.firstName} ${selectedDriver.lastName}` : '' });
                  }}
                  required
                >
                  <option value="">Select an approved driver</option>
                  {drivers.map(driver => <option key={driver.id} value={driver.id}>{driver.firstName} {driver.lastName}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Vehicle Make</label>
                <input type="text" className="glass-input" value={formData.vehicleMake} onChange={e => setFormData({ ...formData, vehicleMake: e.target.value })} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Vehicle Model</label>
                <input type="text" className="glass-input" value={formData.vehicleModel} onChange={e => setFormData({ ...formData, vehicleModel: e.target.value })} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Vehicle Color</label>
                <input type="text" className="glass-input" value={formData.vehicleColor} onChange={e => setFormData({ ...formData, vehicleColor: e.target.value })} required />
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
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Assigned TODA</label>
                <select className="glass-input glass-select" value={formData.todaName} onChange={e => setFormData({ ...formData, todaName: e.target.value })}>
                  <option value="BASTODA (Baliuag Poblacion TODA)">BASTODA (Baliuag Poblacion TODA)</option>
                  <option value="SMTODA (Sabang Terminal TODA)">SMTODA (Sabang Terminal TODA)</option>
                  <option value="TARTODA (Tarcan Highway TODA)">TARTODA (Tarcan Highway TODA)</option>
                  <option value="PAGTODA (Pagala Commercial TODA)">PAGTODA (Pagala Commercial TODA)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Route Area</label>
                <input type="text" className="glass-input" value={formData.routeArea} onChange={e => setFormData({ ...formData, routeArea: e.target.value })} required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>OR / CR document</label>
              <input
                type="file"
                accept="image/*,.pdf"
                className="glass-input"
                required
                disabled={uploading}
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  setUploadError('');
                  try {
                    const result = await uploadFileToBucketAsync(file, 'operator_documents');
                    if (result.url) {
                      setUploadedDocument({ name: file.name, url: result.url });
                    } else {
                      setUploadError(result.error || 'Hindi na-upload ang file. Pakisubukang muli.');
                    }
                  } catch {
                    setUploadError('Hindi na-upload ang file. Pakisubukang muli.');
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              {uploading && <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Uploading document...</span>}
              {uploadedDocument && <span style={{ color: '#34d399', fontSize: '0.8rem' }}>{uploadedDocument.name} attached</span>}
              {uploadError && <span role="alert" style={{ color: '#f87171', fontSize: '0.8rem' }}>{uploadError}</span>}
            </div>

            <button type="submit" disabled={!uploadedDocument || uploading} className="btn-glass btn-emerald-glass" style={{ padding: '1rem', fontSize: '1.05rem' }}>
              <FileUp size={20} /> Submit Franchise Renewal Application
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
