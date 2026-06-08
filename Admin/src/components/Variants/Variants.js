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

const KEY_ALIASES = { color: 'Colour', colour: 'Colour', size: 'Size', material: 'Material', finish: 'Finish', capacity: 'Capacity' };
function normalKey(k) { return KEY_ALIASES[k?.toLowerCase()] || k; }

// Product Image Dimension Validator (800×960px 5:6 portrait)
const PRODUCT_IMAGE_DIMENSIONS = {
  recommended: { width: 800, height: 960 },
  minimum: { width: 400, height: 480 },
  aspectRatio: 5 / 6,
  tolerance: 0.05,
  maxFileSize: 3 * 1024 * 1024, // 3MB
  formats: ['image/jpeg', 'image/webp',,'image/png'],
};

const validateProductImageDimensions = (file) => {
  return new Promise((resolve) => {
    // Check file size
    if (file.size > PRODUCT_IMAGE_DIMENSIONS.maxFileSize) {
      resolve({
        valid: false,
        error: `File too large. Max: 3MB. You have: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      });
      return;
    }

    // Check file format
    if (!PRODUCT_IMAGE_DIMENSIONS.formats.includes(file.type)) {
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
        const expectedRatio = PRODUCT_IMAGE_DIMENSIONS.aspectRatio;
        const ratioDiff = Math.abs(actualRatio - expectedRatio) / expectedRatio;

        // Check minimum dimensions
        if (width < PRODUCT_IMAGE_DIMENSIONS.minimum.width || height < PRODUCT_IMAGE_DIMENSIONS.minimum.height) {
          resolve({
            valid: false,
            error: `Image too small. Minimum: ${PRODUCT_IMAGE_DIMENSIONS.minimum.width}×${PRODUCT_IMAGE_DIMENSIONS.minimum.height}px. You have: ${width}×${height}px`,
            dimensions: { width, height },
          });
          return;
        }

        // Check aspect ratio (5:6)
        if (ratioDiff > PRODUCT_IMAGE_DIMENSIONS.tolerance) {
          const recommendedHeight = Math.round(width / expectedRatio);
          resolve({
            valid: false,
            error: `Incorrect aspect ratio. Use 5:6 portrait (e.g., ${width}×${recommendedHeight}px or ${PRODUCT_IMAGE_DIMENSIONS.recommended.width}×${PRODUCT_IMAGE_DIMENSIONS.recommended.height}px). Yours: ${width}×${height}px`,
            dimensions: { width, height },
          });
          return;
        }

        resolve({
          valid: true,
          dimensions: { width, height },
          isRecommended: width === PRODUCT_IMAGE_DIMENSIONS.recommended.width && height === PRODUCT_IMAGE_DIMENSIONS.recommended.height,
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

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
const inputStyle = { padding: '9px 12px', border: `1px solid ${KM.border}`, borderRadius: 8, fontSize: 13, color: KM.text, background: '#fff', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box', textTransform: 'capitalize' };
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
  const [variantTab,    setVariantTab]    = useState('options');

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
        const k = normalKey(a.key);
        if (!optionMap[k]) optionMap[k] = new Set();
        optionMap[k].add(a.value);
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
    // Pre-seed skus with mapped existing variants so the VariantBuilder preserves their data
    setSkus(productVariants.map(variantToSku));
  }, [productId, mode, rows]);

  // ── Open ADD form ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setMode('add');
    setEditingId(null);
    setProductId('');
    setSkus([]);
    setExistingOptions(null);
    setErrors({});
    setVariantTab('options');
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
    setVariantTab('skus');
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

  // ── Validate (identical logic to Products.js validateProduct) ────────────
  const validateSkuRows = (skuList) => {
    return skuList.map((v) => {
      const messages = [];
      const mrp = Number(v.mrp);
      const salesPrice = Number(v.salesPrice);
      const stock = Number(v.stock);
      const hasAttribute =
        v.attributes?.some(a => a.key && (a.value || a.customValue)) ||
        v.combo?.some(a => a.key && a.value);

      if (!hasAttribute) messages.push('Add at least one attribute');
      if (!v.mrp) messages.push('Enter MRP');
      else if (Number.isNaN(mrp) || mrp <= 0) messages.push('MRP must be greater than 0');
      if (!v.salesPrice) messages.push('Enter sales price');
      else if (Number.isNaN(salesPrice) || salesPrice <= 0) messages.push('Sales price must be greater than 0');
      else if (!Number.isNaN(mrp) && mrp > 0 && salesPrice > mrp) messages.push('Sales price cannot be greater than MRP');
      if (v.stock === '' || v.stock === undefined || v.stock === null) messages.push('Enter stock');
      else if (Number.isNaN(stock) || stock < 0) messages.push('Stock cannot be negative');
      if (!v.imagePreview && !v.imageFile) messages.push('Upload a variant image');

      return messages;
    });
  };

  const validateAdd = () => {
    const next = {};
    if (!productId) next.productId = 'Please select a product';
    if (!skus.length) next.skus = 'Add at least one variant using the options above';
    else {
      const variantErrors = validateSkuRows(skus);
      if (variantErrors.some(list => list.length)) {
        next.variantErrors = variantErrors;
        setVariantTab('skus');
      }
    }
    setErrors(next);
    return !Object.keys(next).length;
  };

  const validateEdit = () => {
    const next = {};
    if (!productId) next.productId = 'Please select a product';
    if (!editSkus.length) {
      next.variantErrors = [['Add at least one attribute']];
    } else {
      const variantErrors = validateSkuRows(editSkus);
      if (variantErrors.some(list => list.length)) {
        next.variantErrors = variantErrors;
        setVariantTab('skus');
      }
    }
    setErrors(next);
    return !Object.keys(next).length;
  };

  // ── Async image dimension validation ──────────────────────────────────────
  const validateImageDimensions = async (skuList) => {
    for (let i = 0; i < skuList.length; i++) {
      const s = skuList[i];
      if (s.imageFile) {
        const result = await validateProductImageDimensions(s.imageFile);
        if (!result.valid) {
          setErrors(prev => ({
            ...prev,
            [`sku_${i}`]: `Image: ${result.error}`,
          }));
          return false;
        }
      }
    }
    return true;
  };

  // ── Submit ADD (differential sync) ────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!validateAdd()) return;
    
    // Validate image dimensions
    if (!(await validateImageDimensions(skus))) {
      showToast.error('One or more variant images have invalid dimensions');
      return;
    }

    // Retrieve existing variants of this product in database
    const existingDbVariants = rows.filter(r => String(r.productId) === String(productId));

    // Perform differential sync
    const toUpdate = skus.filter(s => s.id && !String(s.id).startsWith('new_'));
    const toCreate = skus.filter(s => !s.id || String(s.id).startsWith('new_'));
    const toDelete = existingDbVariants.filter(ev => !skus.some(s => String(s.id) === String(ev.id)));

    const totalOps = toUpdate.length + toCreate.length + toDelete.length;
    const tid = showToast.loading(`Syncing ${totalOps} variant operations…`);
    try {
      // 1. Delete removed combinations
      for (const v of toDelete) {
        await dispatch(removeVariant(v.id));
      }

      // 2. Update existing ones
      for (const s of toUpdate) {
        const attrs = s.combo?.length
          ? s.combo.map(c => ({ key: c.key, value: c.value }))
          : (s.attributes || []).filter(a => a.key && a.value);

        await dispatch(editVariant({
          id: s.id,
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
      }

      // 3. Create newly generated combinations
      for (const s of toCreate) {
        const attrs = s.combo?.length
          ? s.combo.map(c => ({ key: c.key, value: c.value }))
          : (s.attributes || []).filter(a => a.key && a.value);

        await dispatch(createVariant({
          productId,
          variantName: s.variantName,
          mrp:         s.mrp,
          salesPrice:  s.salesPrice,
          stock:       s.stock,
          status:      s.status || 'Active',
          attributes:  attrs,
          imageFile:   s.imageFile || undefined,
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
    
    // Validate image dimensions
    if (!(await validateImageDimensions(editSkus))) {
      showToast.error('One or more variant images have invalid dimensions');
      return;
    }

    const s = editSkus[0];
    const attrs = s.combo?.length
      ? s.combo.map(c => ({ key: c.key, value: c.value }))
      : (s.attributes || []).filter(a => a.key && a.value);

    const tid = showToast.loading(
      editSkus.length > 1
        ? `Updating variant + adding ${editSkus.length - 1} new…`
        : 'Updating variant…'
    );
    try {
      // Always update the original variant (editSkus[0])
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

      // If adding new option values created extra SKUs, save them as new variants
      if (editSkus.length > 1) {
        for (const newSku of editSkus.slice(1)) {
          const newAttrs = newSku.combo?.length
            ? newSku.combo.map(c => ({ key: c.key, value: c.value }))
            : (newSku.attributes || []).filter(a => a.key && a.value);
          await dispatch(createVariant({
            productId,
            variantName: newSku.variantName,
            mrp:         newSku.mrp         || s.mrp,
            salesPrice:  newSku.salesPrice  || s.salesPrice,
            stock:       newSku.stock       ?? 0,
            status:      newSku.status      || 'Active',
            attributes:  newAttrs,
            imageFile:   newSku.imageFile   || undefined,
          }));
        }
      }

      showToast.success(
        editSkus.length > 1
          ? `Variant updated + ${editSkus.length - 1} new variant${editSkus.length > 2 ? 's' : ''} created!`
          : 'Variant updated!',
        tid
      );
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
                  <div style={{ marginTop: 8, padding: '12px 16px', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, fontSize: 13, color: '#92400E', lineHeight: '1.5' }}>
                    <strong>⚠️ Cartesian Synchronization Warning:</strong> This product already has <strong>{existingOptions.length}</strong> option dimension{existingOptions.length > 1 ? 's' : ''} ({existingOptions.map(o => o.key).join(', ')}).
                    <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                      <li>To add new option values (e.g., a new color or size), add them to the existing option categories.</li>
                      <li><strong>Adding or changing option categories</strong> will regenerate the matrix. Any existing variants that do not match the new categories will be <strong>permanently deleted</strong> upon saving.</li>
                      <li>Check the <strong>📦 SKUs ({skus.length})</strong> tab to confirm the final list of variants before saving.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* VariantBuilder — same component used in Products */}
              {/* existingOptions seeds the option matrix with current product dimensions */}
              <VariantBuilder
                key={productId || 'no-product'}
                variants={skus}
                errors={errors.variantErrors ||
                  skus.map(() => [])
                }
                tab={variantTab}
                onTabChange={setVariantTab}
                onChange={setSkus}
                existingOptions={existingOptions || undefined}
              />
              <ErrorMsg field="skus" />
              {errors.variantErrors && (
                <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
                  ⚠ One or more variants are incomplete — switch to the <strong>📦 SKUs</strong> tab to fix them.
                </div>
              )}

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
                errors={errors.variantErrors ||
                  editSkus.map(() => [])
                }
                tab={variantTab}
                onTabChange={setVariantTab}
                onChange={(updated) => {
                  setEditSkus(updated);
                  if (updated[0]) setEditSku(updated[0]);
                }}
              />
              {errors.variantErrors && (
                <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
                  ⚠ One or more variants are incomplete — switch to the <strong>📦 SKUs</strong> tab to fix them.
                </div>
              )}

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