import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../DataTable/DataTable';
import ImageUploadField from '../ImageUploadField';
import {
  fetchTestimonials,
  createTestimonial,
  editTestimonial,
  removeTestimonial,
} from '../../redux/services/testimonialsService';
import { confirmDelete } from '../../utils/sweetalert';
import { hasPermission } from '../../utils/authHelper';

const BASE_URL = process.env.REACT_APP_IMG_URL;

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const clean = imagePath.replace(/^\//, '').replace(/^uploads\//, '');
  return `${BASE_URL}/uploads/${clean}`;
};

const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;

const LIMITS = {
  name:        { chars: 60,  words: 6  },
  designation: { chars: 80,  words: 8  },
  text:        { chars: 350, words: 60 },
};

const TESTIMONIAL_IMAGE_CONFIG = {
  width: 300,
  height: 300,
  aspectRatio: 1 / 1,
  tolerance: 0.05,
  maxFileSize: 3 * 1024 * 1024,
  formats: [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'image/svg+xml', 'image/bmp', 'image/tiff', 'image/x-icon',
    'image/heic', 'image/heif', 'image/avif'
  ],
};

const validateImageDimensions = (file) =>
  new Promise((resolve) => {
    if (file.size > TESTIMONIAL_IMAGE_CONFIG.maxFileSize) {
      resolve({ valid: false, error: `File too large. Max: 3MB. You have: ${(file.size / 1024 / 1024).toFixed(2)}MB` });
      return;
    }
    if (!TESTIMONIAL_IMAGE_CONFIG.formats.includes(file.type)) {
      resolve({ valid: false, error: `Invalid format. Use common image formats (JPG, PNG, WebP, GIF, SVG, BMP, TIFF, ICO, HEIC, HEIF, AVIF). You uploaded: ${file.type || 'unknown'}` });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        const ratioDiff = Math.abs(width / height - TESTIMONIAL_IMAGE_CONFIG.aspectRatio) / TESTIMONIAL_IMAGE_CONFIG.aspectRatio;
        if (ratioDiff > TESTIMONIAL_IMAGE_CONFIG.tolerance) {
          resolve({ valid: false, error: `Incorrect aspect ratio. Use 1:1 square (${TESTIMONIAL_IMAGE_CONFIG.width}×${TESTIMONIAL_IMAGE_CONFIG.height}px). Yours: ${width}×${height}px`, dimensions: { width, height } });
          return;
        }
        resolve({ valid: true, dimensions: { width, height } });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

const validateField = (field, value) => {
  const limits = LIMITS[field];
  if (!limits) return null;
  if (value.length > limits.chars) return `Max ${limits.chars} characters (you have ${value.length})`;
  if (countWords(value) > limits.words) return `Max ${limits.words} words (you have ${countWords(value)})`;
  return null;
};

export default function Testimonials({ showToast }) {
  const dispatch = useDispatch();
  const { items: rows, loading } = useSelector((state) => state.testimonials);

  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [name, setName]               = useState('');
  const [designation, setDesignation] = useState('');
  const [text, setText]               = useState('');
  const [sortOrder, setSortOrder]     = useState(0);
  const [isActive, setIsActive]       = useState(true);
  const [imageFile, setImageFile]     = useState(null);
  const [preview, setPreview]         = useState(null);
  const [errors, setErrors]           = useState({});
  const [imageDimensions, setImageDimensions] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => { dispatch(fetchTestimonials()); }, [dispatch]);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  const resetForm = () => {
    setShowForm(false); setEditingId(null);
    setName(''); setDesignation(''); setText('');
    setSortOrder(0); setIsActive(true);
    setImageFile(null); setPreview(null);
    setErrors({}); setImageDimensions(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEditClick = (row) => {
    setEditingId(row.id);
    setName(row.name || '');
    setDesignation(row.designation || '');
    setText(row.text || '');
    setSortOrder(row.sortOrder ?? 0);
    setIsActive(row.isActive ?? true);
    setImageFile(null);
    setPreview(row.image ? getImageUrl(row.image) : null);
    setErrors({}); setImageDimensions(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearImage = () => {
    setImageFile(null); setImageDimensions(null);
    setPreview(null);
    setErrors(prev => { const n = { ...prev }; delete n.image; return n; });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!name.trim())        newErrors.name        = 'Name is required';
    else { const err = validateField('name', name); if (err) newErrors.name = err; }
    if (!designation.trim()) newErrors.designation = 'Designation is required';
    else { const err = validateField('designation', designation); if (err) newErrors.designation = err; }
    if (!text.trim())        newErrors.text        = 'Testimonial text is required';
    else { const err = validateField('text', text); if (err) newErrors.text = err; }
    if (!imageFile && !preview) newErrors.image = 'Image is required';
    if (imageFile && imageDimensions && !imageDimensions.valid) newErrors.image = imageDimensions.error;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast.error(Object.values(newErrors)[0]);
      return;
    }
    setErrors({});

    const fd = new FormData();
    fd.append('name', name);
    fd.append('designation', designation);
    fd.append('text', text);
    fd.append('sortOrder', sortOrder);
    fd.append('isActive', isActive);
    if (imageFile) fd.append('image', imageFile);

    const toastId = showToast.loading(editingId ? 'Updating testimonial...' : 'Adding testimonial...');
    try {
      if (editingId) {
        await dispatch(editTestimonial({ id: editingId, formData: fd }));
        showToast.success('Testimonial updated!', toastId);
      } else {
        await dispatch(createTestimonial(fd));
        showToast.success('Testimonial added!', toastId);
      }
      resetForm();
    } catch (err) {
      showToast.error(err?.response?.data?.message || 'Something went wrong', toastId);
    }
  };

  const handleDelete = (rowId, rowName) => {
    confirmDelete({
      title: 'Delete Testimonial?',
      message: `Are you sure you want to delete the testimonial from "${rowName}"?`,
      onConfirm: async () => {
        try { await dispatch(removeTestimonial(rowId)); }
        catch (err) { console.error('Failed to delete testimonial:', err); }
      },
    });
  };

  return (
    <div className="categories-container">
      {/* ── Section Header ── */}
      <div className="section-header">
        <div className="section-title">Testimonials</div>
        {hasPermission('testimonials_create') && (
          <button
            className="action-btn btn-edit"
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          >
            {showForm ? 'Close' : '+ Add Testimonial'}
          </button>
        )}
      </div>

      {/* ── Add / Edit Form ── */}
      {showForm && (
        <div className="km-form-card fade-in">
          <div className="km-form-header">
            <div className="km-form-header-icon">{editingId ? '✎' : 'T'}</div>
            <div>
              <div className="km-form-header-title">
                {editingId ? 'Edit Testimonial' : 'Add New Testimonial'}
              </div>
              <div className="km-form-header-sub">Fill in the details below</div>
            </div>
          </div>

          <div className="km-form-body">
            <form className="km-form-grid" onSubmit={handleSubmit}>

              {/* Author Image */}
              <ImageUploadField
                label="Author Image"
                imageFile={imageFile}
                preview={preview}
                fileInputRef={fileInputRef}
                onFileChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setImageFile(file);
                    validateImageDimensions(file).then((result) => {
                      setImageDimensions(result);
                      if (!result.valid) {
                        setErrors(prev => ({ ...prev, image: result.error }));
                      } else {
                        setErrors(prev => { const n = { ...prev }; delete n.image; return n; });
                      }
                    });
                  }
                }}
                onClear={handleClearImage}
                validation={imageDimensions}
                requirements="300×300px (1:1) • Max: 3MB (Common Image Formats)"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/bmp,image/tiff,image/x-icon,image/heic,image/heif,image/avif"
              />

              {/* Author Name */}
              <div className="km-field">
                <label className="km-label">
                  Author Name <span style={{ color: '#ef4444' }}>*</span>
                  <span className={`km-char-count${errors.name ? ' km-char-count-err' : ''}`}>
                    {name.length}/{LIMITS.name.chars} chars · {countWords(name)}/{LIMITS.name.words} words
                  </span>
                </label>
                <input
                  className={`km-input${errors.name ? ' km-input-error' : ''}`}
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={name}
                  maxLength={LIMITS.name.chars}
                  onChange={(e) => {
                    const val = e.target.value;
                    setName(val);
                    const err = validateField('name', val);
                    setErrors(prev => ({ ...prev, name: err || undefined }));
                  }}
                />
                {errors.name && <div className="km-error-msg">⚠ {errors.name}</div>}
              </div>

              {/* Designation */}
              <div className="km-field">
                <label className="km-label">
                  Designation <span style={{ color: '#ef4444' }}>*</span>
                  <span className={`km-char-count${errors.designation ? ' km-char-count-err' : ''}`}>
                    {designation.length}/{LIMITS.designation.chars} chars · {countWords(designation)}/{LIMITS.designation.words} words
                  </span>
                </label>
                <input
                  className={`km-input${errors.designation ? ' km-input-error' : ''}`}
                  type="text"
                  placeholder="e.g. CEO at TechFlow"
                  value={designation}
                  maxLength={LIMITS.designation.chars}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDesignation(val);
                    const err = validateField('designation', val);
                    setErrors(prev => ({ ...prev, designation: err || undefined }));
                  }}
                />
                {errors.designation && <div className="km-error-msg">⚠ {errors.designation}</div>}
              </div>

              {/* Testimonial Text */}
              <div className="km-field km-field-full">
                <label className="km-label">
                  Testimonial Text <span style={{ color: '#ef4444' }}>*</span>
                  <span className={`km-char-count${errors.text ? ' km-char-count-err' : ''}`}>
                    {text.length}/{LIMITS.text.chars} chars · {countWords(text)}/{LIMITS.text.words} words
                  </span>
                </label>
                <textarea
                  className={`km-input${errors.text ? ' km-input-error' : ''}`}
                  placeholder="Share the client's feedback or success story..."
                  value={text}
                  rows={5}
                  maxLength={LIMITS.text.chars}
                  style={{ resize: 'vertical', minHeight: 120 }}
                  onChange={(e) => {
                    const val = e.target.value;
                    setText(val);
                    const err = validateField('text', val);
                    setErrors(prev => ({ ...prev, text: err || undefined }));
                  }}
                />
                {errors.text && <div className="km-error-msg">⚠ {errors.text}</div>}
              </div>

              {/* Sort Order */}
              <div className="km-field">
                <label className="km-label">Sort Order</label>
                <input
                  className="km-input"
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                />
              </div>

              {/* Status */}
              <div className="km-field">
                <label className="km-label">Status</label>
                <select
                  className="km-input"
                  value={isActive ? 'true' : 'false'}
                  onChange={(e) => setIsActive(e.target.value === 'true')}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              {/* Actions */}
              <div className="km-form-action km-field-full "style={{display : "flex",gap : "10px"}}>
                <button type="submit" className="km-btn-submit">
                  {editingId ? 'Update Testimonial' : 'Save Testimonial'}
                </button>
                <button type="button" className="km-btn-cancel" onClick={resetForm}>
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <p className="km-loading">Loading testimonials...</p>
      ) : (
        <DataTable
          columns={(() => {
            const cols = ['No.', 'Image', 'Name', 'Designation', 'Testimonial', 'Order', 'Status'];
            if (hasPermission('testimonials_edit') || hasPermission('testimonials_delete')) cols.push('Actions');
            return cols;
          })()}
          initialRows={rows}
          renderRow={(row, i) => (
            <tr key={row.id}>
              <td className="td-id">{i + 1}</td>
              <td>
                <div className="img-thumb">
                  {row.image ? (
                    <img
                      src={getImageUrl(row.image)}
                      alt={row.name}
                      width="40" height="40"
                      style={{ borderRadius: 8, objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23eee'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='8' fill='%23999'%3ENo img%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  ) : (
                    <div style={{ width: 40, height: 40, background: '#f3f4f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
                  )}
                </div>
              </td>
              <td><strong>{row.name}</strong></td>
              <td style={{ fontSize: 13, color: '#666' }}>{row.designation}</td>
              <td style={{ fontSize: 13, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.text}
              </td>
              <td>{row.sortOrder}</td>
              <td>
                <span className={`status-pill ${row.isActive ? 'pill-active' : 'pill-inactive'}`}>
                  {row.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              {(hasPermission('testimonials_edit') || hasPermission('testimonials_delete')) && (
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {hasPermission('testimonials_edit') && (
                      <button className="action-btn btn-edit" onClick={() => handleEditClick(row)}>Edit</button>
                    )}
                    {hasPermission('testimonials_delete') && (
                      <button className="action-btn btn-del" onClick={() => handleDelete(row.id, row.name)}>Delete</button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          )}
        />
      )}

      <style>{`
        .km-label-hint {
          font-size: 11px;
          font-weight: 400;
          color: #9ca3af;
          margin-left: 6px;
        }
        .km-char-count {
          font-size: 11px;
          font-weight: 400;
          color: #9ca3af;
          margin-left: 8px;
        }
        .km-char-count-err {
          color: #ef4444;
        }
        .km-error-msg {
          color: #ef4444;
          font-size: 12px;
          margin-top: 6px;
        }
        .km-input-error {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 2px rgba(239,68,68,0.1) !important;
        }
        .upload-grid-wrapper {
          display: flex;
          gap: 16px;
          margin-top: 8px;
          align-items: flex-start;
        }
        .drop-zone-area {
          flex: 1;
          height: 110px;
          border: 2px dashed rgba(0,0,0,0.1);
          background: rgba(0,0,0,0.02);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .drop-zone-area:hover { border-color: #487fff; background: rgba(72,127,255,0.04); }
        .drop-zone-area.active-file { border-color: #45b369; background: rgba(69,179,105,0.05); }
        .drop-zone-area.error-file  { border-color: #ef4444; background: rgba(239,68,68,0.04); }
        .drop-zone-info { text-align: center; }
        .upload-icon { font-size: 20px; margin-bottom: 4px; }
        .upload-text { font-size: 13px; color: #666; margin: 0; }
        .upload-dims { font-size: 11px; color: #9ca3af; margin: 4px 0 0; }
        .dims-ok { color: #45b369; font-weight: 600; }
        .preview-tile {
          width: 110px; height: 110px;
          border-radius: 12px; overflow: hidden;
          position: relative; border: 2px solid #487fff;
          flex-shrink: 0;
        }
        .preview-tile-error { border-color: #ef4444; }
        .preview-tile img { width: 100%; height: 100%; object-fit: cover; }
        .preview-remove {
          position: absolute; top: 5px; right: 5px;
          width: 20px; height: 20px; border-radius: 50%;
          background: rgba(0,0,0,0.7); color: white;
          border: none; cursor: pointer; font-size: 11px;
          display: flex; align-items: center; justify-content: center;
        }
        .pill-active   { background: rgba(69,179,105,0.15); color: #45b369; }
        .pill-inactive { background: rgba(239,68,68,0.15);  color: #ef4444; }
      `}</style>
    </div>
  );
}