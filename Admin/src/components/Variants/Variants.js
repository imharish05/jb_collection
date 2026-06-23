import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../DataTable/DataTable';
import { fetchVariants, createVariant, editVariant, removeVariant } from '../../redux/services/variantsService';
import { fetchProducts } from '../../redux/services/productsService';
import VariantBuilder, { renderVariantLabel, AttributeRow, normalizeOptionKey } from '../Products/VariantBuilder';
import { confirmDelete } from '../../utils/sweetalert';
import { hasPermission } from '../../utils/authHelper';

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

function safeAttrs(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
}

// Product Image Dimension Validator (800×960px 5:6 portrait)
const PRODUCT_IMAGE_DIMENSIONS = {
  width: 800,
  height: 960,
  aspectRatio: 5 / 6,
  tolerance: 0.05,
  maxFileSize: 3 * 1024 * 1024,
  formats: [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'image/svg+xml', 'image/bmp', 'image/tiff', 'image/x-icon',
    'image/heic', 'image/heif', 'image/avif'
  ],
};

const validateProductImageDimensions = (file) => {
  return new Promise((resolve) => {
    if (file.size > PRODUCT_IMAGE_DIMENSIONS.maxFileSize) {
      resolve({ valid: false, error: `File too large. Max: 3MB. You have: ${(file.size / 1024 / 1024).toFixed(2)}MB` });
      return;
    }
    if (!PRODUCT_IMAGE_DIMENSIONS.formats.includes(file.type)) {
      resolve({ valid: false, error: `Invalid format. Use common image formats (JPG, PNG, WebP, GIF, SVG, BMP, TIFF, ICO, HEIC, HEIF, AVIF). You have: ${file.type || 'unknown'}` });
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
         if (ratioDiff > PRODUCT_IMAGE_DIMENSIONS.tolerance) {
           resolve({
             valid: false,
             error: `Incorrect aspect ratio. Use 5:6 (${PRODUCT_IMAGE_DIMENSIONS.width}×${PRODUCT_IMAGE_DIMENSIONS.height}px). Yours: ${width}×${height}px`,
             dimensions: { width, height },
           });
           return;
         }
         resolve({
           valid: true,
           dimensions: { width, height },
         });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// Convert a saved variant row → VariantBuilder SKU shape
function variantToSku(v) {
  const parseVariantName = (name) => {
    if (!name || name === 'Default') return [];
    return name.split(/\s*(?:·|\||,|\/|-)\s*/).map(part => {
      const ci = part.indexOf(':');
      if (ci === -1) return { key: 'Custom Note', value: part.trim(), customValue: '' };
      return { key: part.slice(0, ci).trim(), value: part.slice(ci + 1).trim(), customValue: '' };
    }).filter(a => a.key && a.value);
  };

  const nameAttrs = parseVariantName(v.variantName);
  const rawAttrs = v.attributes;
  const parsedAttrs = safeAttrs(rawAttrs);

  // HEAL LOGIC: If parsed attributes from variantName do not match DB attributes,
  // automatically heal DB attributes to match the name-based ones.
  let finalAttrs = parsedAttrs;
  if (nameAttrs.length > 0) {
    const matches = nameAttrs.every(na =>
      parsedAttrs.some(pa =>
        na.key.toLowerCase() === pa.key.toLowerCase() &&
        na.value.toLowerCase() === pa.value.toLowerCase()
      )
    );
    if (!matches || parsedAttrs.length !== nameAttrs.length) {
      finalAttrs = nameAttrs;
    }
  }

  const combo = finalAttrs
    .filter(a => a.key && a.value && a.key !== 'Custom Note')
    .map(a => ({ key: a.key, value: a.value }));

  let dims = v.shippingDimensions;
  if (typeof dims === 'string') {
    try { dims = JSON.parse(dims); } catch (e) { dims = {}; }
  } else {
    dims = dims || {};
  }

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
    attributes:   finalAttrs,
    shippingWeight: v.shippingWeight ? String(v.shippingWeight) : '',
    shippingLength: dims.length ? String(dims.length) : '',
    shippingBreadth: dims.breadth ? String(dims.breadth) : '',
    shippingHeight: dims.height ? String(dims.height) : '',
  };
}

const formCard   = { background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 12, marginBottom: 20 };
const formHeader = { background: KM.blue, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 10, borderTopLeftRadius: 11, borderTopRightRadius: 11 };
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
  const { settings: invSettings } = useSelector(state => state.notifications);

  const stockColor = (qty) => {
    const high   = invSettings?.highStockThreshold   ?? 51;
    const medium = invSettings?.mediumStockThreshold  ?? 11;
    if (qty === 0)    return KM.red;
    if (qty < medium) return KM.red;
    if (qty < high)   return '#F59E0B';
    return KM.green;
  };

  // mode: 'none' | 'add' | 'edit'
  const [mode,          setMode]          = useState('none');
  const [editingId,     setEditingId]     = useState(null);
  const [productId,     setProductId]     = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [errors,        setErrors]        = useState({});
  const [variantTab,    setVariantTab]    = useState('options');

  // For ADD — always starts blank, no pre-seeding
  const [skus, setSkus] = useState([]);

  // For EDIT — single SKU loaded from the row being edited
  const [editSku,  setEditSku]  = useState(null);

  useEffect(() => {
    dispatch(fetchVariants());
    dispatch(fetchProducts());
  }, [dispatch]);

  // ── Reset skus when productId changes in add mode ─────────────────────────
  // No pre-seeding — always blank builder regardless of existing variants
  useEffect(() => {
    if (mode !== 'add') return;
    setSkus([]);
  }, [productId, mode]);

  const [existingKeys, setExistingKeys] = useState([]);

  useEffect(() => {
    if (!productId) {
      setExistingKeys([]);
      return;
    }
    const productVariants = rows.filter(r => String(r.productId) === String(productId));
    const keys = new Set();
    productVariants.forEach(v => {
      const attrs = safeAttrs(v.attributes);
      attrs.forEach(a => {
        if (a.key && a.key !== 'Custom Note') {
          keys.add(normalizeOptionKey(a.key));
        }
      });
    });
    setExistingKeys([...keys]);
  }, [productId, rows]);

  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrors(prev => ({ ...prev, image: null }));
    validateProductImageDimensions(file).then((result) => {
      if (!result.valid) {
        setErrors(prev => ({ ...prev, image: result.error }));
        e.target.value = null;
        return;
      }
      setEditSku(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      }));
    });
  };

  // ── Open ADD form ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setMode('add');
    setEditingId(null);
    setProductId('');
    setSkus([]);
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
    if (!sku.attributes || sku.attributes.length === 0) {
      sku.attributes = [{ key: '', value: '', customValue: '' }];
    }
    setEditSku(sku);
    setErrors({});
    setVariantTab('skus');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setMode('none');
    setEditingId(null);
    setSkus([]);
    setEditSku(null);
    setErrors({});
  };

  // ── Validate SKU rows ─────────────────────────────────────────────────────
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
    if (!editSku) return false;

    const mrp = Number(editSku.mrp);
    const salesPrice = Number(editSku.salesPrice);
    const stock = Number(editSku.stock);
    const hasAttribute = editSku.attributes?.some(a => a.key && a.value);

    if (!hasAttribute) next.attributes = 'Add at least one attribute';
    if (!editSku.mrp) next.mrp = 'Enter MRP';
    else if (Number.isNaN(mrp) || mrp <= 0) next.mrp = 'MRP must be greater than 0';

    if (!editSku.salesPrice) next.salesPrice = 'Enter sales price';
    else if (Number.isNaN(salesPrice) || salesPrice <= 0) next.salesPrice = 'Sales price must be greater than 0';
    else if (!Number.isNaN(mrp) && mrp > 0 && salesPrice > mrp) next.salesPrice = 'Sales price cannot be greater than MRP';

    if (editSku.stock === '' || editSku.stock === undefined || editSku.stock === null) next.stock = 'Enter stock';
    else if (Number.isNaN(stock) || stock < 0) next.stock = 'Stock cannot be negative';

    if (!editSku.imagePreview && !editSku.imageFile) next.image = 'Upload a variant image';

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
          setErrors(prev => ({ ...prev, [`sku_${i}`]: `Image: ${result.error}` }));
          return false;
        }
      }
    }
    return true;
  };

  // ── Submit ADD ────────────────────────────────────────────────────────────
  // Simple create-only — no differential sync since add mode is always blank.
  // All skus in the builder are new (new_ prefix), just POST each one.
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!validateAdd()) return;
    if (!(await validateImageDimensions(skus))) {
      showToast.error('One or more variant images have invalid dimensions');
      return;
    }

    const tid = showToast.loading(`Creating ${skus.length} variant${skus.length > 1 ? 's' : ''}…`);
    try {
      for (const s of skus) {
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
    
    if (editSku.imageFile) {
      const result = await validateProductImageDimensions(editSku.imageFile);
      if (!result.valid) {
        showToast.error(`Image: ${result.error}`);
        return;
      }
    }

    const tid = showToast.loading('Updating variant…');
    try {
      const attrs = (editSku.attributes || []).filter(a => a.key && a.value);
      const variantName = attrs.map(a => `${a.key}: ${a.value}`).join(' · ') || 'Default';

      const dims = (editSku.shippingLength || editSku.shippingBreadth || editSku.shippingHeight) ? {
        length: editSku.shippingLength ? parseFloat(editSku.shippingLength) : 0,
        breadth: editSku.shippingBreadth ? parseFloat(editSku.shippingBreadth) : 0,
        height: editSku.shippingHeight ? parseFloat(editSku.shippingHeight) : 0,
      } : null;

      await dispatch(editVariant({
        id: editingId,
        data: {
          productId,
          variantName,
          mrp:         editSku.mrp,
          salesPrice:  editSku.salesPrice,
          stock:       editSku.stock,
          status:      editSku.status || 'Active',
          attributes:  attrs,
          imageFile:   editSku.imageFile || undefined,
          shippingWeight: editSku.shippingWeight !== '' ? parseFloat(editSku.shippingWeight) : null,
          shippingDimensions: dims,
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
          {(hasPermission('variants_create') || mode !== 'none') && (
            <button className="action-btn btn-edit" style={{ padding: '7px 16px', fontSize: 13 }}
              onClick={mode !== 'none' ? closeForm : openAdd}>
              {mode !== 'none' ? '✕ Close' : '+ Add Variant'}
            </button>
          )}
        </div>
      </div>

      {/* ── ADD form ──────────────────────────────────────────────────────── */}
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
                  setSkus([]);
                }}>
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name || p.productName}</option>)}
                </select>
                <ErrorMsg field="productId" />
                {existingKeys.length > 0 && (
                  <div style={{
                    padding: '10px 14px',
                    background: '#FFFBEB',
                    border: '1px solid #F59E0B',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#B45309',
                    fontWeight: 500,
                    marginTop: 8,
                    lineHeight: 1.4
                  }}>
                    💡 <strong>Note:</strong> There is already variants with the difference in {existingKeys.join(', ')}. The new variants will be added as separate options without affecting or merging with the existing ones.
                  </div>
                )}
              </div>

              {/* VariantBuilder — blank matrix, no existingOptions seeding */}
              <VariantBuilder
                key={productId || 'no-product'}
                variants={skus}
                errors={errors.variantErrors || skus.map(() => [])}
                tab={variantTab}
                onTabChange={setVariantTab}
                onChange={setSkus}
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

      {/* ── EDIT form ─────────────────────────────────────────────────────── */}
      {mode === 'edit' && editSku && (
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

              {/* Variant Details Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>MRP (₹) *</label>
                  <input
                    style={inputStyle}
                    type="number" step="0.01" min="0" required
                    value={editSku.mrp}
                    onChange={e => setEditSku({ ...editSku, mrp: e.target.value })}
                  />
                  <ErrorMsg field="mrp" />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Sale Price (₹) *</label>
                  <input
                    style={inputStyle}
                    type="number" step="0.01" min="0" required
                    value={editSku.salesPrice}
                    onChange={e => setEditSku({ ...editSku, salesPrice: e.target.value })}
                  />
                  <ErrorMsg field="salesPrice" />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Stock *</label>
                  <input
                    style={inputStyle}
                    type="number" min="0" required
                    value={editSku.stock}
                    onChange={e => setEditSku({ ...editSku, stock: e.target.value })}
                  />
                  <ErrorMsg field="stock" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Status *</label>
                  <select style={inputStyle} value={editSku.status} onChange={e => setEditSku({ ...editSku, status: e.target.value })}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                
                {/* Variant Image Upload */}
                <div style={fieldStyle}>
                  <label style={labelStyle}>Variant Image *</label>
                  <input
                    type="file"
                    accept="image/*"
                    style={inputStyle}
                    onChange={handleEditImageChange}
                  />
                  {editSku.imagePreview && (
                    <div style={{ marginTop: 8, position: 'relative', width: 80, height: 96 }}>
                      <img src={editSku.imagePreview} alt="Preview" style={{ width: 80, height: 96, objectFit: 'cover', borderRadius: 6, border: '1px solid #ccc' }} />
                    </div>
                  )}
                  <ErrorMsg field="image" />
                </div>
              </div>

              {/* Shipping Overrides (Weight & Dimensions) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Weight (kg)</label>
                  <input
                    style={inputStyle}
                    type="number" step="0.001" min="0"
                    placeholder="e.g. 0.5"
                    value={editSku.shippingWeight || ''}
                    onChange={e => setEditSku({ ...editSku, shippingWeight: e.target.value })}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Length (cm)</label>
                  <input
                    style={inputStyle}
                    type="number" step="0.1" min="0"
                    placeholder="L"
                    value={editSku.shippingLength || ''}
                    onChange={e => setEditSku({ ...editSku, shippingLength: e.target.value })}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Breadth (cm)</label>
                  <input
                    style={inputStyle}
                    type="number" step="0.1" min="0"
                    placeholder="B"
                    value={editSku.shippingBreadth || ''}
                    onChange={e => setEditSku({ ...editSku, shippingBreadth: e.target.value })}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Height (cm)</label>
                  <input
                    style={inputStyle}
                    type="number" step="0.1" min="0"
                    placeholder="H"
                    value={editSku.shippingHeight || ''}
                    onChange={e => setEditSku({ ...editSku, shippingHeight: e.target.value })}
                  />
                </div>
              </div>

              {/* Attributes Section */}
              <div style={{ marginTop: 12 }}>
                <label style={{ ...labelStyle, marginBottom: 8, display: 'block' }}>Variant Attributes</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(editSku.attributes || []).map((attr, idx) => (
                    <AttributeRow
                      key={idx}
                      attr={attr}
                      allOtherSelected={(editSku.attributes || []).filter((_, i) => i !== idx).map(a => a.key).filter(Boolean)}
                      onChange={(updatedAttr) => {
                        const nextAttrs = [...editSku.attributes];
                        nextAttrs[idx] = updatedAttr;
                        setEditSku({ ...editSku, attributes: nextAttrs });
                      }}
                      onRemove={() => {
                        const nextAttrs = editSku.attributes.filter((_, i) => i !== idx);
                        setEditSku({ ...editSku, attributes: nextAttrs });
                      }}
                      isOnly={editSku.attributes.length <= 1}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextAttrs = [...(editSku.attributes || []), { key: '', value: '', customValue: '' }];
                    setEditSku({ ...editSku, attributes: nextAttrs });
                  }}
                  style={{
                    marginTop: 8, padding: '6px 12px', background: 'none', border: `1px dashed ${KM.teal}`,
                    color: KM.teal, borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600
                  }}
                >
                  + Add Attribute
                </button>
                <ErrorMsg field="attributes" />
              </div>

              <button type="submit" style={submitBtn}>Update Variant</button>
            </form>
          </div>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <p style={{ color: KM.muted, fontSize: 13 }}>Loading…</p>
      ) : (
        <DataTable
          columns={(() => {
            const cols = ['No.', 'Image', 'Product', 'Variant', 'MRP', 'Sale Price', 'Stock', 'SKU', 'Status'];
            if (hasPermission('variants_edit') || hasPermission('variants_delete')) cols.push('Actions');
            return cols;
          })()}
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
              <td style={{ fontWeight: 600 }}>{renderVariantLabel(row.variantName)}</td>
              <td>₹{parseFloat(row.mrp || 0).toLocaleString('en-IN')}</td>
              <td style={{ fontWeight: 700 }}>₹{parseFloat(row.salesPrice || 0).toLocaleString('en-IN')}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: stockColor(row.stock) }} />
                  {row.stock ?? 0}
                </div>
              </td>
              <td style={{ fontSize: 11, color: KM.muted, fontFamily: 'monospace' }}>{row.sku || '—'}</td>
              <td>
                <span className={`status-pill ${row.status === 'Active' ? 'pill-active' : 'pill-inactive'}`}>
                  {row.status}
                </span>
              </td>
              {(hasPermission('variants_edit') || hasPermission('variants_delete')) && (
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {hasPermission('variants_edit') && (
                      <button className="action-btn btn-edit" onClick={() => openEdit(row)}>Edit</button>
                    )}
                    {hasPermission('variants_delete') && (
                      <button className="action-btn btn-del"  onClick={() => handleDelete(row.id)}>Delete</button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          )}
        />
      )}
    </div>
  );
}