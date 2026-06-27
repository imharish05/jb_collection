import { useState, useEffect } from 'react';
import DataTable from '../DataTable/DataTable';
import { hasPermission } from '../../utils/authHelper';
import AccessDenied from '../AccessDenied';
import { confirmDelete } from '../../utils/sweetalert';
import API from '../../api/axiosInstance';

const KM = {
  orange: '#b60410', orangeLight: '#FEF0EB', blue: '#1A3A6B',
  green: '#39B54A', teal: '#00B4D8', border: '#E5E7EB',
  text: '#1A1A2E', muted: '#6B7280', bg: '#F9FAFB',
};

const INPUT_TYPES = [
  { value: 'text',     label: 'Text (single line)' },
  { value: 'textarea', label: 'Textarea (multi-line)' },
  { value: 'color',    label: 'Color Picker' },
  { value: 'font',     label: 'Font Selection' },
  { value: 'select',   label: 'Dropdown / Select' },
];

const EMPTY_FORM = {
  key: '', label: '', placeholder: '', icon: '',
  inputType: 'text', options: '', isRequired: false, sortOrder: 0, isActive: true,
};

export default function CustomisationFields({ showToast }) {
  const [fields, setFields]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [errors, setErrors]       = useState({});

  const fetchFields = async () => {
    try {
      setLoading(true);
      const res = await API.get('/customisation-fields?active=false');
      setFields(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast.error('Failed to load customisation fields');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFields(); }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleEditClick = (row) => {
    setEditingId(row.id);
    let opts = row.options;
    if (typeof opts === 'string') {
      try {
        opts = JSON.parse(opts);
      } catch (e) {}
    }
    setForm({
      key: row.key || '',
      label: row.label || '',
      placeholder: row.placeholder || '',
      icon: row.icon || '',
      inputType: row.inputType || 'text',
      options: Array.isArray(opts) ? opts.join(', ') : (typeof opts === 'string' ? opts : ''),
      isRequired: !!row.isRequired,
      sortOrder: row.sortOrder ?? 0,
      isActive: row.isActive ?? true,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.key.trim()) errs.key = 'Key is required';
    if (!form.label.trim()) errs.label = 'Label is required';
    if (Object.keys(errs).length) { setErrors(errs); showToast.error(Object.values(errs)[0]); return; }
    setErrors({});

    const payload = {
      key: form.key.trim().toLowerCase().replace(/\s+/g, '_'),
      label: form.label.trim(),
      placeholder: form.placeholder.trim() || null,
      icon: form.icon.trim() || null,
      inputType: form.inputType,
      options: form.options
        ? form.options.split(',').map(s => s.trim()).filter(Boolean)
        : null,
      isRequired: form.isRequired,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };

    const toastId = showToast.loading(editingId ? 'Updating...' : 'Saving...');
    try {
      if (editingId) {
        await API.put(`/customisation-fields/${editingId}`, payload);
        showToast.success('Field updated', toastId);
      } else {
        await API.post('/customisation-fields', payload);
        showToast.success('Field created', toastId);
      }
      resetForm();
      fetchFields();
    } catch (err) {
      showToast.error(err?.response?.data?.message || 'Operation failed', toastId);
    }
  };

  const handleDelete = (id) => {
    confirmDelete({
      title: 'Delete Field?',
      message: 'Removing this field will not affect existing products but it will no longer appear as an option.',
      onConfirm: async () => {
        try {
          await API.delete(`/customisation-fields/${id}`);
          fetchFields();
        } catch {
          showToast.error('Failed to delete field');
        }
      },
    });
  };

  const inp = {
    padding: '9px 12px', border: `1px solid ${KM.border}`, borderRadius: 8,
    fontSize: 13, color: KM.text, background: '#fff',
    fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  const inputTypeIcon = { text: '📝', textarea: '📄', color: '🎨', font: '🔤', select: '📋' };

  if (!hasPermission('customisation_fields_view')) {
    return <AccessDenied moduleName="Customisation Fields" />;
  }

  return (
    <div className="categories-container">
      <div className="section-header">
        <div className="section-title">Customisation Fields</div>
        {hasPermission('customisation_fields_create') && (
          <button
            className="action-btn btn-edit"
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          >
            {showForm ? 'Close' : '+ Add Field'}
          </button>
        )}
      </div>

      <div style={{ padding: '10px 14px', background: '#F0F9FF', borderRadius: 8, border: '1px solid #BAE6FD', fontSize: 12, color: '#0369A1', marginBottom: 18 }}>
        ℹ️ Define customisation input fields here. Then enable them per-product from the product form. Customers will see these as fill-in fields on the product page.
      </div>

      {showForm && (
        <div className="km-form-card fade-in">
          <div className="km-form-header">
            <div className="km-form-header-icon">{editingId ? '✎' : '✨'}</div>
            <div>
              <div className="km-form-header-title">{editingId ? 'Edit Field' : 'Add Customisation Field'}</div>
              <div className="km-form-header-sub">This field will appear as an input on the product page when enabled</div>
            </div>
          </div>

          <div className="km-form-body">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Row 1: Key + Icon */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: KM.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                    Field Key <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    placeholder="e.g. name_engraving"
                    value={form.key}
                    onChange={e => set('key', e.target.value)}
                    style={{ ...inp, borderColor: errors.key ? '#ef4444' : undefined }}
                    disabled={!!editingId}
                    title={editingId ? 'Key cannot be changed after creation' : ''}
                  />
                  <div style={{ fontSize: 11, color: KM.muted, marginTop: 3 }}>Unique identifier, lowercase, no spaces (auto-formatted)</div>
                  {errors.key && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 3 }}>⚠ {errors.key}</div>}
                </div>
                <div style={{ minWidth: 90 }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: KM.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                    Icon (emoji)
                  </label>
                  <input
                    placeholder="✏️"
                    value={form.icon}
                    onChange={e => set('icon', e.target.value)}
                    style={{ ...inp, textAlign: 'center', fontSize: 20 }}
                    maxLength={4}
                  />
                </div>
              </div>

              {/* Row 2: Label */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: KM.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                  Customer-Facing Label <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  placeholder="e.g. Name / Text Engraving"
                  value={form.label}
                  onChange={e => {
                    const labelVal = e.target.value;
                    setForm(f => {
                      const nextForm = { ...f, label: labelVal };
                      if (!editingId) {
                        nextForm.key = labelVal
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '_')
                          .replace(/^_+|_+$/g, '');
                      }
                      return nextForm;
                    });
                    setErrors(p => ({ ...p, label: null, key: null }));
                  }}
                  style={{ ...inp, borderColor: errors.label ? '#ef4444' : undefined }}
                />
                {errors.label && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 3 }}>⚠ {errors.label}</div>}
              </div>

              {/* Row 3: Placeholder */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: KM.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                  Placeholder Text
                </label>
                <input
                  placeholder="e.g. Enter name to engrave (max 20 chars)"
                  value={form.placeholder}
                  onChange={e => set('placeholder', e.target.value)}
                  style={inp}
                />
              </div>

              {/* Row 4: Input Type */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: KM.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                  Input Type
                </label>
                <select value={form.inputType} onChange={e => set('inputType', e.target.value)} style={inp}>
                  {INPUT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{inputTypeIcon[t.value]} {t.label}</option>
                  ))}
                </select>
                <div style={{ fontSize: 11, color: KM.muted, marginTop: 3 }}>
                  {form.inputType === 'text' && 'Customer types a single line of text.'}
                  {form.inputType === 'textarea' && 'Customer types multiple lines of text (good for special notes).'}
                  {form.inputType === 'color' && 'Customer picks from a set of colour options.'}
                  {form.inputType === 'font' && 'Customer picks a font from active Font Management list.'}
                  {form.inputType === 'select' && 'Customer picks from a list you define below.'}
                </div>
              </div>

              {/* Options — only for select/color */}
              {(form.inputType === 'select' || form.inputType === 'color') && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: KM.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                    Options (comma-separated)
                  </label>
                  <input
                    placeholder={form.inputType === 'color' ? 'Red, Blue, Gold, Silver' : 'Option A, Option B, Option C'}
                    value={form.options}
                    onChange={e => set('options', e.target.value)}
                    style={inp}
                  />
                </div>
              )}

              {/* Row 5: Sort order + Required + Active */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ minWidth: 90 }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: KM.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                    Sort Order
                  </label>
                  <input
                    type="number" min="0"
                    value={form.sortOrder}
                    onChange={e => set('sortOrder', e.target.value)}
                    style={{ ...inp, maxWidth: 90 }}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                  <input type="checkbox" checked={form.isRequired} onChange={e => set('isRequired', e.target.checked)} />
                  Required field
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                  <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
                  Active (visible in product form)
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="km-btn-submit">{editingId ? 'Update Field' : 'Save Field'}</button>
                <button type="button" className="km-btn-cancel" onClick={resetForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="km-loading">Loading fields...</p>
      ) : (
        <DataTable
          columns={(() => {
            const cols = ['#', 'Key', 'Label', 'Type', 'Placeholder', 'Required', 'Order', 'Status'];
            if (hasPermission('customisation_fields_edit') || hasPermission('customisation_fields_delete')) {
              cols.push('Actions');
            }
            return cols;
          })()}
          initialRows={fields}
          renderRow={(row, i) => (
            <tr key={row.id}>
              <td className="td-id">{i + 1}</td>
              <td><code style={{ fontSize: 12, background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{row.key}</code></td>
              <td style={{ fontWeight: 500 }}>
                {row.icon && <span style={{ marginRight: 6 }}>{row.icon}</span>}
                {row.label}
              </td>
              <td>
                <span style={{ fontSize: 12, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                  {inputTypeIcon[row.inputType]} {row.inputType}
                </span>
              </td>
              <td style={{ fontSize: 12, color: KM.muted, maxWidth: 180 }}>{row.placeholder || '—'}</td>
              <td>{row.isRequired ? '✅ Yes' : '—'}</td>
              <td style={{ textAlign: 'center' }}>{row.sortOrder}</td>
              <td>
                <span className={`status-pill ${row.isActive ? 'pill-active' : 'pill-inactive'}`}>
                  {row.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              {(hasPermission('customisation_fields_edit') || hasPermission('customisation_fields_delete')) && (
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {hasPermission('customisation_fields_edit') && (
                      <button className="action-btn btn-edit" onClick={() => handleEditClick(row)}>Edit</button>
                    )}
                    {hasPermission('customisation_fields_delete') && (
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
        .status-pill.pill-active { background: rgba(69,179,105,0.15); color: #45b369; }
        .status-pill.pill-inactive { background: rgba(239,68,68,0.15); color: #ef4444; }
      `}</style>
    </div>
  );
}
