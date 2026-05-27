import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../DataTable/DataTable';
import toast from 'react-hot-toast';
import {
  fetchTestimonials,
  createTestimonial,
  editTestimonial,
  removeTestimonial,
} from '../../redux/services/testimonialsService';

const BASE_URL = process.env.REACT_APP_IMG_URL;

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const clean = imagePath.replace(/^\//, '').replace(/^uploads\//, '');
  return `${BASE_URL}/uploads/${clean}`;
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (rowId, rowName) => {
    const confirmId = showToast.loading('Delete this testimonial?');
    toast(
      (t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span>Are you sure you want to delete testimonial from <b>"{rowName}"</b>?</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
            <button
              style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}
              onClick={async () => {
                toast.dismiss(t.id);
                const toastId = showToast.loading('Deleting testimonial...');
                try {
                  await dispatch(removeTestimonial(rowId));
                  showToast.success('Testimonial deleted', toastId);
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
    if (!name.trim()) { showToast.error('Name is required'); return; }
    if (!designation.trim()) { showToast.error('Designation is required'); return; }
    if (!text.trim()) { showToast.error('Testimonial text is required'); return; }
    if (!editingId && !imageFile) { showToast.error('Image is required'); return; }

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
                        if (file) setImageFile(file);
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
              </div>

              {/* Name */}
              <div className="km-field km-field-half">
                <label className="km-label">Author Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  className="km-input"
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Designation */}
              <div className="km-field km-field-half">
                <label className="km-label">Designation <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  className="km-input"
                  type="text"
                  placeholder="e.g. CEO at TechFlow"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </div>

              {/* Testimonial Text */}
              <div className="km-field km-field-full">
                <label className="km-label">Testimonial Text <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea
                  className="km-input"
                  placeholder="Share the client's feedback or success story..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={5}
                  style={{ resize: 'vertical', minHeight: 120 }}
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
                <div className="action-icons">
                  <button
                    className="icon-btn edit-btn"
                    title="Edit"
                    onClick={() => handleEditClick(row)}
                  >
                    ✎
                  </button>
                  <button
                    className="icon-btn delete-btn"
                    title="Delete"
                    onClick={() => handleDelete(row.id, row.name)}
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          )}
        />
      )}
    </div>
  );
}
