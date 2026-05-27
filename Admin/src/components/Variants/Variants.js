import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import DataTable from '../DataTable/DataTable';
import { fetchVariants, createVariant, editVariant, removeVariant } from '../../redux/services/variantsService';
import { fetchProducts } from '../../redux/services/productsService';
import VariantBuilder from '../Products/VariantBuilder';
import { confirmDelete } from '../../utils/sweetalert';

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

  // For EDIT — use VariantBuilder (same as Products page) — single SKU in builder
  const [editSku,  setEditSku]  = useState(null); // kept for handleEdit compat
  const [editSkus, setEditSkus] = useState([]);   // VariantBuilder array (always 1 item)

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
    const sku = variantToSku(v);
    setEditSku(sku);
    setEditSkus([sku]);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setMode('none');
    setEditingId(null);
    setSkus([]);
    setEditSku(null);
    setEditSkus([]);
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
    const s = editSkus[0];
    if (!productId) next.productId = 'Please select a product';
    if (!s || !s.mrp || Number(s.mrp) <= 0)               next.mrp = 'MRP required';
    if (!s || !s.salesPrice || Number(s.salesPrice) <= 0)  next.salesPrice = 'Sale price required';
    if (!s || s.stock === '' || s.stock === undefined)      next.stock = 'Stock required';
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

    const s = editSkus[0];
    const attrs = s.combo?.length
      ? s.combo.map(c => ({ key: c.key, value: c.value }))
      : (s.attributes || []).filter(a => a.key && a.value);

    const tid = showToast.loading('Updating variant…');
    try {
      await dispatch(editVariant({
        id: editingId,
        data: {
          productId,
          variantName: s.variantName,
          mrp:         s.mrp,
          salesPrice:  s.salesPrice,
          stock:       s.stock,
          status:      s.status || 'Active',
          attributes:  attrs,
          imageFile:   s.imageFile || undefined,
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
    confirmDelete({
      title: 'Delete Variant?',
      message: 'Are you sure you want to delete this variant?',
      onConfirm: async () => {
        try {
          await dispatch(removeVariant(variantId));
        } catch (err) {
          console.error('Failed to delete variant:', err);
        }
      },
    });
  };

  const filtered = filterProduct ? rows.filter(r => String(r.productId) === filterProduct) : rows;
  const ErrorMsg = ({ field }) => errors[field]
    ? <div style={errorStyle}>⚠ {errors[field]}</div>
    : null;

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

      {/* ── EDIT form — VariantBuilder (matches Products page) ───────────────── */}
      {mode === 'edit' && editSkus.length > 0 && (
        <div style={formCard}>
          <div style={formHeader}>
            <div style={headerIcon}>✏</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Edit Variant</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 }}>
                Update options, price, stock, image and status
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

              {/* VariantBuilder in SKUs tab — shows the single variant card */}
              <VariantBuilder
                key={`edit-${editingId}`}
                variants={editSkus}
                errors={Object.fromEntries(
                  editSkus.map((_, i) => [i, [
                    ...(errors.mrp       ? [errors.mrp]       : []),
                    ...(errors.salesPrice ? [errors.salesPrice] : []),
                    ...(errors.stock     ? [errors.stock]     : []),
                  ]])
                )}
                onChange={(updated) => {
                  setEditSkus(updated);
                  // keep legacy editSku in sync (used nowhere but keeps shape consistent)
                  if (updated[0]) setEditSku(updated[0]);
                }}
              />

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