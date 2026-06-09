import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../DataTable/DataTable';
import ImageUploadField from '../ImageUploadField';
import {
  fetchHeroSlides,
  createHeroSlide,
  editHeroSlide,
  removeHeroSlide,
} from '../../redux/services/herosliderservice';
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
  title: { chars: 50, words: 8 },
  subtitle: { chars: 60, words: 10 },
};

// Banner Image Dimension Validator
const BANNER_DIMENSIONS = {
  recommended: { width: 1920, height: 1080 },
  minimum: { width: 1280, height: 720 },
  aspectRatio: 16 / 9,
  tolerance: 0.05, // 5% tolerance for aspect ratio
};

const validateImageDimensions = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        const actualRatio = width / height;
        const expectedRatio = BANNER_DIMENSIONS.aspectRatio;
        const ratioDiff = Math.abs(actualRatio - expectedRatio) / expectedRatio;

        // Check minimum dimensions
        if (width < BANNER_DIMENSIONS.minimum.width || height < BANNER_DIMENSIONS.minimum.height) {
          resolve({
            valid: false,
            error: `Image too small. Minimum: ${BANNER_DIMENSIONS.minimum.width}×${BANNER_DIMENSIONS.minimum.height}px. You have: ${width}×${height}px`,
            dimensions: { width, height },
          });
          return;
        }

        // Check aspect ratio
        if (ratioDiff > BANNER_DIMENSIONS.tolerance) {
          const recommendedHeight = Math.round(width / expectedRatio);
          resolve({
            valid: false,
            error: `Incorrect aspect ratio. Use 16:9 (e.g., ${width}×${recommendedHeight}px or ${BANNER_DIMENSIONS.recommended.width}×${BANNER_DIMENSIONS.recommended.height}px). Yours: ${width}×${height}px`,
            dimensions: { width, height },
          });
          return;
        }

        resolve({
          valid: true,
          dimensions: { width, height },
          isRecommended: width === BANNER_DIMENSIONS.recommended.width && height === BANNER_DIMENSIONS.recommended.height,
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

export default function HeroSlider({ showToast }) {
  const dispatch = useDispatch();
  const { items: rows, loading } = useSelector((state) => state.heroSlider);

  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [title, setTitle]           = useState('');
  const [subtitle, setSubtitle]     = useState('');
  const [url, setUrl]               = useState('/shop');
  const [sortOrder, setSortOrder]   = useState(0);
  const [isActive, setIsActive]     = useState(true);
  const [imageFile, setImageFile]   = useState(null);
  const [preview, setPreview]       = useState(null);
  const [errors, setErrors]         = useState({});
  const [imageDimensions, setImageDimensions] = useState(null);
  const fileInputRef = useRef();

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

  useEffect(() => { dispatch(fetchHeroSlides()); }, [dispatch]);

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
    setTitle(''); setSubtitle(''); setUrl('/shop');
    setSortOrder(0); setIsActive(true);
    setImageFile(null); setPreview(null);
    setErrors({});
    setImageDimensions(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEditClick = (row) => {
    setEditingId(row.id);
    setTitle(row.title || '');
    setSubtitle(row.subtitle || '');
    setUrl(row.url || '/shop');
    setSortOrder(row.sortOrder ?? 0);
    setIsActive(row.isActive ?? true);
    setImageFile(null);
    setPreview(row.image ? getImageUrl(row.image) : null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearImage = () => {
    setImageFile(null);
    setPreview(null);
    setImageDimensions(null);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.image;
      return newErrors;
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (rowId, rowTitle) => {
    confirmDelete({
      title: 'Delete Slide?',
      message: `Are you sure you want to delete "${rowTitle}"?`,
      onConfirm: async () => {
        try {
          await dispatch(removeHeroSlide(rowId));
        } catch (err) {
          console.error('Failed to delete slide:', err);
        }
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate title
    const titleError = validateField('title', title);
    const subtitleError = validateField('subtitle', subtitle);
    
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    else if (titleError) newErrors.title = titleError;
    
    if (subtitleError) newErrors.subtitle = subtitleError;
    
    if (!imageFile && !preview) newErrors.image = 'Slide image is required';
    
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
    fd.append('title', title);
    fd.append('subtitle', subtitle);
    fd.append('url', url);
    fd.append('sortOrder', sortOrder);
    fd.append('isActive', isActive);
    if (imageFile) fd.append('image', imageFile);

    const toastId = showToast.loading(editingId ? 'Updating slide...' : 'Adding slide...');
    try {
      if (editingId) {
        await dispatch(editHeroSlide({ id: editingId, formData: fd }));
        showToast.success('Slide updated!', toastId);
      } else {
        await dispatch(createHeroSlide(fd));
        showToast.success('Slide added!', toastId);
      }
      resetForm();
    } catch {
      showToast.error('Something went wrong', toastId);
    }
  };

  return (
    <div className="tt-container">
      {/* ── Section Header ── */}
      <div className="section-header">
        <div className="section-title">Hero Slider</div>
        <button
          className="action-btn btn-edit"
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
        >
          {showForm ? 'Close' : '+ Add Slide'}
        </button>
      </div>

      {/* ── Add / Edit Form ── */}
      {showForm && (
        <div className="km-form-card fade-in">
          <div className="km-form-header">
            <div className="km-form-header-icon">{editingId ? '✎' : 'S'}</div>
            <div>
              <div className="km-form-header-title">
                {editingId ? 'Edit Slide' : 'Add New Slide'}
              </div>
              <div className="km-form-header-sub">Fill in the details below</div>
            </div>
          </div>

          <div className="km-form-body">
            <form className="km-form-grid" onSubmit={handleSubmit}>

              {/* Image upload — full width */}
              <ImageUploadField
                label="Slide Image"
                imageFile={imageFile}
                preview={preview}
                fileInputRef={fileInputRef}
                onFileChange={(e) => {
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
                onClear={handleClearImage}
                validation={imageDimensions}
                requirements={`${BANNER_DIMENSIONS.recommended.width}×${BANNER_DIMENSIONS.recommended.height}px (16:9) • Min: ${BANNER_DIMENSIONS.minimum.width}×${BANNER_DIMENSIONS.minimum.height}px • Max: 3MB`}
              />

              {/* Title */}
              <div className="km-field km-field-half">
                <label className="km-label">
                  Title <span style={{ color: '#ef4444' }}>*</span>
                  <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>
                    {title.length}/{LIMITS.title.chars} chars · {countWords(title)}/{LIMITS.title.words} words
                  </span>
                </label>
                <input
                  className="km-input"
                  type="text"
                  placeholder="e.g. Perfect Gifts for Every Celebration"
                  value={title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setTitle(newTitle);
                    const error = validateField('title', newTitle);
                    setErrors(prev => ({ ...prev, title: error }));
                  }}
                  style={{
                    borderColor: errors.title ? '#ef4444' : undefined,
                    boxShadow: errors.title ? '0 0 0 2px rgba(239, 68, 68, 0.1)' : undefined,
                  }}
                  maxLength={LIMITS.title.chars}
                />
                {errors.title && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ {errors.title}</div>}
              </div>

              {/* Subtitle */}
              <div className="km-field km-field-half">
                <label className="km-label">
                  Subtitle <span style={{ color: '#9ca3af', fontSize: 11 }}>(supports HTML)</span>
                  <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>
                    {subtitle.length}/{LIMITS.subtitle.chars} chars · {countWords(subtitle)}/{LIMITS.subtitle.words} words
                  </span>
                </label>
                <input
                  className="km-input"
                  type="text"
                  placeholder="e.g. Handcrafted &amp; Meaningful"
                  value={subtitle}
                  onChange={(e) => {
                    const newSubtitle = e.target.value;
                    setSubtitle(newSubtitle);
                    const error = validateField('subtitle', newSubtitle);
                    setErrors(prev => ({ ...prev, subtitle: error }));
                  }}
                  style={{
                    borderColor: errors.subtitle ? '#ef4444' : undefined,
                    boxShadow: errors.subtitle ? '0 0 0 2px rgba(239, 68, 68, 0.1)' : undefined,
                  }}
                  maxLength={LIMITS.subtitle.chars}
                />
                {errors.subtitle && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ {errors.subtitle}</div>}
              </div>

              {/* CTA Link */}
              <div className="km-field km-field-half">
                <label className="km-label">CTA Link URL</label>
                <input
                  className="km-input"
                  type="text"
                  placeholder="/shop"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
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
                  id="heroActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <label htmlFor="heroActive" className="km-label" style={{ marginBottom: 0, cursor: 'pointer' }}>Active</label>
              </div>

              {/* Actions */}
              <div className="km-form-actions">
                <button type="submit" className="km-btn-submit">
                  {editingId ? 'Update Slide' : 'Save Slide'}
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
        <p className="km-loading">Loading slides...</p>
      ) : (
        <DataTable
          columns={['No.', 'Image', 'Title', 'Subtitle', 'URL', 'Order', 'Status', 'Actions']}
          initialRows={rows}
          renderRow={(row, i) => (
            <tr key={row.id}>
              <td className="td-id">{i + 1}</td>
              <td>
                <div className="img-thumb">
                  {row.image ? (
                    <img
                      src={getImageUrl(row.image)}
                      alt={row.title}
                      width="90" height="54"
                      style={{ borderRadius: 6, objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='54'%3E%3Crect width='90' height='54' fill='%23eee'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='8' fill='%23999'%3ENo Img%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  ) : '🖼️'}
                </div>
              </td>
              <td>{row.title}</td>
              <td>{row.subtitle || <span style={{ color: '#9ca3af' }}>—</span>}</td>
              <td><code style={{ fontSize: 12, opacity: 0.7 }}>{row.url}</code></td>
              <td>{row.sortOrder}</td>
              <td>
                <span style={{ color: row.isActive ? '#45b369' : '#ef4444', fontWeight: 600 }}>
                  {row.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="action-btn btn-edit" onClick={() => handleEditClick(row)}>Edit</button>
                  <button className="action-btn btn-del" onClick={() => handleDelete(row.id, row.title)}>Delete</button>
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
