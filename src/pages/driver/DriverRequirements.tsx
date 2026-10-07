import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { getApplicationsAsync, uploadFileToBucketAsync, saveApplicationAsync } from '../../services/supabaseService';
import type { Application, Document, DocumentType } from '../../types';
import { franchiseFeeFor, type Residency } from '../../services/fees';
import { FileUp, CheckCircle, UploadCloud, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DriverRequirements() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignedApplication, setAssignedApplication] = useState<Application | null>(null);

  const [formData, setFormData] = useState({
    vehicleMake: '',
    vehicleModel: '',
    plateNumber: '',
    motorNumber: '',
    chassisNumber: '',
    vehicleColor: '',
    todaName: 'BASTODA (Baliuag Poblacion TODA)',
    routeArea: '',
    licenseNumber: '',
  });

  const [uploadedFiles, setUploadedFiles] = useState<Partial<Record<DocumentType, { name: string; url: string }>>>({});

  const [uploadingState, setUploadingState] = useState<{ [key in DocumentType]?: boolean }>({});
  const [uploadErrors, setUploadErrors] = useState<Partial<Record<DocumentType, string>>>({});
  const [submissionError, setSubmissionError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [residency, setResidency] = useState<Residency>('baliwag_resident');
  const requiredDocuments: { key: DocumentType; title: string; req: string }[] = [
    { key: 'or_cr', title: 'OR / CR (Vehicle Registration)', req: 'Scanned official receipt and certificate of registration' },
    { key: 'barangay_clearance', title: 'Barangay Clearance', req: 'Proof of residency in Baliwag' },
    { key: 'drivers_license', title: 'Driver License (Lisensya)', req: 'Valid Professional Driver License' },
    { key: 'toda_cert', title: 'TODA Certification', req: 'Certification from TODA President' },
    { key: 'id_photo', title: '2x2 ID Photo', req: 'Recent colored photo with white background' },
  ];

  useEffect(() => {
    if (!user) return;
    getApplicationsAsync().then(applications => {
      const assigned = applications.find(app =>
        app.applicantRole === 'operator'
        && app.driverId === user.id
        && app.status === 'pending_driver_requirements'
      );
      if (!assigned) return;
      setAssignedApplication(assigned);
      setFormData(current => ({
        ...current,
        vehicleMake: assigned.vehicleMake,
        vehicleModel: assigned.vehicleModel,
        plateNumber: assigned.plateNumber,
        motorNumber: assigned.motorNumber,
        chassisNumber: assigned.chassisNumber,
        vehicleColor: assigned.vehicleColor,
        todaName: assigned.todaName,
        routeArea: assigned.routeArea,
        licenseNumber: assigned.licenseNumber || '',
      }));
    });
  }, [user]);

  const handleFileUpload = async (type: DocumentType, file: File) => {
    setUploadingState(prev => ({ ...prev, [type]: true }));
    setUploadErrors(prev => ({ ...prev, [type]: undefined }));
    try {
      const result = await uploadFileToBucketAsync(file, 'driver_documents');
      if (result.url) {
        setUploadedFiles(prev => ({ ...prev, [type]: { name: file.name, url: result.url! } }));
      } else {
        setUploadErrors(prev => ({ ...prev, [type]: result.error || 'Hindi na-upload ang file. Pakisubukang muli.' }));
      }
    } catch {
      setUploadErrors(prev => ({ ...prev, [type]: 'Hindi na-upload ang file. Pakisubukang muli.' }));
    } finally {
      setUploadingState(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || requiredDocuments.some(doc =>
      !uploadedFiles[doc.key] && !assignedApplication?.documents.some(existing => existing.type === doc.key)
    )) return;

    const newDocuments: Document[] = Object.entries(uploadedFiles).map(([type, file], idx) => ({
      id: `doc-${idx + 10}`,
      name: type.replace('_', ' ').toUpperCase(),
      type: type as DocumentType,
      fileName: file.name,
      fileUrl: file.url,
      uploadedAt: new Date().toISOString(),
      status: 'uploaded',
    }));
    const docs = [
      ...(assignedApplication?.documents || []).filter(existing => !newDocuments.some(doc => doc.type === existing.type)),
      ...newDocuments,
    ];
    const now = new Date().toISOString();

    const newApp: Application = assignedApplication ? {
      ...assignedApplication,
      driverId: user.id,
      driverName: `${user.firstName} ${user.lastName}`,
      licenseNumber: formData.licenseNumber,
      documents: docs,
      status: 'pending_toda_approval',
      updatedAt: now,
    } : {
      id: crypto.randomUUID(),
      applicantId: user.id,
      applicantName: `${user.firstName} ${user.lastName}`,
      applicantRole: 'driver',
      driverId: user.id,
      type: 'new',
      residency,
      status: 'pending_toda_approval',
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
      baseFee: franchiseFeeFor(residency),
      todaFee: 0,
      latePenalty: 0,
      totalFee: franchiseFeeFor(residency),
      submittedAt: now,
      updatedAt: now,
    };

    setSubmissionError('');
    try {
      await saveApplicationAsync(newApp, true);
      setSubmitted(true);
      setTimeout(() => {
        navigate('/driver/toda-status');
      }, 2000);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Hindi na-save ang application. Pakisubukang muli.');
    }
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
          {assignedApplication
            ? `Upload your requirements for ${assignedApplication.plateNumber}; the tricycle is registered by ${assignedApplication.applicantName}.`
            : 'Upload required documents: OR/CR, Barangay Clearance, Driver\'s License, TODA Certification, and ID Photo.'}
        </p>
        {!isSupabaseConfigured() && (
          <p role="status" style={{ color: '#fbbf24', marginBottom: '1rem' }}>
            Local preview mode: files are not shared with other accounts. Configure Supabase to send files to reviewers.
          </p>
        )}

        {submitted ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            <CheckCircle size={56} color="#10b981" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>Successfully Submitted!</h3>
            <p style={{ color: '#cbd5e1', marginTop: '0.5rem' }}>
              Your application and requirements were submitted to your TODA President for line eligibility review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {submissionError && <p role="alert" style={{ color: '#f87171' }}>{submissionError}</p>}
            
            {/* Driver & Vehicle Details */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', marginBottom: '1rem' }}>
                Engine & License Information
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Applicant residency
                  </label>
                  <select className="glass-input glass-select" value={residency} onChange={e => setResidency(e.target.value as Residency)}>
                    <option value="baliwag_resident">Baliwag resident — ₱450</option>
                    <option value="non_resident">Non-resident of Baliwag — ₱550</option>
                  </select>
                </div>
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
                {requiredDocuments.map(doc => (
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
                      {uploadingState[doc.key as DocumentType] ? (
                        <span className="pill-badge pill-cyan"><Loader2 size={14} className="animate-spin" /> Uploading to Bucket...</span>
                      ) : uploadedFiles[doc.key as DocumentType] || assignedApplication?.documents.some(existing => existing.type === doc.key) ? (
                        <span className="pill-badge pill-emerald"><CheckCircle size={14} /> {uploadedFiles[doc.key]?.name || assignedApplication?.documents.find(existing => existing.type === doc.key)?.fileName}</span>
                      ) : null}
                      <label
                        className="btn-glass cursor-pointer"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <UploadCloud size={16} /> Choose File
                        <input
                          type="file"
                          style={{ display: 'none' }}
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(doc.key as DocumentType, e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                    {uploadErrors[doc.key] && <span role="alert" style={{ color: '#f87171', fontSize: '0.8rem' }}>{uploadErrors[doc.key]}</span>}
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={requiredDocuments.some(doc => !uploadedFiles[doc.key] && !assignedApplication?.documents.some(existing => existing.type === doc.key)) || Object.values(uploadingState).some(Boolean)} className="btn-glass btn-primary-glass" style={{ padding: '1rem', fontSize: '1.05rem' }}>
              <FileUp size={20} /> Submit Requirements for TODA Review
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
