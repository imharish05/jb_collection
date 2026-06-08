import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../DataTable/DataTable';
import toast from 'react-hot-toast';
import {
  fetchOfferBanners,
  createOfferBanner,
  editOfferBanner,
  removeOfferBanner,
} from '../../redux/services/timelesstreasuresservice';

const BASE_URL = process.env.REACT_APP_IMG_URL;

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const clean = imagePath.replace(/^\//, '').replace(/^uploads\//, '');
  return `${BASE_URL}/uploads/${clean}`;
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

export default function TimelessTreasures({ showToast }) {
  const dispatch = useDispatch();
  const { items: rows, loading } = useSelector((state) => state.timelessTreasures);

  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [title, setTitle]         = useState('');
  const [off, setOff]             = useState('');
  const [link, setLink]           = useState('/shop');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive]   = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview]     = useState(null);
  const [errors, setErrors]       = useState({});
  const [imageDimensions, setImageDimensions] = useState(null);

  // Title / Badge limits
  const LIMITS = {
    title: { chars: 40, words: 5 },
    off: { chars: 20, words: 3 },
  };

  const countWords = (s) => (s || '').trim().split(/\s+/).filter(Boolean).length;

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

  const fileInputRef = useRef();

  useEffect(() => { dispatch(fetchOfferBanners()); }, [dispatch]);

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
    setTitle('');
    setOff('');
    setLink('/shop');
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
    setTitle(row.title || '');
    setOff(row.off || '');
    setLink(row.link || '/shop');
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

  const handleDelete = async (rowId, rowTitle) => {
    const confirmId = showToast.loading('Delete this banner?');
    toast(
      (t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span>Are you sure you want to delete <b>"{rowTitle}"</b>?</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
            <button
              style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}
              onClick={async () => {
                toast.dismiss(t.id);
                const toastId = showToast.loading('Deleting banner...');
                try {
                  await dispatch(removeOfferBanner(rowId));
                  showToast.success('Banner deleted', toastId);
                } catch (err) {
                  showToast.error(err?.response?.data?.message || 'Failed to delete', toastId);
                }
              }}
            >
              Yes, Delete
            </button>
            <button
              style={{ background: '#444', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { id: confirmId, duration: Infinity }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    
    if (!title.trim()) newErrors.title = 'Title is required';
    else {
      const titleErr = validateField('title', title);
      if (titleErr) newErrors.title = titleErr;
    }
    
    if (!editingId && !imageFile) newErrors.image = 'Banner image is required';
    
    // Validate image dimensions if new image is selected
    if (imageFile && imageDimensions && !imageDimensions.valid) {
      newErrors.image = imageDimensions.error;
    }
    
    // off is optional but validate if present
    if (off.trim()) {
      const offErr = validateField('off', off);
      if (offErr) newErrors.off = offErr;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast.error(Object.values(newErrors)[0]);
      return;
    }
    
    setErrors({});

    const fd = new FormData();
    fd.append('title', title);
    fd.append('off', off);
    fd.append('link', link);
    fd.append('sortOrder', sortOrder);
    fd.append('isActive', isActive);
    if (imageFile) fd.append('image', imageFile);

    const toastId = showToast.loading(editingId ? 'Updating banner...' : 'Adding banner...');
    try {
      if (editingId) {
        await dispatch(editOfferBanner({ id: editingId, formData: fd }));
        showToast.success('Banner updated!', toastId);
      } else {
        await dispatch(createOfferBanner(fd));
        showToast.success('Banner added!', toastId);
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
        <div className="section-title">Timeless Treasures Banners</div>
        <button
          className="action-btn btn-edit"
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
        >
          {showForm ? 'Close' : '+ Add Banner'}
        </button>
      </div>

      {/* ── Add / Edit Form ── */}
      {showForm && (
        <div className="km-form-card fade-in">
          <div className="km-form-header">
            <div className="km-form-header-icon">{editingId ? '✎' : 'B'}</div>
            <div>
              <div className="km-form-header-title">
                {editingId ? 'Edit Banner' : 'Add New Banner'}
              </div>
              <div className="km-form-header-sub">Fill in the details below</div>
            </div>
          </div>

          <div className="km-form-body">
            <form className="km-form-grid" onSubmit={handleSubmit}>

              {/* Image upload — full width */}
              <div className="km-field km-field-full">
                <label className="km-label">
                  Banner Image {!editingId && <span style={{ color: '#ef4444' }}>*</span>}
                  <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>
                    {BANNER_DIMENSIONS.recommended.width}×{BANNER_DIMENSIONS.recommended.height}px (16:9) • Min: {BANNER_DIMENSIONS.minimum.width}×{BANNER_DIMENSIONS.minimum.height}px
                  </span>
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
                          : <>Click to <b>browse</b>image</>}
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
                {errors.title && (
                  <div style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>
                    ⚠ {errors.title}
                  </div>
                )}
                
                {/* Image Error Message */}
                {errors.image && (
                  <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>
                    ⚠ {errors.image}
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="km-field km-field-half">
                <label className="km-label">
                  Title <span style={{ color: '#ef4444' }}>*</span>
                  <span style={{ fontSize: 11, color: errors.title ? '#ef4444' : '#9ca3af', marginLeft: 8 }}>
                    {title.length}/{LIMITS.title.chars} chars · {countWords(title)}/{LIMITS.title.words} words
                  </span>
                </label>
                <input
                  className="km-input"
                  type="text"
                  placeholder="e.g. Divine Decor"
                  value={title}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTitle(val);
                    const err = validateField('title', val);
                    setErrors(prev => ({ ...prev, title: err }));
                  }}
                  style={{
                    borderColor: errors.title ? '#ef4444' : undefined,
                    boxShadow: errors.title ? '0 0 0 2px rgba(239, 68, 68, 0.1)' : undefined,
                  }}
                  maxLength={LIMITS.title.chars}
                />
                {errors.title && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ {errors.title}</div>}
              </div>

              {/* Badge/Tag */}
              <div className="km-field km-field-half">
                <label className="km-label">
                  Badge / Tag <span style={{ color: '#9ca3af', fontSize: 11 }}>(e.g. NEW ARRIVAL, TRENDING)</span>
                  <span style={{ fontSize: 11, color: errors.off ? '#ef4444' : '#9ca3af', marginLeft: 8 }}>
                    {off.length}/{LIMITS.off.chars} chars · {countWords(off)}/{LIMITS.off.words} words
                  </span>
                </label>
                <input
                  className="km-input"
                  type="text"
                  placeholder="TRENDING"
                  value={off}
                  onChange={(e) => {
                    const val = e.target.value;
                    setOff(val);
                    const err = validateField('off', val);
                    setErrors(prev => ({ ...prev, off: err }));
                  }}
                  style={{
                    borderColor: errors.off ? '#ef4444' : undefined,
                    boxShadow: errors.off ? '0 0 0 2px rgba(239, 68, 68, 0.1)' : undefined,
                  }}
                  maxLength={LIMITS.off.chars}
                />
                {errors.off && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ {errors.off}</div>}
              </div>

              {/* Link */}
              <div className="km-field km-field-half">
                <label className="km-label">Shop Link URL</label>
                <input
                  className="km-input"
                  type="text"
                  placeholder="/shop"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
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
                  id="ttActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <label htmlFor="ttActive" className="km-label" style={{ marginBottom: 0, cursor: 'pointer' }}>Active</label>
              </div>

              {/* Actions */}
              <div className="km-form-actions">
                <button type="submit" className="km-btn-submit">
                  {editingId ? 'Update Banner' : 'Save Banner'}
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
        <p className="km-loading">Loading banners...</p>
      ) : (
        <DataTable
          columns={['No.', 'Image', 'Title', 'Badge/Tag', 'Link', 'Order', 'Status', 'Actions']}
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
                      width="60" height="60"
                      style={{ borderRadius: 8, objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect width='60' height='60' fill='%23eee'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='8' fill='%23999'%3ENo Img%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  ) : '🖼️'}
                </div>
              </td>
              <td>{row.title}</td>
              <td>
                {row.off
                  ? <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{row.off}</span>
                  : <span style={{ color: '#9ca3af' }}>—</span>}
              </td>
              <td><code style={{ fontSize: 12, opacity: 0.7 }}>{row.link}</code></td>
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
