import { useState, useEffect, useRef } from 'react';
import api from '../../api/axiosInstance';
import DataTable from '../DataTable/DataTable';
import ImageUploadField from '../ImageUploadField';
import { confirmDelete } from '../../utils/sweetalert';
import { hasPermission } from '../../utils/authHelper';
import AccessDenied from '../AccessDenied';

const BASE_URL = process.env.REACT_APP_IMG_URL;

// Subcategory Image Dimension Validator (400×400px square)
const SUBCATEGORY_IMAGE_DIMENSIONS = {
  width: 400,
  height: 400,
  aspectRatio: 1 / 1,
  tolerance: 0.05,
  maxFileSize: 3 * 1024 * 1024,
  formats: [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'image/svg+xml', 'image/bmp', 'image/tiff', 'image/x-icon',
    'image/heic', 'image/heif', 'image/avif'
  ],
};

const validateSubCategoryImageDimensions = (file) => {
  return new Promise((resolve) => {
    // Check file size
    if (file.size > SUBCATEGORY_IMAGE_DIMENSIONS.maxFileSize) {
      resolve({
        valid: false,
        error: `File too large. Max: 3MB. You have: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      });
      return;
    }

    // Check file format
    if (!SUBCATEGORY_IMAGE_DIMENSIONS.formats.includes(file.type)) {
      resolve({
        valid: false,
        error: `Invalid format. Use common image formats (JPG, PNG, WebP, GIF, SVG, BMP, TIFF, ICO, HEIC, HEIF, AVIF). You have: ${file.type || 'unknown'}`,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        const actualRatio = width / height;
        const expectedRatio = SUBCATEGORY_IMAGE_DIMENSIONS.aspectRatio;
        const ratioDiff = Math.abs(actualRatio - expectedRatio) / expectedRatio;

        // Check aspect ratio (1:1 square)
        if (ratioDiff > SUBCATEGORY_IMAGE_DIMENSIONS.tolerance) {
          resolve({
            valid: false,
            error: `Incorrect aspect ratio. Use 1:1 square (${SUBCATEGORY_IMAGE_DIMENSIONS.width}×${SUBCATEGORY_IMAGE_DIMENSIONS.height}px). Yours: ${width}×${height}px`,
            dimensions: { width, height },
          });
          return;
        }

        resolve({
          valid: true,
          dimensions: { width, height },
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

export default function SubCategories({ showToast }) {
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories]       = useState([]);
  const [loading, setLoading]             = useState(false);

  const [showForm, setShowForm]           = useState(false);
  const [editingId, setEditingId]         = useState(null);
  const [label, setLabel]                 = useState('');
  const [categoryId, setCategoryId]       = useState('');
  const [isActive, setIsActive]           = useState(true);
  
  const [imageFile, setImageFile]         = useState(null);
  const [preview, setPreview]             = useState(null);
  const [errors, setErrors]               = useState({});
  const [imageDimensions, setImageDimensions] = useState(null);
  const fileInputRef = useRef();

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [subRes, catRes] = await Promise.all([
        api.get('/categories/subcategories'),
        api.get('/categories/categories?active=true'),
      ]);
      
      const extractedSubs = subRes.data?.data || subRes.data || [];
      const extractedCats = catRes.data?.data || catRes.data || [];
      
      setSubcategories(Array.isArray(extractedSubs) ? extractedSubs : []);
      setCategories(Array.isArray(extractedCats) ? extractedCats : []);
    } catch (err) {
      showToast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  if (!hasPermission('subcategories_view')) {
    return <AccessDenied moduleName="Sub-Categories" />;
  }

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setLabel('');
    setCategoryId('');
    setIsActive(true);
    setImageFile(null);
    setPreview(null);
    setErrors({});
    setImageDimensions(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEditClick = (row) => {
    setEditingId(row.id);
    setLabel(row.label);
    setCategoryId(row.categoryId || row.category_id || '');
    setIsActive(row.isActive !== false);
    setPreview(row.image ? getImageUrl(row.image) : null);
    setImageFile(null);
    setErrors({});
    setImageDimensions(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!label) newErrors.label = 'Please enter a subcategory name';
    if (!categoryId) newErrors.categoryId = 'Please select a parent category';
    if (!imageFile && !preview) newErrors.image = 'Image is required';
    
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

    const data = new FormData();
    data.append('label', label);
    data.append('value', generateSlug(label));
    data.append('categoryId', categoryId);
    data.append('isActive', isActive);
    if (imageFile) {
      data.append('image', imageFile);
    }

    const toastId = showToast.loading(editingId ? 'Updating subcategory...' : 'Adding subcategory...');
    try {
      if (editingId) {
        await api.patch(`/categories/subcategories/${editingId}`, data);
        showToast.success('Subcategory updated', toastId);
      } else {
        await api.post('/categories/subcategories', data);
        showToast.success('Subcategory added', toastId);
      }
      resetForm();
      fetchAll();
    } catch (err) {
      showToast.error(err?.response?.data?.message || 'Operation failed', toastId);
    }
  };

  const handleDelete = (subId) => {
    confirmDelete({
      title: 'Delete Subcategory?',
      message: 'Are you sure you want to delete this subcategory?',
      onConfirm: async () => {
        const tid = showToast.loading('Deleting subcategory...');
        try {
          await api.delete(`/categories/subcategories/${subId}`);
          showToast.success('Subcategory deleted successfully!', tid);
          fetchAll();
        } catch (err) {
          console.error('Failed to delete subcategory:', err);
          const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete subcategory';
          showToast.error(errMsg, tid);
        }
      },
    });
  };

  const getCategoryLabel = (row) => {
    const parentCat = categories.find(c => String(c.id) === String(row.categoryId || row.category_id));
    return parentCat ? (parentCat.label || parentCat.name) : '-';
  };

  const safeCategories = Array.isArray(categories) ? categories : [];

  return (
    <div className="categories-container">
      <div className="section-header">
        <div className="section-title">Sub Categories</div>
        {hasPermission('subcategories_create') && (
          <button
            className="action-btn btn-edit"
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          >
            {showForm ? 'Close' : '+ Add Sub Category'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="km-form-card fade-in">
          <div className="km-form-header">
            <div className="km-form-header-icon">{editingId ? '✎' : 'S'}</div>
            <div>
              <div className="km-form-header-title">{editingId ? 'Edit Sub Category' : 'Add New Sub Category'}</div>
              <div className="km-form-header-sub">Fill in the details below</div>
            </div>
          </div>

          <div className="km-form-body">
            <form className="km-form-grid" onSubmit={handleSubmit}>
              <div className="km-field km-field-half">
                <label className="km-label">Parent Category *</label>
                <select
                  className="km-input"
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  required
                >
                  <option value="">— Select Category —</option>
                  {safeCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label || cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="km-field km-field-half">
                <label className="km-label">Sub Category Name *</label>
                <input
                  className="km-input" type="text" placeholder="e.g. Spice Box" required
                  value={label} onChange={e => setLabel(e.target.value)}
                />
              </div>

              <ImageUploadField
                label="Sub Category Image"
                imageFile={imageFile}
                preview={preview}
                fileInputRef={fileInputRef}
                onFileChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setImageFile(file);
                    // Validate dimensions asynchronously
                    validateSubCategoryImageDimensions(file).then((result) => {
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
                requirements="400×400px (1:1) • Max: 3MB (JPG/WebP)"
              />

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

              <div className="km-form-actions" style={{ display: 'flex' }}>
                <button type="submit" className="km-btn-submit">
                  {editingId ? 'Update Sub Category' : 'Save Sub Category'}
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
        <p className="km-loading">Loading subcategories...</p>
      ) : (
        <DataTable
          columns={(() => {
            const cols = ['No.', 'Image', 'Parent Category', 'Sub Category Name', 'Slug', 'Status'];
            if (hasPermission('subcategories_edit') || hasPermission('subcategories_delete')) cols.push('Actions');
            return cols;
          })()}
          initialRows={subcategories}
          renderRow={(row, i) => (
            <tr key={row.id}>
              <td className="td-id">{i + 1}</td>
              <td>
                {row.image ? (
                  <img
                    src={getImageUrl(row.image)}
                    alt={row.label}
                    style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#f1f1f1',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                  }}>📁</span>
                )}
              </td>
              <td>
                <span style={{
                  background: 'rgba(72,127,255,0.12)',
                  color: '#487fff',
                  borderRadius: 6,
                  padding: '3px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  {getCategoryLabel(row)}
                </span>
              </td>
              <td>{row.label}</td>
              <td><code style={{ fontSize: '12px', opacity: 0.7 }}>{row.value || '-'}</code></td>
              <td>
                <span style={{
                  background: row.isActive ? 'rgba(69,179,105,0.15)' : 'rgba(239,68,68,0.15)',
                  color: row.isActive ? '#45b369' : '#ef4444',
                  borderRadius: 6,
                  padding: '3px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  {row.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              {(hasPermission('subcategories_edit') || hasPermission('subcategories_delete')) && (
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {hasPermission('subcategories_edit') && (
                      <button className="action-btn btn-edit" onClick={() => handleEditClick(row)}>Edit</button>
                    )}
                    {hasPermission('subcategories_delete') && (
                      <button className="action-btn btn-del" onClick={() => handleDelete(row.id)}>Delete</button>
                    )}
                  </div>
                </td>
              )}
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
        .upload-text {
          font-size: 13px;
          color: #666;
          margin: 0;
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
        .preview-tag {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.5);
          color: #fff;
          font-size: 9px;
          text-align: center;
          padding: 3px 0;
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
        .km-btn-submit:hover, .km-btn-cancel:hover { opacity: 0.8; }
        .fade-in { animation: kmFadeIn 0.3s ease-out; }
        @keyframes kmFadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}