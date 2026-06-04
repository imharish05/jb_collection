import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../DataTable/DataTable';
import {
  fetchCategories, createCategory, editCategory, removeCategory
} from '../../redux/services/categoriesService';
import { confirmDelete } from '../../utils/sweetalert';

const BASE_URL = process.env.REACT_APP_IMG_URL;

// Category Image Dimension Validator (400×400px square)
const CATEGORY_IMAGE_DIMENSIONS = {
  recommended: { width: 400, height: 400 },
  minimum: { width: 200, height: 200 },
  aspectRatio: 1 / 1,
  tolerance: 0.05,
  maxFileSize: 3 * 1024 * 1024, // 3MB
  formats: ['image/jpeg', 'image/webp','image/png'],
};

const validateCategoryImageDimensions = (file) => {
  return new Promise((resolve) => {
    // Check file size
    if (file.size > CATEGORY_IMAGE_DIMENSIONS.maxFileSize) {
      resolve({
        valid: false,
        error: `File too large. Max: 3MB. You have: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      });
      return;
    }

    // Check file format
    if (!CATEGORY_IMAGE_DIMENSIONS.formats.includes(file.type)) {
      resolve({
        valid: false,
        error: `Invalid format. Use JPG or WebP. You have: ${file.type || 'unknown'}`,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        const actualRatio = width / height;
        const expectedRatio = CATEGORY_IMAGE_DIMENSIONS.aspectRatio;
        const ratioDiff = Math.abs(actualRatio - expectedRatio) / expectedRatio;

        // Check minimum dimensions
        if (width < CATEGORY_IMAGE_DIMENSIONS.minimum.width || height < CATEGORY_IMAGE_DIMENSIONS.minimum.height) {
          resolve({
            valid: false,
            error: `Image too small. Minimum: ${CATEGORY_IMAGE_DIMENSIONS.minimum.width}×${CATEGORY_IMAGE_DIMENSIONS.minimum.height}px. You have: ${width}×${height}px`,
            dimensions: { width, height },
          });
          return;
        }

        // Check aspect ratio (1:1 square)
        if (ratioDiff > CATEGORY_IMAGE_DIMENSIONS.tolerance) {
          resolve({
            valid: false,
            error: `Incorrect aspect ratio. Use 1:1 square (e.g., ${width}×${width}px or ${CATEGORY_IMAGE_DIMENSIONS.recommended.width}×${CATEGORY_IMAGE_DIMENSIONS.recommended.height}px). Yours: ${width}×${height}px`,
            dimensions: { width, height },
          });
          return;
        }

        resolve({
          valid: true,
          dimensions: { width, height },
          isRecommended: width === CATEGORY_IMAGE_DIMENSIONS.recommended.width && height === CATEGORY_IMAGE_DIMENSIONS.recommended.height,
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

export default function Categories({ showToast }) {
  const dispatch = useDispatch();
  const { items: rows, loading } = useSelector(state => state.categories);

  console.log(rows);
  

  const [showForm, setShowForm]           = useState(false);
  const [editingId, setEditingId]         = useState(null);
  const [categoryName, setCategoryName]   = useState('');
  const [imageFile, setImageFile]         = useState(null);
  const [preview, setPreview]             = useState(null);
  const [errors, setErrors]               = useState({});
  const [imageDimensions, setImageDimensions] = useState(null);
  const fileInputRef = useRef();

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  const handleEditClick = (cat) => {
    setEditingId(cat.id);
    setCategoryName(cat.label);
    setImageFile(null);
    setPreview(cat.image ? getImageUrl(cat.image) : null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearImage = () => {
    setImageFile(null);
    const original = editingId ? rows.find(r => r.id === editingId) : null;
    setPreview(original?.image ? getImageUrl(original.image) : null);
    setImageDimensions(null);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.image;
      return newErrors;
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setCategoryName('');
    setImageFile(null);
    setPreview(null);
    setErrors({});
    setImageDimensions(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!categoryName) newErrors.categoryName = 'Please enter a category name';
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

    const data = new FormData();
    data.append('label', categoryName);
    data.append('value', generateSlug(categoryName));
    if (imageFile) data.append('image', imageFile);

    const toastId = showToast.loading(editingId ? 'Updating category...' : 'Adding category...');
    try {
      if (editingId) {
        await dispatch(editCategory({ id: editingId, formData: data }));
        showToast.success('Category updated', toastId);
      } else {
        await dispatch(createCategory(data));
        showToast.success('Category added', toastId);
      }
      resetForm();
      dispatch(fetchCategories());
    } catch (err) {
      showToast.error(err?.response?.data?.message || err?.message || 'Operation failed', toastId);
    }
  };

const handleDelete = async (catId) => {
  confirmDelete({
    title: 'Delete Category?',
    message: 'Are you sure you want to delete this category?',
    onConfirm: async () => {
      try {
        await dispatch(removeCategory(catId));
      } catch (err) {
        console.error('Failed to delete category:', err);
      }
    },
  });
};

  return (
    <div className="categories-container">
      <div className="section-header">
        <div className="section-title">Categories</div>
        <button
          className="action-btn btn-edit"
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
        >
          {showForm ? 'Close' : '+ Add Category'}
        </button>
      </div>

      {showForm && (
        <div className="km-form-card fade-in">
          <div className="km-form-header">
            <div className="km-form-header-icon">{editingId ? '✎' : 'C'}</div>
            <div>
              <div className="km-form-header-title">{editingId ? 'Edit Category' : 'Add New Category'}</div>
              <div className="km-form-header-sub">Fill in the details below</div>
            </div>
          </div>
          
          <div className="km-form-body">
            <form className="km-form-grid" onSubmit={handleSubmit}>
              <div className="km-field km-field-full">
                <label className="km-label">Category Name</label>
                <input
                  className="km-input" type="text" placeholder="e.g. Gifts" required
                  value={categoryName} onChange={e => setCategoryName(e.target.value)}
                />
              </div>

              <div className="km-field km-field-full">
                <label className="km-label">Category Image • Recommended: 400×400px (1:1) • Min: 200×200px • Max: 3MB (JPG/WebP)</label>
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
                          validateCategoryImageDimensions(file).then((result) => {
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
                      <div className="upload-icon text-center">{imageFile ? '✅' : '📸'}</div>
                      <p className="upload-text">
                        {imageFile ? <b>{imageFile.name}</b> : <>Click to <b>browse</b> or drag image</>}
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

              {/* Properly Aligned Form Actions */}
              <div className="km-form-actions" style={{display : "flex"}}>
                <button type="submit" className="km-btn-submit">
                  {editingId ? 'Update Category' : 'Save Category'}
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
        <p className="km-loading">Loading categories...</p>
      ) : (
        <DataTable
          columns={['No.', 'Image', 'Category Name', 'Slug', 'Actions']}
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
                      onError={e => {
                        e.target.onerror = null;  // must be BEFORE src change, and NO more src changes after
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23eee'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='8' fill='%23999'%3ENo Img%3C/text%3E%3C/svg%3E";
                      }}
                      />
                 
                  ) : '🗂️'
                  
                  }
                      
                </div>
              </td>
              <td>{row.label}</td>
              <td><code style={{ fontSize: '12px', opacity: 0.7 }}>{row.value || '-'}</code></td>
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
          .upload-icon{
          text-align : center;
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

        /* BUTTON ALIGNMENT FIX */
        .km-form-actions {
          grid-column: span 2;
          display: flex;
          justify-content: flex-end; /* Right-aligns the pair */
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
