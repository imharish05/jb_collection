import { useState, useEffect } from 'react';
import DataTable from '../DataTable/DataTable';
import { hasPermission } from '../../utils/authHelper';
import { confirmDelete } from '../../utils/sweetalert';
import API from '../../api/axiosInstance';

const KM = {
  orange: '#F15A24', orangeLight: '#FEF0EB', blue: '#1A3A6B',
  green: '#39B54A', teal: '#00B4D8', border: '#E5E7EB',
  text: '#1A1A2E', muted: '#6B7280', bg: '#F9FAFB',
};

export default function Fonts({ showToast }) {
  const [fonts, setFonts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState({});

  const fetchFonts = async () => {
    try {
      setLoading(true);
      const res = await API.get('/fonts?active=false');
      setFonts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showToast.error('Failed to load fonts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFonts(); }, []);

  // Dynamically load Google Fonts for preview in Admin
  useEffect(() => {
    if (fonts && fonts.length > 0) {
      fonts.forEach(f => {
        const fontName = f.name?.trim();
        if (!fontName) return;
        const linkId = `gfont-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
        if (!document.getElementById(linkId)) {
          const link = document.createElement('link');
          link.id = linkId;
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;700&display=swap`;
          document.head.appendChild(link);
        }
      });
    }
  }, [fonts]);

  // Load current input name font for real-time preview
  useEffect(() => {
    const fontName = name.trim();
    if (!fontName) return;
    const linkId = `gfont-input-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;700&display=swap`;
      document.head.appendChild(link);
    }
  }, [name]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setIsActive(true);
    setErrors({});
  };

  const handleEditClick = (row) => {
    setEditingId(row.id);
    setName(row.name || '');
    setIsActive(row.isActive ?? true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Font name is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast.error(Object.values(newErrors)[0]);
      return;
    }
    setErrors({});
    const toastId = showToast.loading(editingId ? 'Updating font...' : 'Adding font...');
    try {
      if (editingId) {
        await API.put(`/fonts/${editingId}`, { name: name.trim(), isActive });
        showToast.success('Font updated', toastId);
      } else {
        await API.post('/fonts', { name: name.trim(), isActive });
        showToast.success('Font added', toastId);
      }
      resetForm();
      fetchFonts();
    } catch (err) {
      showToast.error(err?.response?.data?.message || 'Operation failed', toastId);
    }
  };

  const handleDelete = (id) => {
    confirmDelete({
      title: 'Delete Font?',
      message: 'Are you sure you want to delete this font?',
      onConfirm: async () => {
        try {
          await API.delete(`/fonts/${id}`);
          fetchFonts();
        } catch (err) {
          showToast.error('Failed to delete font');
        }
      },
    });
  };

  const inputStyle = {
    padding: '9px 12px', border: `1px solid ${KM.border}`, borderRadius: 8,
    fontSize: 13, color: KM.text, background: '#fff', fontFamily: 'inherit',
    outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  return (
    <div className="categories-container">
      <div className="section-header">
        <div className="section-title">Font Management</div>
        {hasPermission('fonts_create') && (
          <button
            className="action-btn btn-edit"
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          >
            {showForm ? 'Close' : '+ Add Font'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="km-form-card fade-in">
          <div className="km-form-header">
            <div className="km-form-header-icon">{editingId ? '✎' : '🔤'}</div>
            <div>
              <div className="km-form-header-title">{editingId ? 'Edit Font' : 'Add New Font'}</div>
              <div className="km-form-header-sub">Fonts will appear in product customisation dropdowns</div>
            </div>
          </div>
          <div className="km-form-body">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: KM.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Font Name
                </label>
                <input
                  className="km-input"
                  placeholder="e.g. Playfair Display"
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: null })); }}
                  style={{ ...inputStyle, borderColor: errors.name ? '#ef4444' : undefined }}
                />
                {errors.name && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ {errors.name}</div>}
                {name.trim() && (
                  <div style={{ marginTop: 6, fontSize: 15, color: KM.text }}>
                    Preview: <span style={{ fontFamily: `'${name.trim()}', serif`, fontSize: 18 }}>Kamali Gifts</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: KM.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
                <select className="km-input" value={isActive ? 'true' : 'false'} onChange={e => setIsActive(e.target.value === 'true')} style={inputStyle}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="km-btn-submit">{editingId ? 'Update Font' : 'Save Font'}</button>
                <button type="button" className="km-btn-cancel" onClick={resetForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="km-loading">Loading fonts...</p>
      ) : (
        <DataTable
          columns={(() => {
            const cols = ['No.', 'Font Name', 'Preview', 'Status'];
            if (hasPermission('fonts_edit') || hasPermission('fonts_delete')) cols.push('Actions');
            return cols;
          })()}
          initialRows={fonts}
          renderRow={(row, i) => (
            <tr key={row.id}>
              <td className="td-id">{i + 1}</td>
              <td style={{ fontWeight: 500 }}>{row.name}</td>
              <td>
                <span style={{ fontFamily: `'${row.name}', serif`, fontSize: 16, color: KM.text }}>
                  Kamali Gifts
                </span>
              </td>
              <td>
                <span className={`status-pill ${row.isActive ? 'pill-active' : 'pill-inactive'}`}>
                  {row.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              {(hasPermission('fonts_edit') || hasPermission('fonts_delete')) && (
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {hasPermission('fonts_edit') && (
                      <button className="action-btn btn-edit" onClick={() => handleEditClick(row)}>Edit</button>
                    )}
                    {hasPermission('fonts_delete') && (
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
        .status-pill { font-size: 12px; font-weight: 600; border-radius: 6px; padding: 3px 10px; display: inline-block; }
        .status-pill.pill-active { background: rgba(69, 179, 105, 0.15); color: #45b369; }
        .status-pill.pill-inactive { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
      `}</style>
    </div>
  );
}
