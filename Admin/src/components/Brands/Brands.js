import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../DataTable/DataTable';
import { fetchBrands, createBrand, editBrand, removeBrand } from '../../redux/services/brandsService';
import { confirmDelete } from '../../utils/sweetalert';

const BASE_URL = process.env.REACT_APP_IMG_URL;

// ── Brand Logo Image Validator ───────────────────────────────────────────────
const BRAND_LOGO_CONFIG = {
  recommended: { width: 300, height: 120 },
  minimum: { width: 80, height: 40 },
  maxFileSize: 2 * 1024 * 1024, // 2MB
  formats: ['image/jpeg', 'image/png', 'image/webp'],
};

const validateBrandLogo = (file) => {
  return new Promise((resolve) => {
    // Check file size
    if (file.size > BRAND_LOGO_CONFIG.maxFileSize) {
      resolve({
        valid: false,
        error: `File too large. Max: 2MB. You have: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      });
      return;
    }

    // Check file format
    if (!BRAND_LOGO_CONFIG.formats.includes(file.type)) {
      resolve({
        valid: false,
        error: `Invalid format. Use JPG, PNG or WebP. You uploaded: ${file.type || 'unknown'}`,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;

        // Check minimum dimensions
        if (width < BRAND_LOGO_CONFIG.minimum.width || height < BRAND_LOGO_CONFIG.minimum.height) {
          resolve({
            valid: false,
            error: `Image too small. Minimum: ${BRAND_LOGO_CONFIG.minimum.width}×${BRAND_LOGO_CONFIG.minimum.height}px. You have: ${width}×${height}px`,
            dimensions: { width, height },
          });
          return;
        }

        resolve({
          valid: true,
          dimensions: { width, height },
          isRecommended:
            width === BRAND_LOGO_CONFIG.recommended.width &&
            height === BRAND_LOGO_CONFIG.recommended.height,
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const filename = imagePath.replace(/^\//, '').replace(/^uploads\//, '');
  return `${BASE_URL}/uploads/${filename}`;
};

export default function Brands({ showToast }) {
  const dispatch = useDispatch();
  const { items: rows, loading } = useSelector(state => state.brands);

  const [showForm, setShowForm]           = useState(false);
  const [editingId, setEditingId]         = useState(null);
  const [brandName, setBrandName]         = useState('');
  const [isActive, setIsActive]           = useState(true);
  const [logoFile, setLogoFile]           = useState(null);
  const [preview, setPreview]             = useState(null);
  const [errors, setErrors]               = useState({});
  const [logoDimensions, setLogoDimensions] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => { dispatch(fetchBrands()); }, [dispatch]);

  useEffect(() => {
    if (logoFile) {
      const url = URL.createObjectURL(logoFile);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [logoFile]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setBrandName('');
    setIsActive(true);
    setLogoFile(null);
    setPreview(null);
    setErrors({});
    setLogoDimensions(null);
  };

  const handleEditClick = (row) => {
    setEditingId(row.id);
    setBrandName(row.name || '');
    setIsActive(row.isActive ?? true);
    setLogoFile(null);
    setPreview(row.logo ? getImageUrl(row.logo) : null);
    setErrors({});
    setLogoDimensions(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearImage = () => {
    setLogoFile(null);
    setLogoDimensions(null);
    setErrors(prev => { const e = { ...prev }; delete e.logo; return e; });
    const original = editingId ? rows.find(r => r.id === editingId) : null;
    setPreview(original?.logo ? getImageUrl(original.logo) : null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!brandName.trim()) newErrors.brandName = 'Brand name is required';
    if (!editingId && !logoFile) newErrors.logo = 'Brand logo is required';
    if (logoFile && logoDimensions && !logoDimensions.valid) {
      newErrors.logo = logoDimensions.error;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast.error(Object.values(newErrors)[0]);
      return;
    }

    const data = new FormData();
    data.append('name', brandName.trim());
    data.append('isActive', isActive);
    if (logoFile) data.append('logo', logoFile);

    const toastId = showToast.loading(editingId ? 'Updating brand...' : 'Adding brand...');
    try {
      if (editingId) {
        await dispatch(editBrand({ id: editingId, formData: data }));
        showToast.success('Brand updated!', toastId);
      } else {
        await dispatch(createBrand(data));
        showToast.success('Brand added!', toastId);
      }
      resetForm();
      dispatch(fetchBrands());
    } catch (err) {
      showToast.error(err?.response?.data?.message || err?.message || 'Operation failed', toastId);
    }
  };

  const handleDelete = (brandId) => {
    confirmDelete({
      title: 'Delete Brand?',
      message: 'Are you sure you want to delete this brand?',
      onConfirm: async () => {
        try {
          await dispatch(removeBrand(brandId));
        } catch (err) {
          console.error('Failed to delete brand:', err);
        }
      },
    });
  };

  return (
    <div className="categories-container">
      <div className="section-header">
        <div className="section-title">Brands</div>
        <button className="action-btn btn-edit"
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}>
          {showForm ? 'Close' : '+ Add Brand'}
        </button>
      </div>

      {showForm && (
        <div className="km-form-card fade-in">
          <div className="km-form-header">
            <div className="km-form-header-icon">{editingId ? '✎' : 'B'}</div>
            <div>
              <div className="km-form-header-title">{editingId ? 'Edit Brand' : 'Add New Brand'}</div>
              <div className="km-form-header-sub">Fill in the details below</div>
            </div>
          </div>

          <div className="km-form-body">
            <form className="km-form-grid" onSubmit={handleSubmit}>

              {/* Brand Name */}
              <div className="km-field km-field-full">
                <label className="km-label">Brand Name</label>
                <input
                  className={`km-input${errors.brandName ? ' km-input-error' : ''}`}
                  type="text"
                  placeholder="e.g. Gillette"
                  value={brandName}
                  onChange={e => {
                    setBrandName(e.target.value);
                    if (e.target.value.trim()) {
                      setErrors(prev => { const n = { ...prev }; delete n.brandName; return n; });
                    }
                  }}
                />
                {errors.brandName && (
                  <div className="km-error-msg">⚠ {errors.brandName}</div>
                )}
              </div>

              {/* Brand Logo */}
              <div className="km-field km-field-full">
                <label className="km-label">
                  Brand Logo&nbsp;
                  <span className="km-label-hint">
                    Recommended: 300×120px • Min: 80×40px • Max: 2MB (JPG / PNG / WebP)
                  </span>
                </label>
                <div className="upload-grid-wrapper">
                  <div
                    className={`drop-zone-area ${logoFile ? (logoDimensions?.valid === false ? 'error-file' : 'active-file') : ''}`}
                    onClick={() => fileInputRef.current.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setLogoFile(file);
                          validateBrandLogo(file).then((result) => {
                            setLogoDimensions(result);
                            if (!result.valid) {
                              setErrors(prev => ({ ...prev, logo: result.error }));
                            } else {
                              setErrors(prev => {
                                const n = { ...prev };
                                delete n.logo;
                                return n;
                              });
                            }
                          });
                        }
                      }}
                    />
                    <div className="drop-zone-info">
                      <div className="upload-icon text-center">
                        {logoFile
                          ? (logoDimensions?.valid === false ? '❌' : '✅')
                          : '📸'}
                      </div>
                      <p className="upload-text">
                        {logoFile
                          ? <b>{logoFile.name}</b>
                          : <>Click to <b>browse</b> or drag logo</>}
                      </p>
                      {logoFile && logoDimensions?.valid && logoDimensions.dimensions && (
                        <p className="upload-dims">
                          {logoDimensions.dimensions.width}×{logoDimensions.dimensions.height}px
                          {logoDimensions.isRecommended && <span className="dims-ok"> ✓ Recommended size</span>}
                        </p>
                      )}
                    </div>
                  </div>

                  {preview && (
                    <div className={`preview-tile fade-in${logoDimensions?.valid === false ? ' preview-tile-error' : ''}`}>
                      <img src={preview} alt="Preview" />
                      <button type="button" className="preview-remove" onClick={handleClearImage}>✕</button>
                    </div>
                  )}
                </div>

                {/* Logo error message */}
                {errors.logo && (
                  <div className="km-error-msg">⚠ {errors.logo}</div>
                )}
              </div>

              {/* Status */}
              <div className="km-field km-field-full">
                <label className="km-label">Status</label>
                <select
                  className="km-input"
                  value={isActive ? 'true' : 'false'}
                  onChange={e => setIsActive(e.target.value === 'true')}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              {/* Form Actions */}
              <div className="km-form-actions" style={{ display: 'flex' }}>
                <button type="submit" className="km-btn-submit">
                  {editingId ? 'Update Brand' : 'Save Brand'}
                </button>
                <button type="button" className="km-btn-cancel" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="km-loading">Loading brands...</p>
      ) : (
        <DataTable
          columns={['No.', 'Logo', 'Brand Name', 'Status', 'Actions']}
          initialRows={rows}
          renderRow={(row, i) => (
            <tr key={row.id}>
              <td className="td-id">{i + 1}</td>
              <td>
                <div className="img-thumb">
                  {row.logo ? (
                    <img
                      src={getImageUrl(row.logo)}
                      alt={row.name}
                      width="40" height="40"
                      style={{ borderRadius: 8, objectFit: 'cover' }}
                      onError={e => {
                        e.target.onerror = null;
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23eee'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='8' fill='%23999'%3ENo Logo%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  ) : '🏢'}
                </div>
              </td>
              <td>{row.name}</td>
              <td>
                <span className={`status-pill ${row.isActive ? 'pill-active' : 'pill-inactive'}`}>
                  {row.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="action-btn btn-edit" onClick={() => handleEditClick(row)}>Edit</button>
                  <button className="action-btn btn-del" onClick={() => handleDelete(row.id)}>Delete</button>
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

        .km-label-hint {
          font-size: 11px;
          font-weight: 400;
          color: #888;
          margin-left: 6px;
        }

        .km-error-msg {
          color: #ef4444;
          font-size: 12px;
          margin-top: 6px;
        }

        .km-input-error {
          border-color: #ef4444 !important;
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

        .drop-zone-area.error-file {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.04);
        }

        .upload-text {
          font-size: 13px;
          color: #666;
          margin: 0;
          text-align: center;
        }

        .upload-dims {
          font-size: 11px;
          color: #888;
          margin: 4px 0 0;
          text-align: center;
        }

        .dims-ok {
          color: #45b369;
          font-weight: 600;
        }

        .upload-icon {
          text-align: center;
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

        .preview-tile-error {
          border-color: #ef4444;
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
        }

        .km-btn-cancel {
          padding: 10px 24px;
          background: #f1f1f1;
          color: #333;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .km-btn-submit:hover, .km-btn-cancel:hover {
          opacity: 0.8;
        }

        .fade-in {
          animation: kmFadeIn 0.3s ease-out;
        }

        @keyframes kmFadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}