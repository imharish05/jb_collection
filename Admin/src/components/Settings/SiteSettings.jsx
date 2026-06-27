import React, { useState, useEffect, useRef } from 'react';
import ImageUploadField from '../ImageUploadField';
import { hasPermission } from '../../utils/authHelper';
import api from '../../api/axiosInstance';
import AccessDenied from '../AccessDenied';

const IMG_BASE_URL = process.env.REACT_APP_IMG_URL || 'http://localhost:5000';

const KM = {
  orange: '#b60410',
  orangeLight: '#FEF0EB',
  blue: '#1A3A6B',
  green: '#39B54A',
  border: '#E5E7EB',
  text: '#1A1A2E',
  muted: '#6B7280',
  bg: '#F9FAFB',
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const clean = imagePath.replace(/^\//, '');
  return `${IMG_BASE_URL}/${clean}`;
};

export default function SiteSettings({ showToast }) {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // General Settings State
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const logoInputRef = useRef(null);

  // About Page State
  const [aboutImageUrl, setAboutImageUrl] = useState('');
  const [aboutImageFile, setAboutImageFile] = useState(null);
  const [aboutImagePreview, setAboutImagePreview] = useState('');
  const aboutImageInputRef = useRef(null);

  const [aboutTitle, setAboutTitle] = useState('');
  const [aboutSubtitle, setAboutSubtitle] = useState('');
  const [aboutDescPrimary, setAboutDescPrimary] = useState('');
  const [aboutDescSecondary, setAboutDescSecondary] = useState('');
  const [aboutSignature, setAboutSignature] = useState('');

  // Core Mission State
  const [missionTitle, setMissionTitle] = useState('');
  const [missionSubtitle, setMissionSubtitle] = useState('');
  const [missionGridCol1Title, setMissionGridCol1Title] = useState('');
  const [missionGridCol1Desc, setMissionGridCol1Desc] = useState('');
  const [missionGridCol2Title, setMissionGridCol2Title] = useState('');
  const [missionGridCol2Desc, setMissionGridCol2Desc] = useState('');
  const [missionGridCol3Title, setMissionGridCol3Title] = useState('');
  const [missionGridCol3Desc, setMissionGridCol3Desc] = useState('');

  // Statistics State
  const [stat1Count, setStat1Count] = useState('');
  const [stat1Label, setStat1Label] = useState('');
  const [stat2Count, setStat2Count] = useState('');
  const [stat2Label, setStat2Label] = useState('');
  const [stat3Count, setStat3Count] = useState('');
  const [stat3Label, setStat3Label] = useState('');
  const [stat4Count, setStat4Count] = useState('');
  const [stat4Label, setStat4Label] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      const data = res.data || {};

      // General
      setLogoUrl(data.logoUrl || '');
      setLogoPreview(getImageUrl(data.logoUrl));

      // About
      setAboutImageUrl(data.aboutImageUrl || '');
      setAboutImagePreview(getImageUrl(data.aboutImageUrl));
      setAboutTitle(data.aboutTitle || 'Welcome To Kamali Gifts');
      setAboutSubtitle(data.aboutSubtitle || 'Who Are We');
      setAboutDescPrimary(data.aboutDescPrimary || '');
      setAboutDescSecondary(data.aboutDescSecondary || '');
      setAboutSignature(data.aboutSignature || 'Making your special moments even more memorable.');

      // Core Mission
      setMissionTitle(data.missionTitle || 'Our Core Mission');
      setMissionSubtitle(data.missionSubtitle || 'We focus on delivering value through three pillars.');
      setMissionGridCol1Title(data.missionGridCol1Title || 'Our Vision');
      setMissionGridCol1Desc(data.missionGridCol1Desc || '');
      setMissionGridCol2Title(data.missionGridCol2Title || 'Our Mission');
      setMissionGridCol2Desc(data.missionGridCol2Desc || '');
      setMissionGridCol3Title(data.missionGridCol3Title || 'Our Goal');
      setMissionGridCol3Desc(data.missionGridCol3Desc || '');

      // Statistics
      setStat1Count(data.stat1Count || '1200');
      setStat1Label(data.stat1Label || 'gifts delivered');
      setStat2Count(data.stat2Count || '850');
      setStat2Label(data.stat2Label || 'happy customers');
      setStat3Count(data.stat3Count || '25');
      setStat3Label(data.stat3Label || 'event categories');
      setStat4Count(data.stat4Count || '500');
      setStat4Label(data.stat4Label || '5 star reviews');

    } catch (err) {
      showToast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const toastId = showToast.loading('Reloading settings...');
    try {
      const res = await api.get('/settings');
      const data = res.data || {};

      // General
      setLogoUrl(data.logoUrl || '');
      setLogoPreview(getImageUrl(data.logoUrl));
      setLogoFile(null);
      if (logoInputRef.current) logoInputRef.current.value = '';

      // About
      setAboutImageUrl(data.aboutImageUrl || '');
      setAboutImagePreview(getImageUrl(data.aboutImageUrl));
      setAboutImageFile(null);
      if (aboutImageInputRef.current) aboutImageInputRef.current.value = '';

      setAboutTitle(data.aboutTitle || 'Welcome To Kamali Gifts');
      setAboutSubtitle(data.aboutSubtitle || 'Who Are We');
      setAboutDescPrimary(data.aboutDescPrimary || '');
      setAboutDescSecondary(data.aboutDescSecondary || '');
      setAboutSignature(data.aboutSignature || 'Making your special moments even more memorable.');

      // Core Mission
      setMissionTitle(data.missionTitle || 'Our Core Mission');
      setMissionSubtitle(data.missionSubtitle || 'We focus on delivering value through three pillars.');
      setMissionGridCol1Title(data.missionGridCol1Title || 'Our Vision');
      setMissionGridCol1Desc(data.missionGridCol1Desc || '');
      setMissionGridCol2Title(data.missionGridCol2Title || 'Our Mission');
      setMissionGridCol2Desc(data.missionGridCol2Desc || '');
      setMissionGridCol3Title(data.missionGridCol3Title || 'Our Goal');
      setMissionGridCol3Desc(data.missionGridCol3Desc || '');

      // Statistics
      setStat1Count(data.stat1Count || '1200');
      setStat1Label(data.stat1Label || 'gifts delivered');
      setStat2Count(data.stat2Count || '850');
      setStat2Label(data.stat2Label || 'happy customers');
      setStat3Count(data.stat3Count || '25');
      setStat3Label(data.stat3Label || 'event categories');
      setStat4Count(data.stat4Count || '500');
      setStat4Label(data.stat4Label || '5 star reviews');

      showToast.success('Settings reloaded to saved state', toastId);
    } catch (err) {
      showToast.error('Failed to load settings', toastId);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleAboutImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAboutImageFile(file);
      setAboutImagePreview(URL.createObjectURL(file));
    }
  };

  const handleClearLogo = () => {
    setLogoFile(null);
    setLogoUrl('');
    setLogoPreview('');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleClearAboutImage = () => {
    setAboutImageFile(null);
    setAboutImageUrl('');
    setAboutImagePreview('');
    if (aboutImageInputRef.current) aboutImageInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasPermission('settings_edit')) {
      showToast.error('You do not have permission to edit settings');
      return;
    }

    setSaving(true);
    const toastId = showToast.loading('Saving settings...');

    try {
      const formData = new FormData();

      // Append text settings
      formData.append('aboutTitle', aboutTitle);
      formData.append('aboutSubtitle', aboutSubtitle);
      formData.append('aboutDescPrimary', aboutDescPrimary);
      formData.append('aboutDescSecondary', aboutDescSecondary);
      formData.append('aboutSignature', aboutSignature);

      formData.append('missionTitle', missionTitle);
      formData.append('missionSubtitle', missionSubtitle);
      formData.append('missionGridCol1Title', missionGridCol1Title);
      formData.append('missionGridCol1Desc', missionGridCol1Desc);
      formData.append('missionGridCol2Title', missionGridCol2Title);
      formData.append('missionGridCol2Desc', missionGridCol2Desc);
      formData.append('missionGridCol3Title', missionGridCol3Title);
      formData.append('missionGridCol3Desc', missionGridCol3Desc);

      formData.append('stat1Count', stat1Count);
      formData.append('stat1Label', stat1Label);
      formData.append('stat2Count', stat2Count);
      formData.append('stat2Label', stat2Label);
      formData.append('stat3Count', stat3Count);
      formData.append('stat3Label', stat3Label);
      formData.append('stat4Count', stat4Count);
      formData.append('stat4Label', stat4Label);

      // Append cleared paths if cleared
      if (!logoUrl && !logoFile) {
        formData.append('logoUrl', '');
      }
      if (!aboutImageUrl && !aboutImageFile) {
        formData.append('aboutImageUrl', '');
      }

      // Append files if selected
      if (logoFile) {
        formData.append('logo', logoFile);
      }
      if (aboutImageFile) {
        formData.append('aboutImage', aboutImageFile);
      }

      const res = await api.put('/settings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updated = res.data.settings || {};
      
      // Update local values with saved ones
      setLogoUrl(updated.logoUrl || '');
      setLogoPreview(getImageUrl(updated.logoUrl));
      setAboutImageUrl(updated.aboutImageUrl || '');
      setAboutImagePreview(getImageUrl(updated.aboutImageUrl));

      setLogoFile(null);
      setAboutImageFile(null);

      showToast.success('Settings updated successfully', toastId);
      
      // Dispatch custom event to notify Sidebar / Topbar about logo change
      window.dispatchEvent(new Event('site-settings-updated'));
      
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to save settings', toastId);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    padding: '9px 12px',
    border: `1px solid ${KM.border}`,
    borderRadius: 8,
    fontSize: 13,
    color: KM.text,
    background: '#fff',
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 500,
    color: KM.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  if (!hasPermission('settings_view')) {
    return <AccessDenied moduleName="Site Settings" />;
  }

  if (loading) {
    return (
      <div className="categories-container">
        <div className="section-header">
          <div className="section-title">Site Settings</div>
        </div>
        <p className="km-loading">Loading site settings...</p>
      </div>
    );
  }

  return (
    <div className="categories-container" style={{ paddingBottom: 40 }}>
      <div className="section-header">
        <div className="section-title">Site Settings</div>
      </div>

      {/* Tabs */}
      <div className="tabs-container" style={{ display: 'flex', gap: 15, borderBottom: `1px solid ${KM.border}`, marginBottom: 25, paddingBottom: 5 }}>
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          style={{
            padding: '10px 15px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'general' ? `2px solid ${KM.orange}` : 'none',
            color: activeTab === 'general' ? KM.orange : KM.muted,
            fontWeight: activeTab === 'general' ? 600 : 500,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          General & Logo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('about')}
          style={{
            padding: '10px 15px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'about' ? `2px solid ${KM.orange}` : 'none',
            color: activeTab === 'about' ? KM.orange : KM.muted,
            fontWeight: activeTab === 'about' ? 600 : 500,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          About "Who We Are"
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('mission')}
          style={{
            padding: '10px 15px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'mission' ? `2px solid ${KM.orange}` : 'none',
            color: activeTab === 'mission' ? KM.orange : KM.muted,
            fontWeight: activeTab === 'mission' ? 600 : 500,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Core Mission Pillars
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          style={{
            padding: '10px 15px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'stats' ? `2px solid ${KM.orange}` : 'none',
            color: activeTab === 'stats' ? KM.orange : KM.muted,
            fontWeight: activeTab === 'stats' ? 600 : 500,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Statistics Counters
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* TAB 1: GENERAL & LOGO */}
        {activeTab === 'general' && (
          <div className="km-form-card fade-in" style={{ background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 16, margin: '0 0 16px 0', fontWeight: 600, color: KM.text }}>Storefront & Admin Logo</h3>
            <div style={{ maxWidth: 500 }}>
              <ImageUploadField
                label="Store Logo"
                imageFile={logoFile}
                preview={logoPreview}
                fileInputRef={logoInputRef}
                onFileChange={handleLogoChange}
                onClear={handleClearLogo}
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/bmp,image/tiff,image/x-icon,image/heic,image/heif,image/avif"
                requirements="Horizontal orientation recommended • Max: 3MB (Common Image Formats)"
              />
            </div>
          </div>
        )}

        {/* TAB 2: ABOUT US PAGE */}
        {activeTab === 'about' && (
          <div className="km-form-card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 16, margin: 0, fontWeight: 600, color: KM.text }}>About Page Header Section</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={labelStyle}>Section Subtitle</label>
                  <input
                    value={aboutSubtitle}
                    onChange={e => setAboutSubtitle(e.target.value)}
                    style={inputStyle}
                    placeholder="e.g. Who Are We"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={labelStyle}>Welcome Main Title</label>
                  <input
                    value={aboutTitle}
                    onChange={e => setAboutTitle(e.target.value)}
                    style={inputStyle}
                    placeholder="e.g. Welcome To Kamali Gifts"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={labelStyle}>Signature / Closing Message</label>
                  <input
                    value={aboutSignature}
                    onChange={e => setAboutSignature(e.target.value)}
                    style={inputStyle}
                    placeholder="e.g. Making your special moments even more memorable."
                  />
                </div>
              </div>

              <div>
                <ImageUploadField
                  label="Welcome / About Image"
                  imageFile={aboutImageFile}
                  preview={aboutImagePreview}
                  fileInputRef={aboutImageInputRef}
                  onFileChange={handleAboutImageChange}
                  onClear={handleClearAboutImage}
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/bmp,image/tiff,image/x-icon,image/heic,image/heif,image/avif"
                  requirements="570×370px recommended • Max: 3MB (Common Image Formats)"
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={labelStyle}>Description Paragraph 1</label>
              <textarea
                value={aboutDescPrimary}
                onChange={e => setAboutDescPrimary(e.target.value)}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                placeholder="First paragraph..."
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={labelStyle}>Description Paragraph 2</label>
              <textarea
                value={aboutDescSecondary}
                onChange={e => setAboutDescSecondary(e.target.value)}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                placeholder="Second paragraph..."
              />
            </div>
          </div>
        )}

        {/* TAB 3: CORE MISSION PILLARS */}
        {activeTab === 'mission' && (
          <div className="km-form-card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 16, margin: 0, fontWeight: 600, color: KM.text }}>Core Mission & Pillars (About Page)</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={labelStyle}>Section Header Title</label>
                <input
                  value={missionTitle}
                  onChange={e => setMissionTitle(e.target.value)}
                  style={inputStyle}
                  placeholder="e.g. Our Core Mission"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={labelStyle}>Section Header Subtitle</label>
                <input
                  value={missionSubtitle}
                  onChange={e => setMissionSubtitle(e.target.value)}
                  style={inputStyle}
                  placeholder="e.g. We focus on delivering value through three pillars."
                />
              </div>
            </div>

            <hr style={{ border: 0, borderTop: `1px solid ${KM.border}`, margin: '10px 0' }} />

            {/* Grid 1 */}
            <div style={{ background: '#fcfcfc', border: `1px solid ${KM.border}`, borderRadius: 8, padding: 15 }}>
              <h4 style={{ fontSize: 13, margin: '0 0 10px 0', fontWeight: 600, color: KM.orange }}>Pillar 1 (e.g. Vision)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  value={missionGridCol1Title}
                  onChange={e => setMissionGridCol1Title(e.target.value)}
                  style={inputStyle}
                  placeholder="Title"
                />
                <textarea
                  value={missionGridCol1Desc}
                  onChange={e => setMissionGridCol1Desc(e.target.value)}
                  style={{ ...inputStyle, minHeight: 60 }}
                  placeholder="Description text..."
                />
              </div>
            </div>

            {/* Grid 2 */}
            <div style={{ background: '#fcfcfc', border: `1px solid ${KM.border}`, borderRadius: 8, padding: 15 }}>
              <h4 style={{ fontSize: 13, margin: '0 0 10px 0', fontWeight: 600, color: KM.orange }}>Pillar 2 (e.g. Mission)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  value={missionGridCol2Title}
                  onChange={e => setMissionGridCol2Title(e.target.value)}
                  style={inputStyle}
                  placeholder="Title"
                />
                <textarea
                  value={missionGridCol2Desc}
                  onChange={e => setMissionGridCol2Desc(e.target.value)}
                  style={{ ...inputStyle, minHeight: 60 }}
                  placeholder="Description text..."
                />
              </div>
            </div>

            {/* Grid 3 */}
            <div style={{ background: '#fcfcfc', border: `1px solid ${KM.border}`, borderRadius: 8, padding: 15 }}>
              <h4 style={{ fontSize: 13, margin: '0 0 10px 0', fontWeight: 600, color: KM.orange }}>Pillar 3 (e.g. Goal)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  value={missionGridCol3Title}
                  onChange={e => setMissionGridCol3Title(e.target.value)}
                  style={inputStyle}
                  placeholder="Title"
                />
                <textarea
                  value={missionGridCol3Desc}
                  onChange={e => setMissionGridCol3Desc(e.target.value)}
                  style={{ ...inputStyle, minHeight: 60 }}
                  placeholder="Description text..."
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: STATISTICS COUNTERS */}
        {activeTab === 'stats' && (
          <div className="km-form-card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 16, margin: 0, fontWeight: 600, color: KM.text }}>About Page Statistics Counters</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Stat 1 */}
              <div style={{ background: '#fcfcfc', border: `1px solid ${KM.border}`, borderRadius: 8, padding: 15 }}>
                <h4 style={{ fontSize: 13, margin: '0 0 10px 0', fontWeight: 600, color: KM.orange }}>Counter Item 1</h4>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Number</label>
                    <input value={stat1Count} onChange={e => setStat1Count(e.target.value)} style={inputStyle} placeholder="e.g. 1200" />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={labelStyle}>Label</label>
                    <input value={stat1Label} onChange={e => setStat1Label(e.target.value)} style={inputStyle} placeholder="e.g. gifts delivered" />
                  </div>
                </div>
              </div>

              {/* Stat 2 */}
              <div style={{ background: '#fcfcfc', border: `1px solid ${KM.border}`, borderRadius: 8, padding: 15 }}>
                <h4 style={{ fontSize: 13, margin: '0 0 10px 0', fontWeight: 600, color: KM.orange }}>Counter Item 2</h4>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Number</label>
                    <input value={stat2Count} onChange={e => setStat2Count(e.target.value)} style={inputStyle} placeholder="e.g. 850" />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={labelStyle}>Label</label>
                    <input value={stat2Label} onChange={e => setStat2Label(e.target.value)} style={inputStyle} placeholder="e.g. happy customers" />
                  </div>
                </div>
              </div>

              {/* Stat 3 */}
              <div style={{ background: '#fcfcfc', border: `1px solid ${KM.border}`, borderRadius: 8, padding: 15 }}>
                <h4 style={{ fontSize: 13, margin: '0 0 10px 0', fontWeight: 600, color: KM.orange }}>Counter Item 3</h4>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Number</label>
                    <input value={stat3Count} onChange={e => setStat3Count(e.target.value)} style={inputStyle} placeholder="e.g. 25" />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={labelStyle}>Label</label>
                    <input value={stat3Label} onChange={e => setStat3Label(e.target.value)} style={inputStyle} placeholder="e.g. event categories" />
                  </div>
                </div>
              </div>

              {/* Stat 4 */}
              <div style={{ background: '#fcfcfc', border: `1px solid ${KM.border}`, borderRadius: 8, padding: 15 }}>
                <h4 style={{ fontSize: 13, margin: '0 0 10px 0', fontWeight: 600, color: KM.orange }}>Counter Item 4</h4>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Number</label>
                    <input value={stat4Count} onChange={e => setStat4Count(e.target.value)} style={inputStyle} placeholder="e.g. 500" />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={labelStyle}>Label</label>
                    <input value={stat4Label} onChange={e => setStat4Label(e.target.value)} style={inputStyle} placeholder="e.g. 5 star reviews" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Action Buttons */}
        {hasPermission('settings_edit') && (
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '11px 22px',
                background: KM.blue,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              style={{
                padding: '11px 22px',
                background: '#fff',
                border: `1px solid ${KM.border}`,
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                color: KM.muted,
                cursor: 'pointer',
              }}
            >
              Reset / Reload
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
