import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../DataTable/DataTable';
import ImageUploadField from '../ImageUploadField';
import api from '../../api/axiosInstance';
import {
  fetchMilestones,
  createMilestone,
  editMilestone,
  removeMilestone,
} from '../../redux/services/timelineService';
import { confirmDelete } from '../../utils/sweetalert';
import { hasPermission } from '../../utils/authHelper';
import AccessDenied from '../AccessDenied';

const BASE_URL = process.env.REACT_APP_IMG_URL;

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const clean = imagePath.replace(/^\//, '').replace(/^uploads\//, '');
  return `${BASE_URL}/uploads/${clean}`;
};

const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;

const LIMITS = {
  year:        { chars: 30,  words: 4   },
  title:       { chars: 100, words: 12  },
  description: { chars: 800, words: 120 },
};

const TIMELINE_IMAGE_CONFIG = {
  maxFileSize: 5 * 1024 * 1024,
  formats: [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'image/svg+xml', 'image/bmp', 'image/tiff', 'image/x-icon',
    'image/heic', 'image/heif', 'image/avif'
  ],
};

const validateImage = (file) => {
  if (file.size > TIMELINE_IMAGE_CONFIG.maxFileSize) {
    return { valid: false, error: `File too large. Max: 5MB. You have: ${(file.size / 1024 / 1024).toFixed(2)}MB` };
  }
  if (!TIMELINE_IMAGE_CONFIG.formats.includes(file.type)) {
    return { valid: false, error: `Invalid format. Use common image formats (JPG, PNG, WebP, GIF, SVG).` };
  }
  return { valid: true };
};

const validateField = (field, value) => {
  const limits = LIMITS[field];
  if (!limits) return null;
  if (value.length > limits.chars) return `Max ${limits.chars} characters (you have ${value.length})`;
  if (countWords(value) > limits.words) return `Max ${limits.words} words (you have ${countWords(value)})`;
  return null;
};

export default function Timeline({ showToast }) {
  const dispatch = useDispatch();
  const { items: rows, loading, error } = useSelector((state) => state.timeline);

  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [year, setYear]             = useState('');
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder]   = useState(0);
  const [isActive, setIsActive]     = useState(true);
  const [imageFile, setImageFile]   = useState(null);
  const [preview, setPreview]       = useState(null);
  const [errors, setErrors]         = useState({});
  const [imageValidation, setImageValidation] = useState(null);
  const fileInputRef = useRef();

  // Timeline Headers State
  const [timelineTitle, setTimelineTitle] = useState('');
  const [timelineSubtitle, setTimelineSubtitle] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => { 
    dispatch(fetchMilestones()); 
    // Fetch settings for timeline headers
    api.get('/settings').then(res => {
      setTimelineTitle(res.data.timelineTitle || 'Five Years, One Thread');
      setTimelineSubtitle(res.data.timelineSubtitle || 'Our journey through the years');
    }).catch(err => console.error(err));
  }, [dispatch]);

  const saveHeaderSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    const toastId = showToast.loading('Saving header settings...');
    try {
      await api.put('/settings', { timelineTitle, timelineSubtitle });
      showToast.success('Timeline headers updated!', toastId);
    } catch (err) {
      showToast.error('Failed to update headers', toastId);
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  if (!hasPermission('timeline_view')) {
    return <AccessDenied moduleName="Timeline" />;
  }

  const resetForm = () => {
    setShowForm(false); setEditingId(null);
    setYear(''); setTitle(''); setDescription('');
    setSortOrder(0); setIsActive(true);
    setImageFile(null); setPreview(null);
    setErrors({}); setImageValidation(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEditClick = (row) => {
    setEditingId(row.id);
    setYear(row.year || '');
    setTitle(row.title || '');
    setDescription(row.description || '');
    setSortOrder(row.sortOrder ?? 0);
    setIsActive(row.isActive ?? true);
    setImageFile(null);
    setPreview(row.image ? getImageUrl(row.image) : null);
    setErrors({}); setImageValidation(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearImage = () => {
    setImageFile(null); setImageValidation(null);
    setPreview(null);
    setErrors(prev => { const n = { ...prev }; delete n.image; return n; });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!year.trim()) newErrors.year = 'Year is required';
    else { const err = validateField('year', year); if (err) newErrors.year = err; }

    if (!title.trim()) newErrors.title = 'Title is required';
    else { const err = validateField('title', title); if (err) newErrors.title = err; }

    if (!description.trim()) newErrors.description = 'Description is required';
    else { const err = validateField('description', description); if (err) newErrors.description = err; }

    if (!imageFile && !preview) newErrors.image = 'Image is required';
    if (imageFile && imageValidation && !imageValidation.valid) newErrors.image = imageValidation.error;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast.error(Object.values(newErrors)[0]);
      return;
    }
    setErrors({});

    const fd = new FormData();
    fd.append('year', year);
    fd.append('title', title);
    fd.append('description', description);
    fd.append('sortOrder', sortOrder);
    fd.append('isActive', isActive);
    if (imageFile) fd.append('image', imageFile);

    const toastId = showToast.loading(editingId ? 'Updating milestone...' : 'Adding milestone...');
    try {
      if (editingId) {
        await dispatch(editMilestone({ id: editingId, formData: fd }));
        showToast.success('Milestone updated!', toastId);
      } else {
        await dispatch(createMilestone(fd));
        showToast.success('Milestone added!', toastId);
      }
      resetForm();
    } catch (err) {
      showToast.error(err?.response?.data?.message || 'Something went wrong', toastId);
    }
  };

  const handleDelete = (rowId, rowTitle) => {
    confirmDelete({
      title: 'Delete Milestone?',
      message: `Are you sure you want to delete the milestone "${rowTitle}"?`,
      onConfirm: async () => {
        try {
          await dispatch(removeMilestone(rowId));
          showToast.success('Milestone deleted!');
        } catch (err) {
          console.error('Failed to delete milestone:', err);
          showToast.error('Failed to delete milestone');
        }
      },
    });
  };

  return (
    <div className="categories-container">
      {/* ── Settings Block for Headers ── */}
      {hasPermission('settings_edit') && (
        <div className="km-form-card fade-in" style={{ marginBottom: 30, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 16, margin: '0 0 16px 0', fontWeight: 600, color: '#1A1A2E' }}>Timeline Header Settings</h3>
          <form onSubmit={saveHeaderSettings} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', textTransform: 'uppercase' }}>Timeline Main Title</label>
                <input
                  type="text"
                  value={timelineTitle}
                  onChange={(e) => setTimelineTitle(e.target.value)}
                  style={{ padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}
                  placeholder="e.g. Five Years, One Thread"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', textTransform: 'uppercase' }}>Timeline Subtitle</label>
                <input
                  type="text"
                  value={timelineSubtitle}
                  onChange={(e) => setTimelineSubtitle(e.target.value)}
                  style={{ padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}
                  placeholder="e.g. Our journey through the years"
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                disabled={savingSettings}
                style={{ padding: '10px 20px', background: '#1A3A6B', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
              >
                {savingSettings ? 'Saving...' : 'Save Headers'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Section Header ── */}
      <div className="section-header">
        <div className="section-title">Timeline Milestones</div>
        {hasPermission('timeline_create') && (
          <button
            className="action-btn btn-edit"
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          >
            {showForm ? 'Close' : '+ Add Milestone'}
          </button>
        )}
      </div>

      {/* ── Add / Edit Form ── */}
      {showForm && (
        <div className="km-form-card fade-in">
          <div className="km-form-header">
            <div className="km-form-header-icon">{editingId ? '✎' : '⏳'}</div>
            <div>
              <div className="km-form-header-title">
                {editingId ? 'Edit Milestone' : 'Add New Milestone'}
              </div>
              <div className="km-form-header-sub">Fill in the details below</div>
            </div>
          </div>

          <div className="km-form-body">
            <form className="km-form-grid" onSubmit={handleSubmit}>

              {/* Milestone Image */}
              <ImageUploadField
                label="Milestone Image"
                imageFile={imageFile}
                preview={preview}
                fileInputRef={fileInputRef}
                onFileChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setImageFile(file);
                    const result = validateImage(file);
                    setImageValidation(result);
                    if (!result.valid) {
                      setErrors(prev => ({ ...prev, image: result.error }));
                    } else {
                      setErrors(prev => { const n = { ...prev }; delete n.image; return n; });
                    }
                  }
                }}
                onClear={handleClearImage}
                validation={imageValidation}
                requirements="Landscape (e.g. 4:3 or 16:9 ratio) • Max: 5MB"
                accept="image/*"
              />

              {/* Form inputs */}
              <div className="km-field">
                <label className="km-label">
                  Year <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`km-input${errors.year ? ' km-input-error' : ''}`}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 2020 or 2020 - 2021"
                />
                {errors.year && <div className="km-error-msg">⚠ {errors.year}</div>}
              </div>

              <div className="km-field">
                <label className="km-label">
                  Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`km-input${errors.title ? ' km-input-error' : ''}`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Beginning"
                />
                {errors.title && <div className="km-error-msg">⚠ {errors.title}</div>}
              </div>

              <div className="km-field km-field-full">
                <label className="km-label">
                  Description <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  rows="4"
                  className={`km-input${errors.description ? ' km-input-error' : ''}`}
                  style={{ height: 'auto', padding: '12px' }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter details about this milestone..."
                />
                {errors.description && <div className="km-error-msg">⚠ {errors.description}</div>}
              </div>

              <div className="km-field">
                <label className="km-label">Sort Order</label>
                <input
                  type="number"
                  className="km-input"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                />
              </div>

              <div className="km-field flex-row align-center pt-30">
                <label className="km-label mr-20">Active Status</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              {/* Form buttons */}
              <div className="km-form-actions" style={{ gridColumn: 'span 2' }}>
                <button type="button" className="action-btn btn-cancel mr-10" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="action-btn btn-save">
                  {editingId ? 'Update Milestone' : 'Save Milestone'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── Error Message ── */}
      {error && (
        <div className="alert alert-danger" style={{ margin: '20px 0', padding: '15px', borderRadius: '8px', color: '#721c24', backgroundColor: '#f8d7da', borderColor: '#f5c6cb' }}>
          <strong>Error:</strong> {error}. Please ensure the backend server is running and restarted.
        </div>
      )}

      {/* ── Data List Table ── */}
      {loading ? (
        <p className="km-loading">Loading milestones...</p>
      ) : (
        <DataTable
          columns={['No.', 'Image', 'Year', 'Title', 'Sort Order', 'Status', 'Actions']}
          initialRows={rows || []}
          renderRow={(row, idx) => (
            <tr key={row.id || idx}>
              <td>{idx + 1}</td>
              <td>
                <img
                  src={getImageUrl(row.image)}
                  alt={row.title}
                  style={{ width: '60px', height: '45px', objectFit: 'cover', borderRadius: '4px' }}
                />
              </td>
              <td><strong>{row.year}</strong></td>
              <td>{row.title}</td>
              <td>{row.sortOrder}</td>
              <td>
                <span className={`badge ${row.isActive ? 'badge-active' : 'badge-inactive'}`}>
                  {row.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <div className="table-actions">
                  {hasPermission('timeline_edit') && (
                    <button className="action-btn btn-edit mr-10" onClick={() => handleEditClick(row)}>
                      ✎ Edit
                    </button>
                  )}
                  {hasPermission('timeline_delete') && (
                    <button className="action-btn btn-delete" onClick={() => handleDelete(row.id, row.title)}>
                      🗑 Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )}
        />
      )}

      <style>{`
        .km-form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .km-field-full {
          grid-column: span 2;
        }
        .km-field-half {
          grid-column: span 1;
        }
        .upload-grid-wrapper {
          display: flex;
          gap: 16px;
          margin-top: 8px;
          align-items: flex-start;
          grid-column: span 2;
        }
        .drop-zone-area {
          flex: 1;
          height: 110px;
          border: 2px dashed rgba(0, 0, 0, 0.1);
          background: rgba(0, 0, 0, 0.02);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .drop-zone-area.active-file {
          border-color: #45b369;
          background: rgba(69, 179, 105, 0.05);
        }
        .drop-zone-area:hover {
          border-color: #487fff;
          background: rgba(72, 127, 255, 0.04);
        }
        .drop-zone-info {
          text-align: center;
        }
        .upload-icon {
          text-align: center;
          font-size: 20px;
          margin-bottom: 4px;
        }
        .upload-text {
          font-size: 13px;
          color: #666;
          margin: 0;
        }
        .preview-tile {
          width: 110px;
          height: 110px;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          border: 2px solid #487fff;
          flex-shrink: 0;
        }
        .preview-tile img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .preview-remove {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(0,0,0,0.7);
          color: white;
          border: none;
          cursor: pointer;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .km-form-actions {
          grid-column: span 2;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 10px;
          padding-top: 20px;
          border-top: 1px solid rgba(0,0,0,0.05);
        }
        .km-btn-submit {
          padding: 10px 24px;
          background: #487fff;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
          font-family: inherit;
          font-size: 13px;
        }
        .km-btn-cancel {
          padding: 10px 24px;
          background: #f1f1f1;
          color: #333;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
        }
        .km-btn-submit:hover, .km-btn-cancel:hover {
          opacity: 0.8;
        }
        .fade-in {
          animation: kmFadeIn 0.3s ease-out;
        }
        @keyframes kmFadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
