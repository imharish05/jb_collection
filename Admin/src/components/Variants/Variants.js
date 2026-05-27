import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import DataTable from '../DataTable/DataTable';
import { fetchVariants, createVariant, editVariant, removeVariant } from '../../redux/services/variantsService';
import { fetchProducts } from '../../redux/services/productsService';
import VariantBuilder from '../Products/VariantBuilder';

const IMG_URL = process.env.REACT_APP_IMG_URL || '';
const getImgSrc = (p) => {
  if (!p) return null;
  if (p.startsWith('http')) return p;
  return `${IMG_URL}/uploads/${p.replace(/^\//, '').replace(/^uploads\//, '')}`;
};

const KM = {
  orange: '#F15A24', orangeLight: '#FEF0EB', blue: '#1A3A6B',
  green: '#39B54A', teal: '#00B4D8', border: '#E5E7EB',
  text: '#1A1A2E', muted: '#6B7280', bg: '#F9FAFB',
  red: '#EF4444', redLight: '#FEF2F2',
};

function stockColor(qty) {
  return qty > 200 ? KM.green : qty > 50 ? '#F59E0B' : KM.red;
}

function safeAttrs(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
}

// Convert a saved variant row → VariantBuilder SKU shape
function variantToSku(v) {
  const attrs = safeAttrs(v.attributes);
  const combo = attrs
    .filter(a => a.key && a.value && a.key !== 'Custom Note')
    .map(a => ({ key: a.key, value: a.value }));
  return {
    id: v.id,
    variantName: v.variantName || combo.map(c => `${c.key}: ${c.value}`).join(' · ') || 'Default',
    combo,
    mrp:          String(v.mrp         || ''),
    salesPrice:   String(v.salesPrice  || ''),
    stock:        String(v.stock       ?? ''),
    status:       v.status             || 'Active',
    imageFile:    null,
    imagePreview: v.image ? getImgSrc(v.image) : null,
    attributes:   attrs,
  };
}

const formCard   = { background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 };
const formHeader = { background: KM.blue, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 10 };
const headerIcon = { width: 32, height: 32, background: 'rgba(255,255,255,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 600 };
const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 5 };
const labelStyle = { fontSize: 11, fontWeight: 600, color: KM.muted, textTransform: 'uppercase', letterSpacing: '0.05em' };
const inputStyle = { padding: '9px 12px', border: `1px solid ${KM.border}`, borderRadius: 8, fontSize: 13, color: KM.text, background: '#fff', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' };
const errorStyle = { fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 2 };
const submitBtn  = { padding: '12px 0', background: KM.orange, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', width: '100%', marginTop: 8 };

export default function Variants({ showToast }) {
  const dispatch = useDispatch();
  const { items: rows, loading } = useSelector(state => state.variants);
  const { items: products }      = useSelector(state => state.products);

  // mode: 'none' | 'add' | 'edit'
  const [mode,          setMode]          = useState('none');
  const [editingId,     setEditingId]     = useState(null);
  const [productId,     setProductId]     = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [errors,        setErrors]        = useState({});

  // For ADD — use VariantBuilder (option matrix → cartesian SKUs)
  const [skus,            setSkus]            = useState([]);
  // Pre-seeded option matrix built from the selected product's existing variants
  const [existingOptions, setExistingOptions] = useState(null);

  // For EDIT — single SKU card (same SkuRow shape)
  const [editSku, setEditSku] = useState(null);

  useEffect(() => {
    dispatch(fetchVariants());
    dispatch(fetchProducts());
  }, []);

  // ── Derive existing option matrix whenever productId changes in ADD mode ──
  // Reads the already-loaded `rows` (variant list) for the selected product and
  // reconstructs the option axes so VariantBuilder knows what dimensions exist.
  // e.g. product has Colour:[Red], Size:[SM,M], Material:[Glass]
  //   → existingOptions = [
  //       { id:'Colour',   key:'Colour',   values:['Red'] },
  //       { id:'Size',     key:'Size',     values:['SM','M'] },
  //       { id:'Material', key:'Material', values:['Glass'] },
  //     ]
  useEffect(() => {
    if (mode !== 'add' || !productId) {
      setExistingOptions(null);
      setSkus([]);
      return;
    }
    const productVariants = rows.filter(r => String(r.productId) === String(productId));
    if (!productVariants.length) {
      setExistingOptions(null);
      setSkus([]);
      return;
    }
    const optionMap = {};
    productVariants.forEach(v => {
      safeAttrs(v.attributes).forEach(a => {
        if (!a.key || !a.value || a.key === 'Custom Note') return;
        if (!optionMap[a.key]) optionMap[a.key] = new Set();
        optionMap[a.key].add(a.value);
      });
    });
    const keys = Object.keys(optionMap);
    if (!keys.length) {
      setExistingOptions(null);
      setSkus([]);
      return;
    }
    setExistingOptions(
      keys.map(k => ({ id: k, key: k, values: [...optionMap[k]] }))
    );
    setSkus([]); // reset SKUs so VariantBuilder regenerates from new options
  }, [productId, mode, rows]);

  // ── Open ADD form ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setMode('add');
    setEditingId(null);
    setProductId('');
    setSkus([]);
    setExistingOptions(null);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Open EDIT form ────────────────────────────────────────────────────────
  const openEdit = (v) => {
    setMode('edit');
    setEditingId(v.id);
    setProductId(String(v.productId || ''));
    setEditSku(variantToSku(v));
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setMode('none');
    setEditingId(null);
    setSkus([]);
    setEditSku(null);
    setExistingOptions(null);
    setErrors({});
  };

  // ── Validate ──────────────────────────────────────────────────────────────
  const validateAdd = () => {
    const next = {};
    if (!productId) next.productId = 'Please select a product';
    if (!skus.length) next.skus = 'Add at least one variant using the options above';
    else {
      skus.forEach((s, i) => {
        const msgs = [];
        if (!s.mrp || Number(s.mrp) <= 0)         msgs.push('MRP required');
        if (!s.salesPrice || Number(s.salesPrice) <= 0) msgs.push('Sale price required');
        if (s.stock === '' || s.stock === undefined)    msgs.push('Stock required');
        if (msgs.length) next[`sku_${i}`] = msgs.join(', ');
      });
    }
    setErrors(next);
    return !Object.keys(next).length;
  };

  const validateEdit = () => {
    const next = {};
    if (!productId) next.productId = 'Please select a product';
    if (!editSku.mrp || Number(editSku.mrp) <= 0)             next.mrp = 'MRP required';
    if (!editSku.salesPrice || Number(editSku.salesPrice) <= 0) next.salesPrice = 'Sale price required';
    if (editSku.stock === '' || editSku.stock === undefined)    next.stock = 'Stock required';
    setErrors(next);
    return !Object.keys(next).length;
  };

  // ── Submit ADD (one API call per SKU) ─────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!validateAdd()) return;

    const tid = showToast.loading(`Adding ${skus.length} variant${skus.length > 1 ? 's' : ''}…`);
    try {
      for (const sku of skus) {
        const attrs = sku.combo?.length
          ? sku.combo.map(c => ({ key: c.key, value: c.value }))
          : (sku.attributes || []).filter(a => a.key && a.value);

        await dispatch(createVariant({
          productId,
          variantName: sku.variantName,
          mrp:         sku.mrp,
          salesPrice:  sku.salesPrice,
          stock:       sku.stock,
          status:      sku.status || 'Active',
          attributes:  attrs,
          imageFile:   sku.imageFile || undefined,
        }));
      }
      showToast.success(`${skus.length} variant${skus.length > 1 ? 's' : ''} added!`, tid);
      closeForm();
      dispatch(fetchVariants());
    } catch (err) {
      showToast.error(err?.response?.data?.message || err?.message || 'Failed', tid);
    }
  };

  // ── Submit EDIT ───────────────────────────────────────────────────────────
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!validateEdit()) return;

    const attrs = editSku.combo?.length
      ? editSku.combo.map(c => ({ key: c.key, value: c.value }))
      : (editSku.attributes || []).filter(a => a.key && a.value);

    const tid = showToast.loading('Updating variant…');
    try {
      await dispatch(editVariant({
        id: editingId,
        data: {
          productId,
          variantName: editSku.variantName,
          mrp:         editSku.mrp,
          salesPrice:  editSku.salesPrice,
          stock:       editSku.stock,
          status:      editSku.status || 'Active',
          attributes:  attrs,
          imageFile:   editSku.imageFile || undefined,
        },
      }));
      showToast.success('Variant updated!', tid);
      closeForm();
      dispatch(fetchVariants());
    } catch (err) {
      showToast.error(err?.response?.data?.message || err?.message || 'Failed', tid);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = (variantId) => {
    const confirmId = showToast.loading('Delete this variant?');
    toast(
      (t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span>Are you sure you want to delete this variant?</span>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              style={{ background: KM.red, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 14px', cursor: 'pointer', fontWeight: 600 }}
              onClick={async () => {
                toast.dismiss(t.id);
                const toastId = showToast.loading('Deleting…');
                try {
                  await dispatch(removeVariant(variantId));
                  showToast.success('Deleted!', toastId);
                } catch (err) {
                  showToast.error(err?.response?.data?.message || 'Failed', toastId);
                }
              }}
            >Delete</button>
            <button
              style={{ background: '#555', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 14px', cursor: 'pointer' }}
              onClick={() => toast.dismiss(t.id)}
            >Cancel</button>
          </div>
        </div>
      ),
      { id: confirmId, duration: Infinity }
    );
  };

  const filtered = filterProduct ? rows.filter(r => String(r.productId) === filterProduct) : rows;
  const ErrorMsg = ({ field }) => errors[field]
    ? <div style={errorStyle}>⚠ {errors[field]}</div>
    : null;

  // ── Edit SKU card — inline using same SkuRow style ────────────────────────
  const EditSkuCard = () => {
    const imgRef = useRef();
    if (!editSku) return null;
    const isOOS  = editSku.stock === '0' || editSku.stock === 0 || editSku.stock === '';
    const discount = editSku.mrp && editSku.salesPrice && Number(editSku.mrp) > 0
      ? Math.round((1 - Number(editSku.salesPrice) / Number(editSku.mrp)) * 100) : 0;

    const set = (field) => (e) => setEditSku(prev => ({ ...prev, [field]: e.target.value }));

    return (
      <div style={{ border: `1px solid ${KM.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        {/* Header */}
        <div style={{ background: KM.bg, padding: '10px 14px', borderBottom: `1px solid ${KM.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: KM.blue }}>✏️ Editing: {editSku.variantName}</span>
          <button type="button"
            onClick={() => setEditSku(prev => ({ ...prev, status: prev.status === 'Active' ? 'Inactive' : 'Active' }))}
            style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, border: `1px solid ${editSku.status === 'Active' ? KM.green : KM.border}`, background: editSku.status === 'Active' ? '#F0FFF4' : KM.bg, color: editSku.status === 'Active' ? KM.green : KM.muted, cursor: 'pointer', fontWeight: 700 }}>
            {editSku.status === 'Active' ? '● Active' : '○ Inactive'}
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', gap: 16, padding: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Image upload */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: KM.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Image</div>
            <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                setEditSku(prev => ({ ...prev, imageFile: file, imagePreview: URL.createObjectURL(file) }));
              }} />
            {editSku.imagePreview ? (
              <div style={{ position: 'relative', width: 90, height: 90 }}>
                <img src={editSku.imagePreview} alt="variant"
                  style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 10, border: `2px solid ${KM.teal}`, display: 'block' }} />
                <button type="button"
                  onClick={() => setEditSku(prev => ({ ...prev, imageFile: null, imagePreview: null }))}
                  style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: KM.red, color: '#fff', border: '2px solid #fff', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontWeight: 700 }}>✕</button>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,180,216,0.85)', borderRadius: '0 0 8px 8px', fontSize: 10, color: '#fff', textAlign: 'center', padding: '3px 0', fontWeight: 600 }}>
                  {editSku.imageFile ? 'New' : 'Saved'}
                </div>
              </div>
            ) : (
              <div onClick={() => imgRef.current?.click()}
                style={{ width: 90, height: 90, border: `2px dashed ${KM.teal}`, borderRadius: 10, background: '#F0FAFE', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <span style={{ fontSize: 26 }}>🖼️</span>
                <span style={{ fontSize: 10, color: KM.teal, fontWeight: 700 }}>Upload</span>
              </div>
            )}
          </div>

          {/* Fields */}
          <div style={{ flex: 1, minWidth: 220 }}>
            {/* Variant name */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Variant Name</label>
              <input style={{ ...inputStyle, marginTop: 4 }} type="text" value={editSku.variantName}
                onChange={e => setEditSku(prev => ({ ...prev, variantName: e.target.value }))} />
            </div>

            {/* Price + stock grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>MRP (₹)</label>
                <input style={{ ...inputStyle, marginTop: 4 }} type="number" min="0" step="0.01" placeholder="0.00"
                  value={editSku.mrp} onChange={set('mrp')} />
                <ErrorMsg field="mrp" />
              </div>
              <div>
                <label style={labelStyle}>Sale Price (₹)</label>
                <input style={{ ...inputStyle, marginTop: 4, borderColor: (editSku.mrp && editSku.salesPrice && Number(editSku.salesPrice) > Number(editSku.mrp)) ? KM.red : KM.border }}
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={editSku.salesPrice} onChange={set('salesPrice')} />
                {discount > 0 && <div style={{ fontSize: 10, color: KM.green, fontWeight: 700, marginTop: 2 }}>{discount}% off</div>}
                <ErrorMsg field="salesPrice" />
              </div>
              <div>
                <label style={labelStyle}>Stock</label>
                <input style={{ ...inputStyle, marginTop: 4, borderColor: isOOS ? '#F59E0B' : KM.border }}
                  type="number" min="0" placeholder="0"
                  value={editSku.stock} onChange={set('stock')} />
                {isOOS && <div style={{ fontSize: 10, color: '#F59E0B', fontWeight: 700, marginTop: 2 }}>Out of stock</div>}
                <ErrorMsg field="stock" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page header */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div className="section-title">Variants Management</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="search-input" value={filterProduct} onChange={e => setFilterProduct(e.target.value)} style={{ width: 180 }}>
            <option value="">All Products</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button className="action-btn btn-edit" style={{ padding: '7px 16px', fontSize: 13 }}
            onClick={mode !== 'none' ? closeForm : openAdd}>
            {mode !== 'none' ? '✕ Close' : '+ Add Variant'}
          </button>
        </div>
      </div>

      {/* ── ADD form — full VariantBuilder (option matrix) ─────────────────── */}
      {mode === 'add' && (
        <div style={formCard}>
          <div style={formHeader}>
            <div style={headerIcon}>+</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Add New Variants</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 }}>
                Select a product, define options, set prices & stock
              </div>
            </div>
          </div>

          <div style={{ padding: '20px 24px 24px' }}>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Product selector */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Product *</label>
                <select required style={inputStyle} value={productId} onChange={e => {
                  setProductId(e.target.value);
                  setSkus([]);          // reset SKUs when product changes
                  setExistingOptions(null); // useEffect will recompute
                }}>
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name || p.productName}</option>)}
                </select>
                <ErrorMsg field="productId" />
                {/* Info banner — shown when product already has variants */}
                {productId && existingOptions && existingOptions.length > 0 && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: '#EEF9F0', border: '1px solid #A7D7AF', borderRadius: 8, fontSize: 12, color: '#2d6a35' }}>
                    ℹ️ This product already has <strong>{existingOptions.length}</strong> option dimension{existingOptions.length > 1 ? 's' : ''} (
                    {existingOptions.map(o => o.key).join(', ')}). New values you add will be <strong>auto-expanded</strong> into full combinations.
                  </div>
                )}
              </div>

              {/* VariantBuilder — same component used in Products */}
              {/* existingOptions seeds the option matrix with current product dimensions */}
              <VariantBuilder
                key={productId || 'no-product'} // remount when product changes so options reset
                variants={skus}
                errors={Object.fromEntries(
                  skus.map((_, i) => [i, errors[`sku_${i}`] ? [errors[`sku_${i}`]] : []])
                )}
                onChange={setSkus}
                existingOptions={existingOptions || undefined}
              />
              <ErrorMsg field="skus" />

              <button type="submit" style={submitBtn}>
                Save {skus.length > 0 ? `${skus.length} Variant${skus.length > 1 ? 's' : ''}` : 'Variants'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT form — single SKU card ────────────────────────────────────── */}
      {mode === 'edit' && editSku && (
        <div style={formCard}>
          <div style={formHeader}>
            <div style={headerIcon}>✏</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Edit Variant</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 }}>
                Update price, stock, image and status
              </div>
            </div>
          </div>

          <div style={{ padding: '20px 24px 24px' }}>
            <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Product selector */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Product *</label>
                <select required style={inputStyle} value={productId} onChange={e => setProductId(e.target.value)}>
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name || p.productName}</option>)}
                </select>
                <ErrorMsg field="productId" />
              </div>

              <EditSkuCard />

              <button type="submit" style={submitBtn}>Update Variant</button>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p style={{ color: KM.muted, fontSize: 13 }}>Loading…</p>
      ) : (
        <DataTable
          columns={['No.', 'Image', 'Product', 'Variant', 'MRP', 'Sale Price', 'Stock', 'SKU', 'Status', 'Actions']}
          initialRows={filtered}
          renderRow={(row, i) => (
            <tr key={row.id}>
              <td style={{ fontWeight: 600, color: KM.muted }}>{i + 1}</td>
              <td>
                {row.image ? (
                  <img src={getImgSrc(row.image)} alt={row.variantName}
                    width={40} height={40}
                    style={{ borderRadius: 8, objectFit: 'cover', border: `1px solid ${KM.border}` }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: KM.bg, border: `1px solid ${KM.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: KM.muted }}>—</div>
                )}
              </td>
              <td style={{ fontWeight: 500 }}>{row.product?.name || row.productName || '—'}</td>
              <td style={{ fontWeight: 600 }}>{row.variantName}</td>
              <td>₹{parseFloat(row.mrp || 0).toLocaleString('en-IN')}</td>
              <td style={{ fontWeight: 700 }}>₹{parseFloat(row.salesPrice || 0).toLocaleString('en-IN')}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: stockColor(row.stock) }} />
                  {row.stock}
                </div>
              </td>
              <td style={{ fontSize: 11, color: KM.muted, fontFamily: 'monospace' }}>{row.sku || '—'}</td>
              <td>
                <span className={`status-pill ${row.status === 'Active' ? 'pill-active' : 'pill-inactive'}`}>
                  {row.status}
                </span>
              </td>
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