import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { saveApplicationAsync, uploadFileToBucketAsync, recordAuditLogAsync } from '../../services/supabaseService';
import type { Application, Document, DocumentType } from '../../types';
import { getRequiredDocuments, TODA_ROUTES, feeForAddress } from '../../services/applicationRules';
import { analyzeDocumentWithOcr } from '../../services/ocrService';
import { 
  FileUp, CheckCircle, Loader2, Sparkles, AlertCircle, 
  FileText, ShieldCheck, Info, CheckCircle2 
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function SubmitRequirements() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationType = (searchParams.get('type') === 'renewal' ? 'renewal' : 'new') as 'new' | 'renewal';

  const requiredDocuments = useMemo(() => getRequiredDocuments(applicationType), [applicationType]);

  const [form, setForm] = useState({ 
    driverName: '', 
    licenseNumber: '', 
    vehicleMake: '', 
    vehicleModel: '', 
    plateNumber: '', 
    motorNumber: '', 
    chassisNumber: '', 
    vehicleColor: '', 
    todaName: 'BASTODA (Baliuag Poblacion TODA)' 
  });

  const [files, setFiles] = useState<Partial<Record<DocumentType, { name: string; url: string }>>>({});
  const [uploading, setUploading] = useState<Partial<Record<DocumentType, boolean>>>({});
  const [scanning, setScanning] = useState<Partial<Record<DocumentType, boolean>>>({});
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [ocrSuccessNote, setOcrSuccessNote] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const addressFee = useMemo(() => feeForAddress(user?.address), [user?.address]);
  const routeArea = TODA_ROUTES[form.todaName] || 'Standard Baliwag Municipal Route';
  
  const ready = requiredDocuments.every(doc => files[doc.key]) && 
    !Object.values(uploading).some(Boolean) && 
    !Object.values(scanning).some(Boolean);

  const handleFileUpload = async (type: DocumentType, file?: File) => {
    if (!file) return;
    setError('');
    setOcrSuccessNote(null);

    // 1. Start OCR authenticity scan & extraction
    setScanning(prev => ({ ...prev, [type]: true }));

    try {
      // Analyze with OCR if it's an image file
      if (file.type.startsWith('image/')) {
        const ocrResult = await analyzeDocumentWithOcr(file, type);

        if (!ocrResult.isValid) {
          setError(ocrResult.validationMessage || 'The uploaded file does not conform to the required document type.');
          setScanning(prev => ({ ...prev, [type]: false }));
          return;
        }

        // Auto-fill fields if extracted
        if (ocrResult.fields && Object.keys(ocrResult.fields).length > 0) {
          const detected = ocrResult.fields;
          const newlyFilled = new Set(autoFilledFields);
          const filledList: string[] = [];

          setForm(prev => {
            const updated = { ...prev };
            if (detected.plateNumber) {
              updated.plateNumber = detected.plateNumber;
              newlyFilled.add('plateNumber');
              filledList.push(`Plate: ${detected.plateNumber}`);
            }
            if (detected.motorNumber) {
              updated.motorNumber = detected.motorNumber;
              newlyFilled.add('motorNumber');
              filledList.push(`Engine: ${detected.motorNumber}`);
            }
            if (detected.chassisNumber) {
              updated.chassisNumber = detected.chassisNumber;
              newlyFilled.add('chassisNumber');
              filledList.push(`Chassis: ${detected.chassisNumber}`);
            }
            if (detected.vehicleMake && !prev.vehicleMake) {
              updated.vehicleMake = detected.vehicleMake;
              newlyFilled.add('vehicleMake');
              filledList.push(`Make: ${detected.vehicleMake}`);
            }
            if (detected.driverName && !prev.driverName) {
              updated.driverName = detected.driverName;
              newlyFilled.add('driverName');
              filledList.push(`Driver: ${detected.driverName}`);
            }
            if (detected.licenseNumber) {
              updated.licenseNumber = detected.licenseNumber;
              newlyFilled.add('licenseNumber');
              filledList.push(`License: ${detected.licenseNumber}`);
            }
            return updated;
          });

          setAutoFilledFields(newlyFilled);
          if (filledList.length > 0) {
            setOcrSuccessNote(`Smart OCR detected and auto-filled: ${filledList.join(', ')}. All fields remain completely editable.`);
          }
        }
      }
    } catch (ocrErr) {
      console.warn('OCR processing notice:', ocrErr);
    } finally {
      setScanning(prev => ({ ...prev, [type]: false }));
    }

    // 2. Upload file to cloud / local storage
    setUploading(prev => ({ ...prev, [type]: true }));
    try {
      const result = await uploadFileToBucketAsync(file, 'operator_documents');
      if (!result.url) throw new Error(result.error || 'Failed to upload document file.');
      setFiles(prev => ({ ...prev, [type]: { name: file.name, url: result.url! } }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload document file.');
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !ready) return;

    const now = new Date().toISOString();
    const documents: Document[] = requiredDocuments.map(({ key, title }) => ({
      id: crypto.randomUUID(),
      name: title,
      type: key,
      fileName: files[key]!.name,
      fileUrl: files[key]!.url,
      uploadedAt: now,
      status: 'uploaded',
    }));

    const app: Application = {
      id: crypto.randomUUID(),
      applicantId: user.id,
      applicantName: `${user.firstName} ${user.lastName}`,
      applicantAddress: user.address,
      applicantRole: 'operator',
      type: applicationType,
      residency: addressFee.residency,
      status: 'pending_toda_approval',
      driverName: form.driverName,
      licenseNumber: form.licenseNumber,
      vehicleMake: form.vehicleMake,
      vehicleModel: form.vehicleModel,
      plateNumber: form.plateNumber,
      motorNumber: form.motorNumber,
      chassisNumber: form.chassisNumber,
      vehicleColor: form.vehicleColor,
      todaName: form.todaName,
      routeArea,
      documents,
      baseFee: addressFee.amount,
      todaFee: 0,
      latePenalty: 0,
      totalFee: addressFee.amount,
      submittedAt: now,
      updatedAt: now,
    };

    setError('');
    try {
      await saveApplicationAsync(app, false);
      void recordAuditLogAsync({
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: 'operator',
        action: 'APPLICATION_SUBMITTED',
        details: `Operator submitted ${applicationType} franchise application (Plate: ${app.plateNumber}, TODA: ${app.todaName})`,
        targetId: app.id,
      });
      setSubmitted(true);
      setTimeout(() => navigate('/dashboard'), 1800);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save application.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="glass-container" style={{ padding: '2.5rem' }}>
        {/* Header Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <span className="pill-badge pill-emerald">
            {applicationType === 'renewal' ? 'Franchise Renewal Application' : 'New Franchise Application'}
          </span>
          <span className="pill-badge pill-blue">City of Baliwag MTOP Office</span>
        </div>

        <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.25rem 0 0.5rem', color: '#f8fafc' }}>
          Submit Franchise Application & Requirements
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          {applicationType === 'renewal'
            ? 'Submit the renewal packet for your existing motorized tricycle franchise. Note: Barangay Clearance is waived for franchise renewals.'
            : 'Operators submit all vehicle specifications and driver requirements. Your application will be endorsed by the TODA President before Municipal Licensing review.'}
        </p>

        {!isSupabaseConfigured() && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', color: '#fbbf24', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={16} />
            <span>Local Preview Mode: Uploaded files will be stored locally until Supabase Storage is configured.</span>
          </div>
        )}

        {submitted ? (
          <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              <CheckCircle size={40} color="#4ade80" />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
              Application Successfully Submitted!
            </h3>
            <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>
              Your application has been routed to the TODA President for initial line endorsement. Redirecting to your dashboard...
            </p>
            <Loader2 size={24} className="spin-icon" style={{ color: '#38bdf8', margin: '0 auto' }} />
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {error && (
              <div role="alert" style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '8px', color: '#f87171', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Upload Rejected / Error</strong>
                  <span style={{ fontSize: '0.9rem' }}>{error}</span>
                </div>
              </div>
            )}

            {ocrSuccessNote && (
              <div style={{ padding: '0.9rem 1.1rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '8px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Sparkles size={20} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{ocrSuccessNote}</span>
              </div>
            )}

            {/* Residency & Fee Banner */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #38bdf8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>Residency Classification & Franchise Fee</strong>
                  <p style={{ color: '#94a3b8', margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                    Operator Address: <strong style={{ color: '#e2e8f0' }}>{user?.address || 'Baliwag, Bulacan'}</strong> ({addressFee.residency === 'baliwag_resident' ? 'Baliwag Resident' : 'Non-Resident'})
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prescribed Fee</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>
                    ₱{addressFee.amount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle & Driver Details Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} color="#38bdf8" /> Vehicle & Driver Information
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  All fields remain 100% editable even when auto-filled by OCR
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <label style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Driver Full Name *</span>
                    {autoFilledFields.has('driverName') && (
                      <span style={{ fontSize: '0.7rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Sparkles size={11} /> Auto-filled
                      </span>
                    )}
                  </span>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Juan Dela Cruz"
                    className="glass-input"
                    style={{ marginTop: '0.35rem' }}
                    value={form.driverName}
                    onChange={e => setForm(prev => ({ ...prev, driverName: e.target.value }))}
                  />
                </label>

                <label style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Driver License Number *</span>
                    {autoFilledFields.has('licenseNumber') && (
                      <span style={{ fontSize: '0.7rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Sparkles size={11} /> Auto-filled
                      </span>
                    )}
                  </span>
                  <input
                    required
                    type="text"
                    placeholder="e.g. D01-12-345678"
                    className="glass-input"
                    style={{ marginTop: '0.35rem' }}
                    value={form.licenseNumber}
                    onChange={e => setForm(prev => ({ ...prev, licenseNumber: e.target.value }))}
                  />
                </label>

                <label style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Vehicle Make *</span>
                    {autoFilledFields.has('vehicleMake') && (
                      <span style={{ fontSize: '0.7rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Sparkles size={11} /> Auto-filled
                      </span>
                    )}
                  </span>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Honda, Kawasaki, Yamaha"
                    className="glass-input"
                    style={{ marginTop: '0.35rem' }}
                    value={form.vehicleMake}
                    onChange={e => setForm(prev => ({ ...prev, vehicleMake: e.target.value }))}
                  />
                </label>

                <label style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                  <span>Vehicle Model *</span>
                  <input
                    required
                    type="text"
                    placeholder="e.g. TMX 125, Barako II"
                    className="glass-input"
                    style={{ marginTop: '0.35rem' }}
                    value={form.vehicleModel}
                    onChange={e => setForm(prev => ({ ...prev, vehicleModel: e.target.value }))}
                  />
                </label>

                <label style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Plate Number *</span>
                    {autoFilledFields.has('plateNumber') && (
                      <span style={{ fontSize: '0.7rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Sparkles size={11} /> Auto-filled
                      </span>
                    )}
                  </span>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 1234-AB or ABC 123"
                    className="glass-input"
                    style={{ marginTop: '0.35rem' }}
                    value={form.plateNumber}
                    onChange={e => setForm(prev => ({ ...prev, plateNumber: e.target.value }))}
                  />
                </label>

                <label style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Engine / Motor Number *</span>
                    {autoFilledFields.has('motorNumber') && (
                      <span style={{ fontSize: '0.7rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Sparkles size={11} /> Auto-filled
                      </span>
                    )}
                  </span>
                  <input
                    required
                    type="text"
                    placeholder="e.g. KB01E-123456"
                    className="glass-input"
                    style={{ marginTop: '0.35rem' }}
                    value={form.motorNumber}
                    onChange={e => setForm(prev => ({ ...prev, motorNumber: e.target.value }))}
                  />
                </label>

                <label style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Chassis / Frame Number *</span>
                    {autoFilledFields.has('chassisNumber') && (
                      <span style={{ fontSize: '0.7rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Sparkles size={11} /> Auto-filled
                      </span>
                    )}
                  </span>
                  <input
                    required
                    type="text"
                    placeholder="e.g. KB01-987654321"
                    className="glass-input"
                    style={{ marginTop: '0.35rem' }}
                    value={form.chassisNumber}
                    onChange={e => setForm(prev => ({ ...prev, chassisNumber: e.target.value }))}
                  />
                </label>

                <label style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                  <span>Vehicle Color / Sidecar Color *</span>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Royal Blue / White"
                    className="glass-input"
                    style={{ marginTop: '0.35rem' }}
                    value={form.vehicleColor}
                    onChange={e => setForm(prev => ({ ...prev, vehicleColor: e.target.value }))}
                  />
                </label>

                <label style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                  <span>Assigned TODA *</span>
                  <select
                    className="glass-input glass-select"
                    style={{ marginTop: '0.35rem' }}
                    value={form.todaName}
                    onChange={e => setForm(prev => ({ ...prev, todaName: e.target.value }))}
                  >
                    {Object.keys(TODA_ROUTES).map(toda => (
                      <option key={toda} value={toda}>{toda}</option>
                    ))}
                  </select>
                </label>

                <label style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                  <span>Prescribed Route Area (Automatic)</span>
                  <input
                    className="glass-input"
                    style={{ marginTop: '0.35rem', background: 'rgba(255, 255, 255, 0.03)', color: '#94a3b8' }}
                    value={routeArea}
                    disabled
                  />
                </label>
              </div>
            </div>

            {/* Document Upload Section with OCR Authenticity Scanner */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={18} color="#34d399" />
                  Required Official Documents ({applicationType === 'renewal' ? 'Renewal Checklist' : 'New Franchise Checklist'})
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  Authenticity Verified via OCR
                </span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Please upload clear, legible photos or PDF scans of the official documents. Arbitrary photos (such as food, selfies, or personal pictures) will be automatically detected and rejected.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {requiredDocuments.map(doc => {
                  const isUploading = uploading[doc.key];
                  const isScanning = scanning[doc.key];
                  const attached = files[doc.key];

                  return (
                    <div
                      key={doc.key}
                      style={{
                        padding: '1.15rem',
                        borderRadius: '10px',
                        background: attached ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                        border: attached ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <strong style={{ color: '#f8fafc', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {doc.title}
                            {attached && <CheckCircle2 size={16} color="#4ade80" />}
                          </strong>
                          <span style={{ color: '#94a3b8', fontSize: '0.82rem', display: 'block', marginTop: '0.2rem' }}>
                            {doc.requirement}
                          </span>
                        </div>

                        <div style={{ minWidth: '220px', textAlign: 'right' }}>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            id={`file-input-${doc.key}`}
                            style={{ display: 'none' }}
                            disabled={isUploading || isScanning}
                            onChange={e => void handleFileUpload(doc.key, e.target.files?.[0])}
                          />

                          <label
                            htmlFor={`file-input-${doc.key}`}
                            className={`btn-glass ${attached ? 'btn-emerald-glass' : 'btn-blue-glass'}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem 1rem',
                              fontSize: '0.85rem',
                              cursor: (isUploading || isScanning) ? 'not-allowed' : 'pointer',
                              opacity: (isUploading || isScanning) ? 0.7 : 1,
                            }}
                          >
                            {isScanning ? (
                              <>
                                <Loader2 size={15} className="spin-icon" />
                                <span>Scanning Document...</span>
                              </>
                            ) : isUploading ? (
                              <>
                                <Loader2 size={15} className="spin-icon" />
                                <span>Uploading...</span>
                              </>
                            ) : attached ? (
                              <>
                                <CheckCircle size={15} />
                                <span>Change File</span>
                              </>
                            ) : (
                              <>
                                <FileUp size={15} />
                                <span>Upload Document</span>
                              </>
                            )}
                          </label>

                          {attached && (
                            <div style={{ fontSize: '0.78rem', color: '#4ade80', marginTop: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                              ✓ Attached: {attached.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submission Action */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={!ready}
                className="btn-glass btn-emerald-glass"
                style={{
                  padding: '1.1rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  opacity: !ready ? 0.6 : 1,
                  cursor: !ready ? 'not-allowed' : 'pointer',
                }}
              >
                <FileUp size={20} />
                Submit Complete Application to TODA President
              </button>

              {!ready && (
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center', margin: 0 }}>
                  Please attach all required official documents above to enable submission.
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
