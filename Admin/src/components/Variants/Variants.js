import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import DataTable from '../DataTable/DataTable';
import { fetchVariants, createVariant, editVariant, removeVariant } from '../../redux/services/variantsService';
import { fetchProducts } from '../../redux/services/productsService';
import { AttributeRow } from '../Products/VariantBuilder';

const IMG_URL = process.env.REACT_APP_IMG_URL || '';
const getImgSrc = (p) => {
  if (!p) return null;
  if (p.startsWith('http')) return p;
  return `${IMG_URL}/uploads/${p.replace(/^\//, '').replace(/^uploads\//, '')}`;
};

const KM = { orange: '#F15A24', orangeLight: '#FEF0EB', blue: '#1A3A6B', green: '#39B54A', teal: '#00B4D8', border: '#E5E7EB', text: '#1A1A2E', muted: '#6B7280', bg: '#F9FAFB' };

function stockColor(qty) { return qty > 200 ? KM.green : qty > 50 ? '#F59E0B' : '#EF4444'; }
function blankAttr() { return { key: '', value: '', customValue: '' }; }

function safeParseAttrs(raw) {
  if (Array.isArray(raw)) return raw.map(a => ({ key: a.key || '', value: a.value || '', customValue: '' }));
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(a => ({ key: a.key || '', value: a.value || '', customValue: '' })) : [blankAttr()];
    } catch { return [blankAttr()]; }
  }
  return [blankAttr()];
}

const EMPTY_FORM = {
  productId: '', variantName: '', mrp: '', salesPrice: '',
  stock: '', status: 'Active', attributes: [blankAttr()],
  imageFile: null, imagePreview: null,
};

const formCard   = { background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 };
const formHeader = { background: KM.blue, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 10 };
const headerIcon = { width: 32, height: 32, background: 'rgba(255,255,255,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 600 };
const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 5 };
const labelStyle = { fontSize: 11, fontWeight: 500, color: KM.muted, textTransform: 'uppercase', letterSpacing: '0.05em' };
const inputStyle = { padding: '9px 12px', border: `1px solid ${KM.border}`, borderRadius: 8, fontSize: 13, color: KM.text, background: '#fff', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' };
const submitBtn  = { gridColumn: 'span 2', padding: 11, background: KM.orange, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 };
const errorStyle = { fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 2 };

function buildVariantName(attributes) {
  return attributes
    .map(a => {
      const val = a.value === 'Custom' ? (a.customValue || 'Custom') : a.value;
      if (!val) return '';
      if (a.key === 'Custom Note') return val;
      return a.key ? `${a.key}: ${val}` : val;
    })
    .filter(Boolean)
    .join(' · ') || 'Default';
}

export default function Variants({ showToast }) {
  const dispatch = useDispatch();
  const { items: rows, loading } = useSelector(state => state.variants);
  const { items: products }      = useSelector(state => state.products);

  const [showForm,      setShowForm]      = useState(false);
  const [editingId,     setEditingId]     = useState(null);
  const [formData,      setFormData]      = useState(EMPTY_FORM);
  const [filterProduct, setFilterProduct] = useState('');
  const [errors,        setErrors]        = useState({});

  const imgInputRef = useRef();

  useEffect(() => {
    dispatch(fetchVariants());
    dispatch(fetchProducts());
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setErrors({});
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (v) => {
    setEditingId(v.id);
    setFormData({
      productId:    v.productId   || '',
      variantName:  v.variantName || '',
      mrp:          v.mrp         || '',
      salesPrice:   v.salesPrice  || '',
      stock:        v.stock       || '',
      status:       v.status      || 'Active',
      attributes:   safeParseAttrs(v.attributes),
      imageFile:    null,
      imagePreview: v.image ? getImgSrc(v.image) : null,
    });
    setErrors({});
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData(prev => ({
      ...prev,
      imageFile:    file,
      imagePreview: URL.createObjectURL(file),
    }));
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imageFile: null, imagePreview: null }));
    if (imgInputRef.current) imgInputRef.current.value = '';
  };

  const ErrorMsg = ({ field }) => errors[field]
    ? <span style={errorStyle}>{errors[field]}</span>
    : null;

  const validate = () => {
    const next = {};
    const mrp = Number(formData.mrp);
    const salesPrice = Number(formData.salesPrice);
    const stock = Number(formData.stock);

    if (!formData.productId) next.productId = 'Please select a product';
    if (!formData.mrp) next.mrp = 'Please enter MRP';
    else if (Number.isNaN(mrp) || mrp <= 0) next.mrp = 'MRP must be greater than 0';
    if (!formData.salesPrice) next.salesPrice = 'Please enter sales price';
    else if (Number.isNaN(salesPrice) || salesPrice <= 0) next.salesPrice = 'Sales price must be greater than 0';
    else if (!Number.isNaN(mrp) && mrp > 0 && salesPrice > mrp) next.salesPrice = 'Sales price cannot be greater than MRP';
    if (formData.stock === '') next.stock = 'Please enter stock';
    else if (Number.isNaN(stock) || stock < 0) next.stock = 'Stock cannot be negative';
    if (!formData.status) next.status = 'Please select status';
    if (!formData.variantName.trim() && !formData.attributes.some(a => a.key && (a.value || a.customValue))) {
      next.attributes = 'Add at least one attribute or enter a variant name';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const updateAttr  = (i, updated) => { const a = [...formData.attributes]; a[i] = updated; setFormData(p => ({ ...p, attributes: a })); };
  const addAttr     = () => setFormData(p => ({ ...p, attributes: [...p.attributes, blankAttr()] }));
  const removeAttr  = (i) => setFormData(p => ({ ...p, attributes: p.attributes.filter((_, j) => j !== i) }));

  const autoName = buildVariantName(formData.attributes);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const cleanAttrs = formData.attributes
      .filter(a => a.key && (a.value || a.customValue))
      .map(a => ({ key: a.key, value: a.value === 'Custom' ? (a.customValue || 'Custom') : a.value }));

    const finalName = formData.variantName.trim() || autoName;

    const payload = {
      productId:   formData.productId,
      variantName: finalName,
      mrp:         formData.mrp,
      salesPrice:  formData.salesPrice,
      stock:       formData.stock,
      status:      formData.status,
      attributes:  cleanAttrs,
      imageFile:   formData.imageFile || undefined,
    };

    const tid = showToast.loading(editingId ? 'Updating variant…' : 'Adding variant…');
    try {
      if (editingId) {
        await dispatch(editVariant({ id: editingId, data: payload }));
        showToast.success('Variant updated!', tid);
      } else {
        await dispatch(createVariant(payload));
        showToast.success('Variant added!', tid);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(EMPTY_FORM);
      dispatch(fetchVariants());
    } catch (err) {
      showToast.error(err?.response?.data?.message || err?.message || 'Operation failed', tid);
    }
  };

  const handleDelete = (variantId) => {
    const confirmId = showToast.loading('Delete this variant?');
    toast(
      (t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span>Are you sure you want to delete this variant?</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
            <button
              style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}
              onClick={async () => {
                toast.dismiss(t.id);
                const toastId = showToast.loading('Deleting variant...');
                try {
                  await dispatch(removeVariant(variantId));
                  showToast.success('Variant deleted!', toastId);
                } catch (err) {
                  showToast.error(err?.response?.data?.message || 'Failed to delete', toastId);
                }
              }}
            >Yes, Delete</button>
            <button
              style={{ background: '#555', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}
              onClick={() => toast.dismiss(t.id)}
            >Cancel</button>
          </div>
        </div>
      ),
      { id: confirmId, duration: Infinity }
    );
  };

  const filtered = filterProduct ? rows.filter(r => String(r.productId) === filterProduct) : rows;

  return (
    <div>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div className="section-title">Variants Management</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="search-input" value={filterProduct} onChange={e => setFilterProduct(e.target.value)} style={{ width: 180 }}>
            <option value="">All Products</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button className="action-btn btn-edit" style={{ padding: '7px 16px', fontSize: 13 }}
            onClick={showForm ? () => { setShowForm(false); setEditingId(null); setErrors({}); } : openAdd}>
            {showForm ? 'Close' : '+ Add Variant'}
          </button>
        </div>
      </div>

      {showForm && (
        <div style={formCard}>
          <div style={formHeader}>
            <div style={headerIcon}>V</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>{editingId ? 'Edit Variant' : 'Add New Variant'}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 }}>Enter variant details below</div>
            </div>
          </div>

          <div style={{ padding: '20px 24px 24px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>

              {/* Product */}
              <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
                <label style={labelStyle}>Product *</label>
                <select required style={inputStyle} value={formData.productId} onChange={set('productId')}>
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name || p.productName}</option>)}
                </select>
                <ErrorMsg field="productId" />
              </div>

              {/* Variant Name */}
              <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
                <label style={labelStyle}>Variant Name</label>
                <input
                  style={{ ...inputStyle, color: formData.variantName ? KM.text : KM.muted }}
                  type="text"
                  placeholder={autoName !== 'Default' ? autoName : 'Auto-generated from attributes below'}
                  value={formData.variantName}
                  onChange={set('variantName')}
                />
                {autoName !== 'Default' && !formData.variantName && (
                  <span style={{ fontSize: 11, color: KM.muted }}>
                    Will save as: <strong style={{ color: KM.orange }}>{autoName}</strong>
                  </span>
                )}
              </div>

              {/* Pricing */}
              <div style={fieldStyle}>
                <label style={labelStyle}>MRP (₹) *</label>
                <input required style={inputStyle} type="number" min="0" step="0.01" placeholder="0.00" value={formData.mrp} onChange={set('mrp')} />
                <ErrorMsg field="mrp" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Sales Price (₹) *</label>
                <input required style={inputStyle} type="number" min="0" step="0.01" placeholder="0.00" value={formData.salesPrice} onChange={set('salesPrice')} />
                <ErrorMsg field="salesPrice" />
                {formData.mrp && formData.salesPrice && Number(formData.mrp) > 0 && (
                  <span style={{ fontSize: 11, color: KM.green, fontWeight: 700 }}>
                    {Math.round((1 - formData.salesPrice / formData.mrp) * 100)}% off
                  </span>
                )}
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Stock *</label>
                <input required style={inputStyle} type="number" min="0" placeholder="0" value={formData.stock} onChange={set('stock')} />
                <ErrorMsg field="stock" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Status</label>
                <select style={inputStyle} value={formData.status} onChange={set('status')}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <ErrorMsg field="status" />
              </div>

              {/* ── Attributes + Image (same layout as Products VariantBuilder) ── */}
              <div style={{ gridColumn: 'span 2', border: `1px solid ${KM.border}`, borderRadius: 10, overflow: 'hidden' }}>
                {/* Section header */}
                <div style={{
                  background: KM.bg,
                  borderBottom: `1px solid ${KM.border}`,
                  padding: '12px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: KM.blue, letterSpacing: '0.02em' }}>
                      🎁 Product Variants
                    </span>
                    <span style={{ fontSize: 11, color: KM.muted, marginLeft: 10 }}>
                      Define custom attributes per variant (colour, size, material, etc.)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={addAttr}
                    style={{ fontSize: 12, padding: '4px 12px', background: 'transparent', color: KM.teal, border: `1px solid ${KM.teal}`, borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                  >
                    + Add Attribute
                  </button>
                </div>

                <div style={{ padding: 16 }}>
                  {/* Column headers */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6, paddingRight: 30 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: KM.muted, textTransform: 'uppercase', letterSpacing: '0.06em', flex: '0 0 160px' }}>Attribute Key</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: KM.muted, textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>Value</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {formData.attributes.map((attr, i) => (
                      <AttributeRow
                        key={i}
                        attr={attr}
                        onChange={updated => updateAttr(i, updated)}
                        onRemove={() => removeAttr(i)}
                        isOnly={formData.attributes.length === 1}
                      />
                    ))}
                  </div>

                  {/* Auto-name preview */}
                  {autoName !== 'Default' && (
                    <div style={{ marginTop: 12, padding: '8px 12px', background: KM.orangeLight, borderRadius: 7, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: KM.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Variant Name</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: KM.orange, background: '#fff', padding: '2px 10px', borderRadius: 5, border: `1px solid ${KM.orange}20` }}>
                        {autoName}
                      </span>
                    </div>
                  )}
                  <ErrorMsg field="attributes" />

                  {/* ── Variant Image — inside same card, below attributes ── */}
                  <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${KM.border}` }}>
                    <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: KM.blue, letterSpacing: '0.02em' }}>Variant Image</span>
                      <span style={{ fontSize: 11, color: KM.muted }}>Optional — shown when this variant is selected</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      {/* Upload trigger */}
                      <div
                        onClick={() => imgInputRef.current?.click()}
                        style={{
                          width: 90, height: 90,
                          border: `2px dashed ${KM.teal}`,
                          borderRadius: 10,
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', background: '#F0FAFE', flexShrink: 0,
                        }}
                      >
                        <input
                          ref={imgInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleImageChange}
                        />
                        <span style={{ fontSize: 20 }}>➕</span>
                        <span style={{ fontSize: 10, color: KM.teal, fontWeight: 600, marginTop: 3 }}>Upload</span>
                      </div>

                      {/* Preview */}
                      {formData.imagePreview && (
                        <div style={{
                          width: 90, height: 90, position: 'relative',
                          borderRadius: 10, overflow: 'hidden',
                          border: `1px solid ${KM.border}`, flexShrink: 0,
                        }}>
                          <img
                            src={formData.imagePreview}
                            alt="variant"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            style={{
                              position: 'absolute', top: 4, right: 4,
                              background: '#ef4444', color: '#fff',
                              border: 'none', borderRadius: '50%',
                              width: 20, height: 20, cursor: 'pointer',
                              fontSize: 11, display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                            }}
                          >✕</button>
                          <div style={{
                            position: 'absolute', bottom: 0, width: '100%',
                            background: 'rgba(0,0,0,0.55)', color: '#fff',
                            fontSize: 10, textAlign: 'center', padding: '2px 0',
                          }}>
                            {formData.imageFile ? 'New' : 'Saved'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" style={submitBtn}>{editingId ? 'Update Variant' : 'Save Variant'}</button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: KM.muted, fontSize: 13 }}>Loading...</p>
      ) : (
        <DataTable
          columns={['No.', 'Image', 'Product', 'Variant', 'MRP', 'Sale Price', 'Stock', 'SKU', 'Status', 'Actions']}
          initialRows={filtered}
          renderRow={(row, i) => (
            <tr key={row.id}>
              <td style={{ fontWeight: 600, color: KM.muted }}>{i + 1}</td>
              <td>
                {row.image ? (
                  <img
                    src={getImgSrc(row.image)}
                    alt={row.variantName}
                    width={38} height={38}
                    style={{ borderRadius: 8, objectFit: 'cover', border: `1px solid ${KM.border}` }}
                  />
                ) : (
                  <div style={{ width: 38, height: 38, borderRadius: 8, background: KM.bg, border: `1px solid ${KM.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: KM.muted }}>—</div>
                )}
              </td>
              <td style={{ fontWeight: 500 }}>{row.product ? row.product.name : row.productName}</td>
              <td style={{ fontWeight: 600 }}>{row.variantName}</td>
              <td>₹{row.mrp}</td>
              <td style={{ fontWeight: 700 }}>₹{row.salesPrice}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: stockColor(row.stock) }} />
                  {row.stock}
                </div>
              </td>
              <td style={{ fontSize: 12, color: KM.muted }}>{row.sku || '—'}</td>
              <td><span className={`status-pill ${row.status === 'Active' ? 'pill-active' : 'pill-inactive'}`}>{row.status}</span></td>
              <td>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="action-btn btn-edit" onClick={() => openEdit(row)}>Edit</button>
                  <button className="action-btn btn-del"  onClick={() => handleDelete(row.id)}>Delete</button>
                </div>
              </td>
            </tr>
          )}
        />
      )}
    </div>
  );
}