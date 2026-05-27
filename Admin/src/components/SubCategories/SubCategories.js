import { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import DataTable from '../DataTable/DataTable';
import { confirmDelete } from '../../utils/sweetalert';

export default function SubCategories({ showToast }) {
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories]       = useState([]);
  const [loading, setLoading]             = useState(false);

  const [showForm, setShowForm]           = useState(false);
  const [editingId, setEditingId]         = useState(null);
  const [label, setLabel]                 = useState('');
  const [categoryId, setCategoryId]       = useState('');
  const [isActive, setIsActive]           = useState(true);

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [subRes, catRes] = await Promise.all([
        api.get('/subcategories'),
        api.get('/categories?active=true'),
      ]);
      setSubcategories(subRes.data.data || []);
      setCategories(catRes.data.data || []);
    } catch (err) {
      showToast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setLabel('');
    setCategoryId('');
    setIsActive(true);
  };

  const handleEditClick = (row) => {
    setEditingId(row.id);
    setLabel(row.label);
    setCategoryId(row.categoryId || row.category_id || '');
    setIsActive(row.isActive !== false);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!label) { showToast.error('Please enter a subcategory name'); return; }
    if (!categoryId) { showToast.error('Please select a parent category'); return; }

    const payload = { label, value: generateSlug(label), categoryId, isActive };
    const toastId = showToast.loading(editingId ? 'Updating subcategory...' : 'Adding subcategory...');
    try {
      if (editingId) {
        await api.patch(`/subcategories/${editingId}`, payload);
        showToast.success('Subcategory updated', toastId);
      } else {
        await api.post('/subcategories', payload);
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
        try {
          await api.delete(`/subcategories/${subId}`);
          fetchAll();
        } catch (err) {
          console.error('Failed to delete subcategory:', err);
        }
      },
    });
  };

  // Group subcategories by category for display
  const getCategoryLabel = (row) => {
    const catId = row.categoryId || row.category_id;
    if (row.category) return row.category.label;
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.label : '-';
  };

  return (
    <div className="categories-container">
      <div className="section-header">
        <div className="section-title">Sub Categories</div>
        <button
          className="action-btn btn-edit"
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
        >
          {showForm ? 'Close' : '+ Add Sub Category'}
        </button>
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
                <label className="km-label">Parent Category</label>
                <select
                  className="km-input"
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  required
                >
                  <option value="">— Select Category —</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="km-field km-field-half">
                <label className="km-label">Sub Category Name</label>
                <input
                  className="km-input" type="text" placeholder="e.g. Spice Box" required
                  value={label} onChange={e => setLabel(e.target.value)}
                />
              </div>

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
          columns={['No.', 'Parent Category', 'Sub Category Name', 'Slug', 'Status', 'Actions']}
          initialRows={subcategories}
          renderRow={(row, i) => (
            <tr key={row.id}>
              <td className="td-id">{i + 1}</td>
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