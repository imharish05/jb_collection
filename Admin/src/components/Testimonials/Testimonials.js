import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../DataTable/DataTable';
import {
  fetchTestimonials,
  createTestimonial,
  editTestimonial,
  removeTestimonial,
} from '../../redux/services/testimonialsService';
import { confirmDelete } from '../../utils/sweetalert';

const BASE_URL = process.env.REACT_APP_IMG_URL;

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const clean = imagePath.replace(/^\//, '').replace(/^uploads\//, '');
  return `${BASE_URL}/uploads/${clean}`;
};
// Helper: Count words in text
const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;

// Helper: Get word/char limits
const LIMITS = {
  name: { chars: 60, words: 6 },
  designation: { chars: 80, words: 8 },
  text: { chars: 350, words: 60 },
};

// Image Dimension Validator for Testimonials (300×300px square)
const TESTIMONIAL_DIMENSIONS = {
  recommended: { width: 300, height: 300 },
  minimum: { width: 120, height: 120 },
  aspectRatio: 1 / 1,
  tolerance: 0.05,
};

const validateImageDimensions = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        const actualRatio = width / height;
        const expectedRatio = TESTIMONIAL_DIMENSIONS.aspectRatio;
        const ratioDiff = Math.abs(actualRatio - expectedRatio) / expectedRatio;

        // Check minimum dimensions
        if (width < TESTIMONIAL_DIMENSIONS.minimum.width || height < TESTIMONIAL_DIMENSIONS.minimum.height) {
          resolve({
            valid: false,
            error: `Image too small. Minimum: ${TESTIMONIAL_DIMENSIONS.minimum.width}×${TESTIMONIAL_DIMENSIONS.minimum.height}px. You have: ${width}×${height}px`,
            dimensions: { width, height },
          });
          return;
        }

        // Check aspect ratio (1:1)
        if (ratioDiff > TESTIMONIAL_DIMENSIONS.tolerance) {
          const recommendedHeight = Math.round(width / expectedRatio);
          resolve({
            valid: false,
            error: `Incorrect aspect ratio. Use 1:1 square (e.g., ${width}×${recommendedHeight}px or ${TESTIMONIAL_DIMENSIONS.recommended.width}×${TESTIMONIAL_DIMENSIONS.recommended.height}px). Yours: ${width}×${height}px`,
            dimensions: { width, height },
          });
          return;
        }

        resolve({
          valid: true,
          dimensions: { width, height },
          isRecommended: width === TESTIMONIAL_DIMENSIONS.recommended.width && height === TESTIMONIAL_DIMENSIONS.recommended.height,
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// Validate text length and word count
const validateField = (field, value) => {
  const limits = LIMITS[field];
  if (!limits) return null;
  
  const charCount = value.length;
  const wordCount = countWords(value);
  
  if (charCount > limits.chars) return `Max ${limits.chars} characters (you have ${charCount})`;
  if (wordCount > limits.words) return `Max ${limits.words} words (you have ${wordCount})`;
  return null;
};
export default function Testimonials({ showToast }) {
  const dispatch = useDispatch();
  const { items: rows, loading } = useSelector((state) => state.testimonials);

  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [name, setName]             = useState('');
  const [designation, setDesignation] = useState('');
  const [text, setText]             = useState('');
  const [sortOrder, setSortOrder]   = useState(0);
  const [isActive, setIsActive]     = useState(true);
  const [imageFile, setImageFile]   = useState(null);
  const [preview, setPreview]       = useState(null);
  const [errors, setErrors]         = useState({});
  const [imageDimensions, setImageDimensions] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => { dispatch(fetchTestimonials()); }, [dispatch]);

  useEffect(() => {
    if (imageFile) {
      const objUrl = URL.createObjectURL(imageFile);
      setPreview(objUrl);
      return () => URL.revokeObjectURL(objUrl);
    }
  }, [imageFile]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setDesignation('');
    setText('');
    setSortOrder(0);
    setIsActive(true);
    setImageFile(null);
    setPreview(null);
    setErrors({});
    setImageDimensions(null);
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
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearImage = () => {
    setImageFile(null);
    const original = editingId ? rows.find((r) => r.id === editingId) : null;
    setPreview(original?.image ? getImageUrl(original.image) : null);
    setImageDimensions(null);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.image;
      return newErrors;
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (rowId, rowName) => {
    confirmDelete({
      title: 'Delete Testimonial?',
      message: `Are you sure you want to delete the testimonial from "${rowName}"?`,
      onConfirm: async () => {
        try {
          await dispatch(removeTestimonial(rowId));
        } catch (err) {
          console.error('Failed to delete testimonial:', err);
        }
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    
    if (!name.trim()) newErrors.name = 'Name is required';
    else {
      const nameErr = validateField('name', name);
      if (nameErr) newErrors.name = nameErr;
    }
    
    if (!designation.trim()) newErrors.designation = 'Designation is required';
    else {
      const designErr = validateField('designation', designation);
      if (designErr) newErrors.designation = designErr;
    }
    
    if (!text.trim()) newErrors.text = 'Testimonial text is required';
    else {
      const textErr = validateField('text', text);
      if (textErr) newErrors.text = textErr;
    }
    
    if (!editingId && !imageFile) newErrors.image = 'Image is required';
    
    // Validate image dimensions if new image is selected
    if (imageFile && imageDimensions && !imageDimensions.valid) {
      newErrors.image = imageDimensions.error;
    }
    
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

  return (
    <div className="tt-container">
      {/* ── Section Header ── */}
      <div className="section-header">
        <div className="section-title">Testimonials (Client Success Stories)</div>
        <button
          className="action-btn btn-edit"
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
        >
          {showForm ? 'Close' : '+ Add Testimonial'}
        </button>
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

              {/* Image upload — full width */}
              <div className="km-field km-field-full">
                <label className="km-label">
                  Author Image {!editingId && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                <div className="upload-grid-wrapper">
                  <div
                    className={`drop-zone-area ${imageFile ? 'active-file' : ''}`}
                    onClick={() => fileInputRef.current.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setImageFile(file);
                          // Validate dimensions asynchronously
                          validateImageDimensions(file).then((result) => {
                            setImageDimensions(result);
                            if (!result.valid) {
                              setErrors(prev => ({ ...prev, image: result.error }));
                            } else {
                              setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.image;
                                return newErrors;
                              });
                            }
                          });
                        }
                      }}
                    />
                    <div className="drop-zone-info">
                      <div className="upload-icon">{imageFile ? '✅' : '📸'}</div>
                      <p className="upload-text">
                        {imageFile
                          ? <b>{imageFile.name}</b>
                          : <>Click to <b>browse</b> or drag image</>}
                      </p>
                    </div>
                  </div>
                  {preview && (
                    <div className="preview-tile fade-in">
                      <img src={preview} alt="Preview" />
                      <button type="button" className="preview-remove" onClick={handleClearImage}>✕</button>
                    </div>
                  )}
                </div>
                
                {/* Image Error Message */}
                {errors.image && (
                  <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>
                    ⚠ {errors.image}
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="km-field km-field-half">
                <label className="km-label">
                  Author Name <span style={{ color: '#ef4444' }}>*</span>
                  <span style={{ fontSize: 11, color: errors.name ? '#ef4444' : '#9ca3af', marginLeft: 8 }}>
                    {name.length}/{LIMITS.name.chars} chars · {countWords(name)}/{LIMITS.name.words} words
                  </span>
                </label>
                <input
                  className="km-input"
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setName(val);
                    const err = validateField('name', val);
                    setErrors(prev => ({ ...prev, name: err }));
                  }}
                  style={{
                    borderColor: errors.name ? '#ef4444' : undefined,
                    boxShadow: errors.name ? '0 0 0 2px rgba(239, 68, 68, 0.1)' : undefined,
                  }}
                  maxLength={LIMITS.name.chars}
                />
                {errors.name && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ {errors.name}</div>}
              </div>

              {/* Designation */}
              <div className="km-field km-field-half">
                <label className="km-label">
                  Designation <span style={{ color: '#ef4444' }}>*</span>
                  <span style={{ fontSize: 11, color: errors.designation ? '#ef4444' : '#9ca3af', marginLeft: 8 }}>
                    {designation.length}/{LIMITS.designation.chars} chars · {countWords(designation)}/{LIMITS.designation.words} words
                  </span>
                </label>
                <input
                  className="km-input"
                  type="text"
                  placeholder="e.g. CEO at TechFlow"
                  value={designation}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDesignation(val);
                    const err = validateField('designation', val);
                    setErrors(prev => ({ ...prev, designation: err }));
                  }}
                  style={{
                    borderColor: errors.designation ? '#ef4444' : undefined,
                    boxShadow: errors.designation ? '0 0 0 2px rgba(239, 68, 68, 0.1)' : undefined,
                  }}
                  maxLength={LIMITS.designation.chars}
                />
                {errors.designation && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ {errors.designation}</div>}
              </div>

              {/* Testimonial Text */}
              <div className="km-field km-field-full">
                <label className="km-label">
                  Testimonial Text <span style={{ color: '#ef4444' }}>*</span>
                  <span style={{ fontSize: 11, color: errors.text ? '#ef4444' : '#9ca3af', marginLeft: 8 }}>
                    {text.length}/{LIMITS.text.chars} chars · {countWords(text)}/{LIMITS.text.words} words
                  </span>
                </label>
                <textarea
                  className="km-input"
                  placeholder="Share the client's feedback or success story..."
                  value={text}
                  onChange={(e) => {
                    const val = e.target.value;
                    setText(val);
                    const err = validateField('text', val);
                    setErrors(prev => ({ ...prev, text: err }));
                  }}
                  rows={5}
                  style={{ resize: 'vertical', minHeight: 120, borderColor: errors.text ? '#ef4444' : undefined, boxShadow: errors.text ? '0 0 0 2px rgba(239, 68, 68, 0.1)' : undefined }}
                  maxLength={LIMITS.text.chars}
                />
                {errors.text && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ {errors.text}</div>}
              </div>

              {/* Sort Order */}
              <div className="km-field km-field-half">
                <label className="km-label">Sort Order</label>
                <input
                  className="km-input"
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                />
              </div>

              {/* Active toggle */}
              <div className="km-field km-field-half" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 6 }}>
                <input
                  type="checkbox"
                  id="testActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <label htmlFor="testActive" className="km-label" style={{ marginBottom: 0, cursor: 'pointer' }}>Active</label>
              </div>

              {/* Actions */}
              <div className="km-form-actions">
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
          columns={['No.', 'Image', 'Name', 'Designation', 'Testimonial', 'Order', 'Status', 'Actions']}
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
                      width="90" height="54"
                      style={{ borderRadius: 6, objectFit: 'cover' }}
                      onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                    />
                  ) : (
                    <div style={{ width: 90, height: 54, background: '#f0f0f0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 12 }}>
                      No image
                    </div>
                  )}
                </div>
              </td>
              <td>
                <strong>{row.name}</strong>
              </td>
              <td style={{ fontSize: 13, color: '#666' }}>{row.designation}</td>
              <td style={{ fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.text}
              </td>
              <td className="td-center">{row.sortOrder}</td>
              <td className="td-center">
                <span className={`status ${row.isActive ? 'active' : 'inactive'}`}>
                  {row.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="td-center">
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="action-btn btn-edit" onClick={() => handleEditClick(row)}>Edit</button>
                  <button className="action-btn btn-del" onClick={() => handleDelete(row.id, row.name)}>Delete</button>
                </div>
              </td>
            </tr>
          )}
        />
      )}

      <style>{`
        .tt-container {
          padding: 20px;
          background: #fff;
          border-radius: 8px;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f0f0f0;
        }
        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a1a;
        }
        .km-form-card {
          background: #fafafa;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          border: 1px solid #f0f0f0;
        }
        .km-form-header {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          align-items: flex-start;
        }
        .km-form-header-icon {
          width: 40px;
          height: 40px;
          background: #487fff;
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: bold;
          flex-shrink: 0;
        }
        .km-form-header-title {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 4px;
        }
        .km-form-header-sub {
          font-size: 13px;
          color: #999;
        }
        .km-form-body {
          background: white;
          border-radius: 8px;
          padding: 16px;
        }
        .km-form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .km-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .km-field-full {
          grid-column: span 2;
        }
        .km-field-half {
          grid-column: span 1;
        }
        .km-label {
          font-size: 13px;
          font-weight: 600;
          color: #333;
          margin-bottom: 2px;
        }
        .km-input {
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 13px;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        .km-input:focus {
          outline: none;
          border-color: #487fff;
          box-shadow: 0 0 0 3px rgba(72, 127, 255, 0.1);
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
        .img-thumb {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .img-thumb img {
          max-width: 90px;
          max-height: 54px;
        }
        .td-id {
          font-weight: 600;
          color: #487fff;
        }
        .td-center {
          text-align: center;
        }
        .status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          display: inline-block;
        }
        .status.active {
          background: rgba(69, 179, 105, 0.15);
          color: #45b369;
        }
        .status.inactive {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }
        .km-loading {
          text-align: center;
          padding: 40px 20px;
          color: #999;
          font-size: 14px;
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
