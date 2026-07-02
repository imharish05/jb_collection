import { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import DataTable from '../DataTable/DataTable';
import { confirmDelete } from '../../utils/sweetalert';
import { hasPermission } from '../../utils/authHelper';
import AccessDenied from '../AccessDenied';

export default function SubSubCategories({ showToast }) {
  const [subsubcategories, setSubsubcategories] = useState([]);
  const [categories, setCategories]             = useState([]);
  const [subcategories, setSubcategories]       = useState([]);
  const [loading, setLoading]                   = useState(false);

  const [showForm, setShowForm]                 = useState(false);
  const [editingId, setEditingId]               = useState(null);
  
  // Cascading form values
  const [categoryId, setCategoryId]             = useState('');
  const [subCategoryId, setSubCategoryId]       = useState('');
  const [label, setLabel]                       = useState('');
  const [isActive, setIsActive]                 = useState(true);

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [subsubRes, catRes, subRes] = await Promise.all([
        api.get('/categories/subsubcategories'),
        api.get('/categories/categories?active=true'),
        api.get('/categories/subcategories?active=true'),
      ]);
      
      const extractedSubSubs = subsubRes.data?.data || subsubRes.data || [];
      const extractedCats = catRes.data?.data || catRes.data || [];
      const extractedSubs = subRes.data?.data || subRes.data || [];
      
      setSubsubcategories(Array.isArray(extractedSubSubs) ? extractedSubSubs : []);
      setCategories(Array.isArray(extractedCats) ? extractedCats : []);
      setSubcategories(Array.isArray(extractedSubs) ? extractedSubs : []);
    } catch (err) {
      showToast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  if (!hasPermission('subcategories_view')) {
    return <AccessDenied moduleName="Sub-Sub Categories" />;
  }

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setCategoryId('');
    setSubCategoryId('');
    setLabel('');
    setIsActive(true);
  };

  const handleEditClick = (row) => {
    setEditingId(row.id);
    const parentSub = row.subcategory || {};
    setCategoryId(parentSub.categoryId || parentSub.category_id || '');
    setSubCategoryId(row.subCategoryId || row.sub_category_id || '');
    setLabel(row.label);
    setIsActive(row.isActive !== false);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId) { showToast.error('Please select a Category'); return; }
    if (!subCategoryId) { showToast.error('Please select a Sub-Category'); return; }
    if (!label) { showToast.error('Please enter a Sub-Subcategory Name'); return; }

    const payload = {
      subCategoryId,
      label,
      value: generateSlug(label),
      isActive,
    };

    const toastId = showToast.loading(editingId ? 'Updating sub-subcategory...' : 'Adding sub-subcategory...');
    try {
      if (editingId) {
        await api.patch(`/categories/subsubcategories/${editingId}`, payload);
        showToast.success('Sub-subcategory updated', toastId);
      } else {
        await api.post('/categories/subsubcategories', payload);
        showToast.success('Sub-subcategory added', toastId);
      }
      resetForm();
      fetchAll();
    } catch (err) {
      showToast.error(err?.response?.data?.message || 'Operation failed', toastId);
    }
  };

  const handleDelete = (id) => {
    confirmDelete({
      title: 'Delete Sub-subcategory?',
      message: 'Are you sure you want to delete this sub-subcategory?',
      onConfirm: async () => {
        try {
          await api.delete(`/categories/subsubcategories/${id}`);
          fetchAll();
        } catch (err) {
          console.error('Failed to delete sub-subcategory:', err);
        }
      },
    });
  };

  // Filter subcategories based on selected category
  const filteredSubCategories = subcategories.filter(sub => {
    const parentCatId = sub.categoryId || sub.category_id;
    return String(parentCatId) === String(categoryId);
  });

  const getCategoryLabel = (row) => {
    if (row.subcategory?.category?.label) return row.subcategory.category.label;
    if (row.subcategory?.category?.name) return row.subcategory.category.name;
    return '-';
  };

  const getSubCategoryLabel = (row) => {
    if (row.subcategory?.label) return row.subcategory.label;
    if (row.subcategory?.name) return row.subcategory.name;
    return '-';
  };

  return (
    <div className="categories-container">
      <div className="section-header">
        <div className="section-title">Sub Sub Categories</div>
        {hasPermission('subcategories_create') && (
          <button
            className="action-btn btn-edit"
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          >
            {showForm ? 'Close' : '+ Add Sub Sub Category'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="km-form-card fade-in">
          <div className="km-form-header">
            <div className="km-form-header-icon">{editingId ? '✎' : 'SS'}</div>
            <div>
              <div className="km-form-header-title">{editingId ? 'Edit Sub Sub Category' : 'Add New Sub Sub Category'}</div>
              <div className="km-form-header-sub">Fill in the details below</div>
            </div>
          </div>

          <div className="km-form-body">
            <form className="km-form-grid" onSubmit={handleSubmit}>
              
              {/* Category Dropdown */}
              <div className="km-field km-field-half">
                <label className="km-label">Parent Category *</label>
                <select
                  className="km-input"
                  value={categoryId}
                  onChange={e => {
                    setCategoryId(e.target.value);
                    setSubCategoryId(''); // Reset subcategory when category changes
                  }}
                  required
                >
                  <option value="">— Select Category —</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label || cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Sub-Category Dropdown */}
              <div className="km-field km-field-half">
                <label className="km-label">Parent Sub-Category *</label>
                <select
                  className="km-input"
                  value={subCategoryId}
                  onChange={e => setSubCategoryId(e.target.value)}
                  disabled={!categoryId}
                  required
                >
                  <option value="">— Select Sub-Category —</option>
                  {filteredSubCategories.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.label || sub.name}</option>
                  ))}
                </select>
              </div>

              {/* Sub-Subcategory Name input */}
              <div className="km-field km-field-half">
                <label className="km-label">Sub Sub Category Name *</label>
                <input
                  className="km-input" type="text" placeholder="e.g. Saree or Kurti" required
                  value={label} onChange={e => setLabel(e.target.value)}
                />
              </div>

              {/* Status Select */}
              <div className="km-field km-field-half">
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
                  {editingId ? 'Update Sub Sub Category' : 'Save Sub Sub Category'}
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
        <p className="km-loading">Loading sub-subcategories...</p>
      ) : (
        <DataTable
          columns={(() => {
            const cols = ['No.', 'Category', 'Sub Category', 'Sub Sub Category Name', 'Slug', 'Status'];
            if (hasPermission('subcategories_edit') || hasPermission('subcategories_delete')) cols.push('Actions');
            return cols;
          })()}
          initialRows={subsubcategories}
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
              <td>
                <span style={{
                  background: 'rgba(245,158,11,0.12)',
                  color: '#d97706',
                  borderRadius: 6,
                  padding: '3px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  {getSubCategoryLabel(row)}
                </span>
              </td>
              <td><strong>{row.label}</strong></td>
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
