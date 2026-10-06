import { useState, useEffect } from 'react';
import { Megaphone, Info, Plus, Trash2, Edit2 } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import * as supabaseService from '../../services/supabaseService';
import type { Advertisement, InformationItem } from '../../types';

export function ContentManagement() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'ads' | 'info'>('ads');
  
  // Data
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [infoItems, setInfoItems] = useState<InformationItem[]>([]);

  // Modals & Forms
  const [showAdModal, setShowAdModal] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [adForm, setAdForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
    category: 'announcement' as 'announcement' | 'sponsor' | 'partner' | 'promo',
    isActive: true,
    displayOrder: 1,
  });

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [editingInfo, setEditingInfo] = useState<InformationItem | null>(null);
  const [infoForm, setInfoForm] = useState({
    title: '',
    category: 'guideline' as 'news' | 'guideline' | 'fare_matrix' | 'toda_info' | 'ordinance',
    content: '',
    imageUrl: '',
    isActive: true,
  });

  useEffect(() => {
    loadAllContent();
  }, []);

  const loadAllContent = async () => {
    try {
      const [fetchedAds, fetchedInfo] = await Promise.all([
        supabaseService.getAdvertisementsAsync(),
        supabaseService.getInformationItemsAsync(),
      ]);
      setAds(fetchedAds);
      setInfoItems(fetchedInfo);
    } catch {
      showToast('Failed to load content.', 'error');
    }
  };

  // ================= AD HANDLERS =================
  const openNewAdModal = () => {
    setEditingAd(null);
    setAdForm({
      title: '',
      description: '',
      imageUrl: '',
      linkUrl: '',
      category: 'announcement',
      isActive: true,
      displayOrder: ads.length + 1,
    });
    setShowAdModal(true);
  };

  const openEditAdModal = (ad: Advertisement) => {
    setEditingAd(ad);
    setAdForm({
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl || '',
      linkUrl: ad.linkUrl || '',
      category: ad.category,
      isActive: ad.isActive,
      displayOrder: ad.displayOrder || 1,
    });
    setShowAdModal(true);
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const adToSave: Advertisement = {
        id: editingAd ? editingAd.id : `ad-${Date.now()}`,
        title: adForm.title,
        description: adForm.description,
        imageUrl: adForm.imageUrl || undefined,
        linkUrl: adForm.linkUrl || undefined,
        category: adForm.category,
        isActive: adForm.isActive,
        displayOrder: Number(adForm.displayOrder) || 1,
        createdAt: editingAd ? editingAd.createdAt : new Date().toISOString(),
      };

      await supabaseService.saveAdvertisementAsync(adToSave);
      showToast('Advertisement saved successfully!', 'success');
      setShowAdModal(false);
      await loadAllContent();
    } catch {
      showToast('Failed to save advertisement.', 'error');
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (confirm('Are you sure you want to delete this advertisement?')) {
      await supabaseService.deleteAdvertisementAsync(id);
      showToast('Advertisement deleted successfully.', 'success');
      await loadAllContent();
    }
  };

  const handleToggleAdStatus = async (ad: Advertisement) => {
    const updated = { ...ad, isActive: !ad.isActive };
    await supabaseService.saveAdvertisementAsync(updated);
    showToast(`Ad is now ${updated.isActive ? 'ACTIVE' : 'INACTIVE'}.`, 'success');
    await loadAllContent();
  };

  // ================= INFO HANDLERS =================
  const openNewInfoModal = () => {
    setEditingInfo(null);
    setInfoForm({
      title: '',
      category: 'guideline',
      content: '',
      imageUrl: '',
      isActive: true,
    });
    setShowInfoModal(true);
  };

  const openEditInfoModal = (item: InformationItem) => {
    setEditingInfo(item);
    setInfoForm({
      title: item.title,
      category: item.category,
      content: item.content,
      imageUrl: item.imageUrl || '',
      isActive: item.isActive,
    });
    setShowInfoModal(true);
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const infoToSave: InformationItem = {
        id: editingInfo ? editingInfo.id : `info-${Date.now()}`,
        title: infoForm.title,
        category: infoForm.category,
        content: infoForm.content,
        imageUrl: infoForm.imageUrl || undefined,
        isActive: infoForm.isActive,
        publishedDate: editingInfo ? editingInfo.publishedDate : new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString(),
      };

      await supabaseService.saveInformationItemAsync(infoToSave);
      showToast('Information item saved successfully!', 'success');
      setShowInfoModal(false);
      await loadAllContent();
    } catch {
      showToast('Failed to save information item.', 'error');
    }
  };

  const handleDeleteInfo = async (id: string) => {
    if (confirm('Are you sure you want to delete this information item?')) {
      await supabaseService.deleteInformationItemAsync(id);
      showToast('Information item deleted.', 'success');
      await loadAllContent();
    }
  };

  const handleToggleInfoStatus = async (item: InformationItem) => {
    const updated = { ...item, isActive: !item.isActive, updatedAt: new Date().toISOString() };
    await supabaseService.saveInformationItemAsync(updated);
    showToast(`Information item is now ${updated.isActive ? 'ACTIVE' : 'INACTIVE'}.`, 'success');
    await loadAllContent();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Page Header */}
      <div className="glass-container" style={{ padding: '2.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="pill-badge pill-purple">Dynamic Content CMS</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Admin Panel Portal</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
          Dynamic Content & Advertisements Management
        </h1>
        <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
          Manage announcements, banners, fare matrices, and official guidelines displayed on the Public Landing Page.
        </p>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('ads')}
            className={`btn-glass ${activeTab === 'ads' ? 'btn-primary-glass' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
          >
            <Megaphone size={18} /> Advertisements & Banners ({ads.length})
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`btn-glass ${activeTab === 'info' ? 'btn-primary-glass' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
          >
            <Info size={18} /> Information & Guidelines ({infoItems.length})
          </button>
        </div>
      </div>

      {/* ================= TAB 1: ADVERTISEMENTS ================= */}
      {activeTab === 'ads' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>Dynamic Advertisements</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Appears on the live advertisement carousel and home page banners</p>
            </div>
            <button onClick={openNewAdModal} className="btn-glass btn-emerald-glass" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} /> Add New Advertisement
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {ads.map(ad => (
              <div 
                key={ad.id} 
                className="glass-container" 
                style={{ 
                  padding: '1.5rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  opacity: ad.isActive ? 1 : 0.6,
                  border: ad.isActive ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '20px',
                      background: ad.category === 'announcement' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                      color: ad.category === 'announcement' ? '#38bdf8' : '#c084fc',
                    }}>
                      {ad.category}
                    </span>

                    <button
                      onClick={() => handleToggleAdStatus(ad)}
                      className="btn-glass"
                      style={{
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.72rem',
                        background: ad.isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: ad.isActive ? '#4ade80' : '#f87171',
                      }}
                    >
                      {ad.isActive ? '● Active' : '○ Inactive'}
                    </button>
                  </div>

                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
                    {ad.title}
                  </h4>
                  <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '1rem' }}>
                    {ad.description}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Order: #{ad.displayOrder || 0}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => openEditAdModal(ad)} className="btn-glass" style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}>
                      <Edit2 size={14} /> Edit
                    </button>
                    <button onClick={() => handleDeleteAd(ad.id)} className="btn-glass" style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 2: INFORMATION ITEMS ================= */}
      {activeTab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>Dynamic Information & Guidelines</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Guidelines, registration steps, and fare matrices on the portal</p>
            </div>
            <button onClick={openNewInfoModal} className="btn-glass btn-emerald-glass" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} /> Add New Information
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {infoItems.map(item => (
              <div 
                key={item.id} 
                className="glass-container" 
                style={{ 
                  padding: '1.5rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  opacity: item.isActive ? 1 : 0.6,
                  border: item.isActive ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '20px',
                      background: 'rgba(52, 211, 153, 0.2)',
                      color: '#34d399',
                    }}>
                      {item.category.replace('_', ' ')}
                    </span>

                    <button
                      onClick={() => handleToggleInfoStatus(item)}
                      className="btn-glass"
                      style={{
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.72rem',
                        background: item.isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: item.isActive ? '#4ade80' : '#f87171',
                      }}
                    >
                      {item.isActive ? '● Active' : '○ Inactive'}
                    </button>
                  </div>

                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
                    {item.title}
                  </h4>
                  <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '1rem', whiteSpace: 'pre-line' }}>
                    {item.content}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Published: {item.publishedDate}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => openEditInfoModal(item)} className="btn-glass" style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}>
                      <Edit2 size={14} /> Edit
                    </button>
                    <button onClick={() => handleDeleteInfo(item.id)} className="btn-glass" style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: ADVERTISEMENT FORM ================= */}
      {showAdModal && (
        <div className="modal-overlay" onClick={() => setShowAdModal(false)}>
          <div className="glass-container modal-glass-content animate-fade-in" style={{ maxWidth: '600px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', marginBottom: '1rem' }}>
              {editingAd ? 'Edit Advertisement' : 'Add New Advertisement'}
            </h3>

            <form onSubmit={handleSaveAd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Ad Title *</label>
                <input
                  type="text"
                  className="glass-input"
                  value={adForm.title}
                  onChange={e => setAdForm({ ...adForm, title: e.target.value })}
                  placeholder="Example: Annual MTOP Renewal Advisory 2026"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Category *</label>
                  <select
                    className="glass-input glass-select"
                    value={adForm.category}
                    onChange={e => setAdForm({ ...adForm, category: e.target.value as any })}
                  >
                    <option value="announcement">Announcement (Official Notice)</option>
                    <option value="sponsor">Sponsor (Assistance Project)</option>
                    <option value="partner">Partner</option>
                    <option value="promo">Promo / Information</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Display Order</label>
                  <input
                    type="number"
                    className="glass-input"
                    value={adForm.displayOrder}
                    onChange={e => setAdForm({ ...adForm, displayOrder: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Description / Content *</label>
                <textarea
                  className="glass-input"
                  rows={4}
                  value={adForm.description}
                  onChange={e => setAdForm({ ...adForm, description: e.target.value })}
                  placeholder="Write the full advertisement details..."
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Image URL (Optional)</label>
                <input
                  type="text"
                  className="glass-input"
                  value={adForm.imageUrl}
                  onChange={e => setAdForm({ ...adForm, imageUrl: e.target.value })}
                  placeholder="https://example.com/banner.jpg"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="adActiveCheck"
                  checked={adForm.isActive}
                  onChange={e => setAdForm({ ...adForm, isActive: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#38bdf8' }}
                />
                <label htmlFor="adActiveCheck" style={{ fontSize: '0.88rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  Publish immediately (Active on Landing Page)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAdModal(false)} className="btn-glass">
                  Cancel
                </button>
                <button type="submit" className="btn-glass btn-primary-glass">
                  Save Advertisement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: INFORMATION ITEM FORM ================= */}
      {showInfoModal && (
        <div className="modal-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="glass-container modal-glass-content animate-fade-in" style={{ maxWidth: '600px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', marginBottom: '1rem' }}>
              {editingInfo ? 'Edit Information' : 'Add New Information'}
            </h3>

            <form onSubmit={handleSaveInfo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Title *</label>
                <input
                  type="text"
                  className="glass-input"
                  value={infoForm.title}
                  onChange={e => setInfoForm({ ...infoForm, title: e.target.value })}
                  placeholder="Example: Ordinance No. 2024-08: New Fare Matrix"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Category *</label>
                <select
                  className="glass-input glass-select"
                  value={infoForm.category}
                  onChange={e => setInfoForm({ ...infoForm, category: e.target.value as any })}
                >
                  <option value="guideline">Guideline (Registration Guide)</option>
                  <option value="fare_matrix">Fare Matrix</option>
                  <option value="news">News & Advisory</option>
                  <option value="toda_info">TODA Directory</option>
                  <option value="ordinance">City Ordinance</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Content / Text *</label>
                <textarea
                  className="glass-input"
                  rows={5}
                  value={infoForm.content}
                  onChange={e => setInfoForm({ ...infoForm, content: e.target.value })}
                  placeholder="Write the complete information, guidelines, or fare matrix details..."
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="infoActiveCheck"
                  checked={infoForm.isActive}
                  onChange={e => setInfoForm({ ...infoForm, isActive: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#34d399' }}
                />
                <label htmlFor="infoActiveCheck" style={{ fontSize: '0.88rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  Publish immediately (Active on Landing Page)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowInfoModal(false)} className="btn-glass">
                  Cancel
                </button>
                <button type="submit" className="btn-glass btn-primary-glass">
                  Save Information
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
