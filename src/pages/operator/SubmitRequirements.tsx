import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { saveApplicationAsync, uploadFileToBucketAsync, recordAuditLogAsync } from '../../services/supabaseService';
import type { Application, Document, DocumentType } from '../../types';
import { REQUIRED_APPLICATION_DOCUMENTS, TODA_ROUTES, feeForAddress } from '../../services/applicationRules';
import { FileUp, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SubmitRequirements() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ driverName: '', licenseNumber: '', vehicleMake: '', vehicleModel: '', plateNumber: '', motorNumber: '', chassisNumber: '', vehicleColor: '', todaName: 'BASTODA (Baliuag Poblacion TODA)' });
  const [files, setFiles] = useState<Partial<Record<DocumentType, { name: string; url: string }>>>({});
  const [uploading, setUploading] = useState<Partial<Record<DocumentType, boolean>>>({});
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const addressFee = useMemo(() => feeForAddress(user?.address), [user?.address]);
  const routeArea = TODA_ROUTES[form.todaName];
  const ready = REQUIRED_APPLICATION_DOCUMENTS.every(document => files[document.key]) && !Object.values(uploading).some(Boolean);

  const upload = async (type: DocumentType, file?: File) => {
    if (!file) return;
    setUploading(previous => ({ ...previous, [type]: true }));
    try {
      const result = await uploadFileToBucketAsync(file, 'operator_documents');
      if (!result.url) throw new Error(result.error || 'Hindi na-upload ang file.');
      setFiles(previous => ({ ...previous, [type]: { name: file.name, url: result.url! } }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Hindi na-upload ang file.');
    } finally {
      setUploading(previous => ({ ...previous, [type]: false }));
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !ready) return;
    const now = new Date().toISOString();
    const documents: Document[] = REQUIRED_APPLICATION_DOCUMENTS.map(({ key, title }) => ({ id: crypto.randomUUID(), name: title, type: key, fileName: files[key]!.name, fileUrl: files[key]!.url, uploadedAt: now, status: 'uploaded' }));
    const app: Application = {
      id: crypto.randomUUID(), applicantId: user.id, applicantName: `${user.firstName} ${user.lastName}`, applicantAddress: user.address,
      applicantRole: 'operator', type: 'new', residency: addressFee.residency, status: 'pending_toda_approval',
      driverName: form.driverName, licenseNumber: form.licenseNumber, vehicleMake: form.vehicleMake, vehicleModel: form.vehicleModel,
      plateNumber: form.plateNumber, motorNumber: form.motorNumber, chassisNumber: form.chassisNumber, vehicleColor: form.vehicleColor,
      todaName: form.todaName, routeArea, documents, baseFee: addressFee.amount, todaFee: 0, latePenalty: 0, totalFee: addressFee.amount, submittedAt: now, updatedAt: now,
    };
    setError('');
    try { 
      await saveApplicationAsync(app, false);
      void recordAuditLogAsync({
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: 'operator',
        action: 'APPLICATION_SUBMITTED',
        details: `Operator submitted franchise application (Plate: ${app.plateNumber}, TODA: ${app.todaName})`,
        targetId: app.id,
      });
      setSubmitted(true); 
      setTimeout(() => navigate('/dashboard'), 1600); 
    }
    catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Hindi na-save ang application.'); }
  };

  return <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}><div className="glass-container" style={{ padding: '2.5rem' }}>
    <span className="pill-badge pill-emerald">Operator-led application</span><h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '.75rem 0 .5rem' }}>Submit complete franchise requirements</h2>
    <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>The operator submits all requirements for the driver and vehicle. The complete packet is sent to the TODA President before it reaches the administrator.</p>
    {!isSupabaseConfigured() && <p style={{ color: '#fbbf24' }}>Local preview mode: uploaded files are not shared until Supabase Storage is configured.</p>}
    {submitted ? <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}><CheckCircle size={52} color="#34d399" /><h3>Application sent to TODA President</h3><p>The application remains pending until TODA review and in-person inspection.</p></div> :
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>{error && <p role="alert" style={{ color: '#f87171' }}>{error}</p>}
      <div className="glass-panel" style={{ padding: '1rem' }}><strong>Automatic residency and fee</strong><p style={{ color: '#cbd5e1', margin: '.5rem 0 0' }}>Address on operator account: {user?.address || 'No address saved'}<br />Classification: {addressFee.residency === 'baliwag_resident' ? 'Baliwag resident' : 'Non-resident'} · Fixed franchise fee: <strong>₱{addressFee.amount.toFixed(2)}</strong></p></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {([['driverName', 'Driver full name'], ['licenseNumber', 'Driver license number'], ['vehicleMake', 'Vehicle make'], ['vehicleModel', 'Vehicle model'], ['plateNumber', 'Plate number'], ['motorNumber', 'Engine number'], ['chassisNumber', 'Chassis number'], ['vehicleColor', 'Vehicle color']] as const).map(([key, label]) => <label key={key} style={{ color: '#94a3b8', fontSize: '.82rem' }}>{label}<input required className="glass-input" value={form[key]} onChange={e => setForm(previous => ({ ...previous, [key]: e.target.value }))} /></label>)}
        <label style={{ color: '#94a3b8', fontSize: '.82rem' }}>Assigned TODA<select className="glass-input glass-select" value={form.todaName} onChange={e => setForm(previous => ({ ...previous, todaName: e.target.value }))}>{Object.keys(TODA_ROUTES).map(toda => <option key={toda}>{toda}</option>)}</select></label><label style={{ color: '#94a3b8', fontSize: '.82rem' }}>Automatic route<input className="glass-input" value={routeArea} disabled /></label>
      </div>
      <div className="glass-panel" style={{ padding: '1.25rem' }}><h3 style={{ marginTop: 0 }}>Complete requirements</h3>{REQUIRED_APPLICATION_DOCUMENTS.map(document => <label key={document.key} style={{ display: 'block', marginTop: '.8rem', color: '#cbd5e1' }}><strong>{document.title}</strong> <small style={{ color: '#94a3b8' }}>— {document.requirement}</small><input required type="file" accept="image/*,.pdf" className="glass-input" disabled={uploading[document.key]} onChange={e => void upload(document.key, e.target.files?.[0])} />{uploading[document.key] ? <Loader2 size={15} className="spin-icon" /> : files[document.key] && <small style={{ color: '#34d399' }}>Attached: {files[document.key]?.name}</small>}</label>)}</div>
      <button type="submit" disabled={!ready} className="btn-glass btn-emerald-glass" style={{ padding: '1rem' }}><FileUp size={20} /> Submit complete packet to TODA President</button>
    </form>}
  </div></div>;
}
