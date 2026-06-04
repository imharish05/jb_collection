import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import DataTable from '../DataTable/DataTable';
import { fetchProducts, createProduct, editProduct, removeProduct } from '../../redux/services/productsService';
import { fetchCategories } from '../../redux/services/categoriesService';
import { fetchBrands } from '../../redux/services/brandsService';
import { fetchEvents } from '../../redux/services/eventService';
import VariantBuilder from './VariantBuilder'; // ← make sure VariantBuilder.jsx is in the same folder
import { confirmDelete } from '../../utils/sweetalert';

const BASE_URL = process.env.REACT_APP_API_URL;
const IMG_URL = process.env.REACT_APP_IMG_URL;

// Product Image Dimension Validator (800×960px 5:6 portrait)
const PRODUCT_IMAGE_DIMENSIONS = {
  recommended: { width: 800, height: 960 },
  minimum: { width: 400, height: 480 },
  aspectRatio: 5 / 6,
  tolerance: 0.05,
  maxFileSize: 3 * 1024 * 1024, // 3MB
  formats: ['image/jpeg', 'image/webp','image/png'],
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

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  // Handle stringified array: "[\"uploads/products/123.jpeg\",...]"
  if (typeof imagePath === 'string' && imagePath.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(imagePath);
      imagePath = Array.isArray(parsed) ? parsed[0] : imagePath;
    } catch { /* fall through */ }
  }
  if (Array.isArray(imagePath)) imagePath = imagePath[0];
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const filename = imagePath.replace(/^\//, '').replace(/^uploads\//, '');
  return `${IMG_URL}/uploads/${filename}`;
};

// Convert a full URL back to the relative path the server stores (uploads/products/file.jpg)
const toRelativePath = (url) => {
  if (!url || url.startsWith('blob:')) return null;
  if (url.startsWith('http')) {
    // Strip protocol + host, then normalise leading slash
    try {
      const pathname = new URL(url).pathname; // e.g. /uploads/products/abc.jpg
      return pathname.replace(/^\//, ''); // → uploads/products/abc.jpg
    } catch { /* fall through */ }
  }
  // Already relative
  return url.replace(/^\//, '');
};
const KM = {
  orange: '#F15A24', orangeLight: '#FEF0EB', blue: '#1A3A6B',
  green: '#39B54A', teal: '#00B4D8', border: '#E5E7EB',
  text: '#1A1A2E', muted: '#6B7280', bg: '#F9FAFB',
};

// ── Styles ────────────────────────────────────────────────────────────────────
const formCard = { background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 };
const formHeader = { background: KM.blue, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 10 };
const headerIcon = { width: 32, height: 32, background: 'rgba(255,255,255,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 600 };
const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 5 };
const labelStyle = { fontSize: 11, fontWeight: 500, color: KM.muted, textTransform: 'uppercase', letterSpacing: '0.05em' };
const inputStyle = { padding: '9px 12px', border: `1px solid ${KM.border}`, borderRadius: 8, fontSize: 13, color: KM.text, background: '#fff', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box', textTransform: 'capitalize' };
const submitBtn = { gridColumn: 'span 2', padding: 11, background: KM.orange, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 };
const tag = (color, bg) => ({ fontSize: 10, fontWeight: 700, color, background: bg, padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap' });
const errorStyle = { fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 2 };

function stockColor(q) { return q === 0 ? '#dc2626' : q < 50 ? '#F59E0B' : '#39B54A'; }
function totalStock(p) { return p.Variants?.reduce((a, v) => a + Number(v.stock || 0), 0) ?? 0; }

// ── Blank variant (matches VariantBuilder's internal shape) ───────────────────
function blankVariantRow() {
  return { id: Date.now() + Math.random(), mrp: '', salesPrice: '', stock: '', attributes: [{ key: '', value: '', customValue: '' }], imageFile: null, imagePreview: null };
}

// ── Form defaults ─────────────────────────────────────────────────────────────
const BLANK_FORM = {
  productName: '', categoryId: '', categoryName: '', subCategoryId: '', subCategoryName: '',
  brandId: '', discount: '', shortDescription: '', fullDescription: '',
  tag: '', isCustomisable: true, isNewArrival: false, isHotDeal: false,
};

// ── EventTagSelector — searchable multi-tag picker from Events model ──────────
function EventTagSelector({ value, onChange }) {
  const { items: events } = useSelector(s => s.events || {});
  const [inputVal, setInputVal] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef();

  const selectedTags = value ? value.split(',').map(t => t.trim()).filter(Boolean) : [];

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const allEventLabels = (events || [])
    .filter(e => e.isActive !== false)
    .map(e => (e.value || e.label || '').toLowerCase().trim())
    .filter(Boolean);

  const filteredSuggestions = allEventLabels.filter(lbl =>
    lbl.includes(inputVal.toLowerCase()) && !selectedTags.map(t => t.toLowerCase()).includes(lbl)
  );

  const addTag = (tag) => {
    const t = tag.trim();
    if (!t || selectedTags.map(x => x.toLowerCase()).includes(t.toLowerCase())) return;
    onChange([...selectedTags, t].join(', '));
    setInputVal('');
    setOpen(false);
  };

  const removeTag = (idx) => {
    onChange(selectedTags.filter((_, i) => i !== idx).join(', '));
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && inputVal.trim()) {
      e.preventDefault();
      addTag(inputVal);
    }
    if (e.key === 'Backspace' && !inputVal && selectedTags.length) removeTag(selectedTags.length - 1);
    if (e.key === 'Escape') setOpen(false);
  };

  const blueFaint = '#EEF2FB';

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
          padding: '7px 10px', border: `1px solid ${open ? KM.teal : KM.border}`,
          borderRadius: 8, background: '#fff', minHeight: 40, cursor: 'text',
        }}
      >
        {selectedTags.map((tag, i) => (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: blueFaint, color: KM.blue, border: '1px solid #B8C9EE',
            borderRadius: 5, fontSize: 12, fontWeight: 600, padding: '2px 8px',
          }}>
            {tag}
            <span onClick={(e) => { e.stopPropagation(); removeTag(i); }}
              style={{ cursor: 'pointer', color: KM.muted, fontSize: 14, lineHeight: 1 }}>×</span>
          </span>
        ))}
        <input
          style={{ border: 'none', outline: 'none', padding: '3px 4px', fontSize: 13, background: 'transparent', fontFamily: 'inherit', minWidth: 140, flex: 1, color: KM.text }}
          value={inputVal}
          placeholder={selectedTags.length ? '' : 'Search or type event tag…'}
          onChange={e => { setInputVal(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)', marginTop: 4, maxHeight: 200, overflowY: 'auto',
        }}>
          {filteredSuggestions.map(lbl => (
            <div key={lbl} onMouseDown={(e) => { e.preventDefault(); addTag(lbl); }}
              style={{ padding: '8px 14px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = KM.bg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span>🏷️</span> {lbl}
            </div>
          ))}
          {inputVal.trim() && !allEventLabels.includes(inputVal.trim().toLowerCase()) && (
            <div onMouseDown={(e) => { e.preventDefault(); addTag(inputVal.trim()); }}
              style={{ padding: '8px 14px', cursor: 'pointer', fontSize: 13, color: KM.orange, fontWeight: 600, borderTop: filteredSuggestions.length ? `1px solid ${KM.border}` : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = KM.orangeLight}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              + Add "{inputVal.trim()}" as new tag
            </div>
          )}
          {!filteredSuggestions.length && !inputVal.trim() && (
            <div style={{ padding: '10px 14px', fontSize: 12, color: KM.muted }}>Type to search or create a tag…</div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function Products({ showToast }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { items: allProducts, loading } = useSelector(s => s.products || {});
  const { items: rawCategories } = useSelector(s => s.categories || {});
  const { items: brands } = useSelector(s => s.brands || {});

  // Safe checks: ensure categories and brands are normalized arrays to prevent runtime crashes
  const categories = Array.isArray(rawCategories) ? rawCategories : [];
  const safeBrands = Array.isArray(brands) ? brands : [];

  // ── Core state ────────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...BLANK_FORM });
  const [errors, setErrors] = useState({});

  // ── Variants — now managed by VariantBuilder ──────────────────────────────
  const [variants, setVariants] = useState([blankVariantRow()]);
  const [variantTab, setVariantTab] = useState('options'); // 'options' | 'skus'

  // ── Multi-image state ─────────────────────────────────────────────────────
  const [imageFiles, setImageFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [imageDimensionsMap, setImageDimensionsMap] = useState({});
  const [originalPreviews, setOriginalPreviews] = useState([]); // snapshot on edit open
  const fileInputRef = useRef();
  const variantBuilderRef = useRef();

  // ── SubCategories derived from selected category safely ───────────────────
  const selectedCategory = categories.find(c => String(c.id) === String(formData.categoryId));
  const productCategories = categories.filter(c => c.value !== null && c.value !== undefined && c.value !== '');

  const subCategories = selectedCategory?.subcategories || selectedCategory?.subCategories || selectedCategory?.SubCategories || [];

  console.log(selectedCategory, "This si the nsjn");

  // ── Scroll to VariantBuilder when tab forced to 'skus' on validation error ──
  useEffect(() => {
    if (variantTab === 'skus' && errors.variantErrors) {
      variantBuilderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [variantTab, errors.variantErrors]);

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchBrands());
    dispatch(fetchEvents());
    dispatch(fetchProducts());
  }, [location.search]);

  // ── Filter ────────────────────────────────────────────────────────────────
  const isLowStock = new URLSearchParams(location.search).get('filter') === 'lowstock';
  const rows = isLowStock
    ? [...(allProducts || [])].filter(p => totalStock(p) < 50).sort((a, b) => totalStock(a) - totalStock(b))
    : (allProducts || []);

  // ── Image handlers ────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (!selected.length) return;
    
    const currentLength = imageFiles.length;
    
    // Validate each file and add to state
    selected.forEach((file, idx) => {
      validateProductImageDimensions(file).then((result) => {
        setImageDimensionsMap(prev => ({
          ...prev,
          [currentLength + idx]: result,
        }));
      });
    });
    
    setImageFiles(prev => [...prev, ...selected]);
    setPreviews(prev => [...prev, ...selected.map(f => URL.createObjectURL(f))]);
    e.target.value = null;
  };

  const removeImage = (index) => {
    if (previews[index]?.startsWith('blob:')) URL.revokeObjectURL(previews[index]);
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    
    // Rebuild imageDimensionsMap with updated indices
    setImageDimensionsMap(prev => {
      const newMap = {};
      Object.entries(prev).forEach(([idx, val]) => {
        const idxNum = parseInt(idx, 10);
        if (idxNum < index) {
          newMap[idxNum] = val;
        } else if (idxNum > index) {
          newMap[idxNum - 1] = val;
        }
      });
      return newMap;
    });
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = () => {
    previews.forEach(url => { if (url?.startsWith('blob:')) URL.revokeObjectURL(url); });
    setEditingId(null);
    setShowForm(false);
    setFormData({ ...BLANK_FORM });
    setErrors({});
    setVariants([blankVariantRow()]);
    setVariantTab('options');
    setImageFiles([]);
    setPreviews([]);
    setImageDimensionsMap({});
    setOriginalPreviews([]);
  };

  // Cancel edit — restore original server images, discard local changes
  const handleCancel = () => {
    previews.forEach(url => { if (url?.startsWith('blob:')) URL.revokeObjectURL(url); });
    if (editingId) {
      // Restore snapshot taken when edit opened
      setPreviews([...originalPreviews]);
      setImageFiles([]);
      setImageDimensionsMap({});
      setShowForm(false);
      setEditingId(null);
      setFormData({ ...BLANK_FORM });
      setErrors({});
      setVariants([blankVariantRow()]);
      setVariantTab('options');
      setOriginalPreviews([]);
    } else {
      reset();
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleEdit = (p) => {
    const catName = p.Category?.name || p.Category?.label || '';
    const subCatId = p.subCategoryId || p.SubCategory?.id || '';
    const subCatName = p.SubCategory?.name || p.SubCategory?.label || '';

    setEditingId(p.id);
    setFormData({
      productName: p.name || '',
      categoryId: p.categoryId || '',
      categoryName: catName,
      subCategoryId: subCatId,
      subCategoryName: subCatName,
      brandId: p.brandId || '',
      discount: p.discount ?? '',
      shortDescription: p.shortDescription || '',
      fullDescription: p.fullDescription || '',
      tag: Array.isArray(p.tag) ? p.tag.join(', ') : (p.tag || ''),
      isCustomisable: p.isCustomisable !== false,
      isNewArrival: !!p.isNew,
      isHotDeal: !!p.isHotDeal,
    });

    // ── Map existing variants → VariantBuilder shape ──────────────────────
    setVariants(
      p.Variants?.length
        ? p.Variants.map(v => {
          const rawAttrs = v.attributes;
          const parsedAttrs = typeof rawAttrs === 'string'
            ? (() => { try { return JSON.parse(rawAttrs); } catch { return []; } })()
            : (Array.isArray(rawAttrs) ? rawAttrs : []);

          const parseVariantName = (name) => {
            if (!name || name === 'Default') return [];
            return name.split(' · ').map(part => {
              const ci = part.indexOf(': ');
              if (ci === -1) return { key: 'Custom Note', value: part.trim(), customValue: '' };
              return { key: part.slice(0, ci).trim(), value: part.slice(ci + 2).trim(), customValue: '' };
            }).filter(a => a.key && a.value);
          };

          const builtAttrs = parsedAttrs.length > 0
            ? parsedAttrs.map(a => ({ key: a.key, value: a.value, customValue: '' }))
            : (() => {
              const fromFlat = [
                v.colour ? { key: 'Colour', value: v.colour, customValue: '' } : null,
                v.size ? { key: 'Size', value: v.size, customValue: '' } : null,
                v.material ? { key: 'Material', value: v.material, customValue: '' } : null,
                v.finish ? { key: 'Finish', value: v.finish, customValue: '' } : null,
                v.weight ? { key: 'Weight', value: v.weight, customValue: '' } : null,
                v.dimensions ? { key: 'Dimensions', value: v.dimensions, customValue: '' } : null,
                v.engraving ? { key: 'Engraving', value: v.engraving, customValue: '' } : null,
                v.printText ? { key: 'Print Text', value: v.printText, customValue: '' } : null,
                v.customLabel ? { key: 'Custom Note', value: v.customLabel, customValue: '' } : null,
              ].filter(Boolean);
              return fromFlat.length > 0 ? fromFlat : parseVariantName(v.variantName);
            })();

          return {
            id: v.id || Date.now() + Math.random(),
            open: false,
            mrp: v.mrp || '',
            salesPrice: v.salesPrice || '',
            stock: v.stock ?? '',
            status: v.status || 'Active',
            imageFile: null,
            imagePreview: v.image ? getImageUrl(v.image) : null,
            combo: builtAttrs.map(a => ({ key: a.key, value: a.value })),
            variantName: v.variantName || builtAttrs.map(a => `${a.key}: ${a.value}`).join(' · '),
            attributes: builtAttrs.length > 0 ? builtAttrs : [{ key: '', value: '', customValue: '' }],
          };
        })
        : [blankVariantRow()]
    );

    const imgs = p.images || (p.image ? (Array.isArray(p.image) ? p.image : [p.image]) : []);
    const mappedImgs = imgs.map(img => getImageUrl(img));
    setPreviews(mappedImgs);
    setOriginalPreviews(mappedImgs); // snapshot for cancel
    setImageFiles([]);
    setImageDimensionsMap({});
    setErrors({});
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getFirstInvalidImageError = () =>
    Object.values(imageDimensionsMap).find(result => result && !result.valid)?.error;

  const ErrorMsg = ({ field }) => {
    const message = field === 'images'
      ? (errors[field] || getFirstInvalidImageError())
      : errors[field];

    return message ? <span style={errorStyle}>{field === 'images' ? `⚠ ${message}` : message}</span> : null;
  };

  const validateProduct = () => {
    const next = {};
    const discount = Number(formData.discount || 0);
    const variantErrors = [];

    if (!formData.productName.trim()) next.productName = 'Product Name is required';
    if (!formData.categoryId) next.categoryId = 'Please select a category';
    if (Number.isNaN(discount) || discount < 0 || discount > 100) next.discount = 'Discount must be between 0 and 100';
    if (!variants.length) next.variants = 'Please add at least one variant';

    variants.forEach((v, index) => {
      const messages = [];
      const mrp = Number(v.mrp);
      const salesPrice = Number(v.salesPrice);
      const stock = Number(v.stock);
      const hasAttribute = v.attributes?.some(a => a.key && (a.value || a.customValue));

      if (!hasAttribute) messages.push('Add at least one attribute');
      if (!v.mrp) messages.push('Enter MRP');
      else if (Number.isNaN(mrp) || mrp <= 0) messages.push('MRP must be greater than 0');
      if (!v.salesPrice) messages.push('Enter sales price');
      else if (Number.isNaN(salesPrice) || salesPrice <= 0) messages.push('Sales price must be greater than 0');
      else if (!Number.isNaN(mrp) && mrp > 0 && salesPrice > mrp) messages.push('Sales price cannot be greater than MRP');
      if (v.stock === '') messages.push('Enter stock');
      else if (Number.isNaN(stock) || stock < 0) messages.push('Stock cannot be negative');

      if (!v.imagePreview && !v.imageFile) messages.push('Upload a variant image');

      variantErrors[index] = messages;
    });

    if (variantErrors.some(list => list.length)) {
      next.variantErrors = variantErrors;
      setVariantTab('skus');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateProduct()) return;
    const fd = new FormData();
    fd.append('productName', formData.productName);
    fd.append('categoryId', formData.categoryId);
    fd.append('brandId', formData.brandId);
    fd.append('discount', formData.discount || 0);
    fd.append('shortDescription', formData.shortDescription);
    fd.append('fullDescription', formData.fullDescription);
    fd.append('isNewArrival', formData.isNewArrival);
    fd.append('isCustomisable', formData.isCustomisable);
    fd.append('isHotDeal', formData.isHotDeal);

    if (formData.subCategoryId) fd.append('subCategoryId', formData.subCategoryId);
    if (formData.subCategoryName) fd.append('subCategoryName', formData.subCategoryName);

    const baseTags = formData.tag ? formData.tag.split(',').map(t => t.trim()).filter(Boolean) : [];
    if (formData.isCustomisable && !baseTags.includes('customisable')) baseTags.push('customisable');
    if (formData.isNewArrival   && !baseTags.includes('new-arrival'))  baseTags.push('new-arrival');
    if (formData.isHotDeal      && !baseTags.includes('hot-deal'))      baseTags.push('hot-deal');
    fd.append('tag', JSON.stringify(baseTags));

    // ── Map VariantBuilder state → API payload ────────────────────────────
    const mappedVariants = variants.map((v, idx) => {
      const variantName = v.attributes
        .map(a => {
          const val = a.value === 'Custom' ? (a.customValue || 'Custom') : a.value;
          return val ? (a.key ? `${a.key}: ${val}` : val) : '';
        })
        .filter(Boolean)
        .join(' · ') || 'Default';

      const attributes = v.attributes
        .filter(a => a.key && (a.value || a.customValue))
        .map(a => ({
          key: a.key,
          value: a.value === 'Custom' ? (a.customValue || 'Custom') : a.value,
        }));

      const findAttr = (key) => {
        const found = attributes.find(a => a.key === key);
        return found ? found.value : '';
      };

      return {
        variantName,
        attributes,
        mrp: v.mrp,
        salesPrice: v.salesPrice,
        stock: v.stock,
        unit: findAttr('Size') || findAttr('Capacity') || 'Free Size',
        colour: findAttr('Colour'),
        size: findAttr('Size') || findAttr('Capacity'),
        material: findAttr('Material'),
        finish: findAttr('Finish'),
        weight: findAttr('Weight'),
        dimensions: findAttr('Dimensions'),
        engraving: findAttr('Engraving'),
        printText: findAttr('Print Text'),
        customLabel: findAttr('Custom Note'),
        subCategory: findAttr('Sub-type'),
        image: (!v.imageFile && v.imagePreview && !v.imagePreview.startsWith('blob:'))
          ? toRelativePath(v.imagePreview) : undefined,
        variantImageIndex: v.imageFile ? idx : undefined,
        status: v.status || 'Active',
      };
    });

    fd.append('variants', JSON.stringify(mappedVariants));

    variants.forEach((v, idx) => {
      if (v.imageFile) fd.append(`variantImage_${idx}`, v.imageFile);
    });

    imageFiles.forEach(file => fd.append('images', file));
    const savedImages = previews
      .filter(url => url && !url.startsWith('blob:'))
      .map(url => toRelativePath(url))
      .filter(Boolean);
    if (savedImages.length) fd.append('existingImages', JSON.stringify(savedImages));

    const tid = showToast.loading(editingId ? 'Updating…' : 'Adding…');
    try {
      if (editingId) {
        await dispatch(editProduct({ id: editingId, formData: fd }));
        showToast.success('Updated!', tid);
      } else {
        await dispatch(createProduct(fd));
        showToast.success('Added!', tid);
      }
      reset();
      dispatch(fetchProducts());
    } catch (err) {
      showToast.error(err?.response?.data?.message || 'Operation failed', tid);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    confirmDelete({
      title: 'Delete Product?',
      message: 'Are you sure you want to delete this product?',
      onConfirm: async () => {
        try {
          await dispatch(removeProduct(id));
        } catch (err) {
          console.error('Failed to delete product:', err);
        }
      },
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="section-title">Products Management</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isLowStock && (
            <button className="action-btn" onClick={() => window.location.href = '/products'}
              style={{ background: '#eee', color: '#333' }}>Clear Filter</button>
          )}
          <button className="action-btn btn-edit" onClick={() => showForm ? handleCancel() : setShowForm(true)}>
            {showForm ? 'Close' : '+ Add Product'}
          </button>
        </div>
      </div>

      {showForm && (
        <div style={formCard}>
          <div style={formHeader}>
            <div style={headerIcon}>🎁</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>
                {editingId ? 'Edit Product' : 'Add New Product'}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 }}>
                Kamali Gift Factory — product details &amp; variants
              </div>
            </div>
          </div>

          <div style={{ padding: '20px 24px 24px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
                <label style={labelStyle}>Product Name *</label>
                <input style={inputStyle} required value={formData.productName}
                  onChange={e => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="e.g. Personalised Bracelet, Return Gift Hamper" />
                <ErrorMsg field="productName" />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Category *</label>
                <select style={inputStyle} value={formData.categoryId}
                  onChange={e => {
                    const cat = productCategories.find(c => String(c.id) === String(e.target.value));
                    setFormData({
                      ...formData,
                      categoryId: e.target.value,
                      categoryName: cat?.name || cat?.label || '',
                      subCategoryId: '',
                      subCategoryName: '',
                    });
                  }}>
                  <option value="">Select Category</option>
                  {productCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name || c.label}</option>
                  ))}
                </select>
                <ErrorMsg field="categoryId" />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>
                  Sub-Category
                  {subCategories.length === 0 && formData.categoryId && (
                    <span style={{ marginLeft: 6, fontSize: 10, color: KM.muted, textTransform: 'none', fontWeight: 400 }}>
                      (none for this category)
                    </span>
                  )}
                </label>
                {subCategories.length > 0 ? (
                  <select
                    style={inputStyle}
                    value={formData.subCategoryId}
                    onChange={e => {
                      const sub = subCategories.find(s => String(s.id) === String(e.target.value));
                      setFormData({
                        ...formData,
                        subCategoryId: e.target.value,
                        subCategoryName: sub?.label || sub?.name || '',
                      });
                    }}
                  >
                    <option value="">Select Sub-Category</option>
                    {subCategories.map(s => (
                      <option key={s.id} value={s.id}>{s.label || s.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    style={{
                      ...inputStyle,
                      background: formData.categoryId ? '#fff' : KM.bg,
                      color: formData.categoryId ? KM.text : KM.muted,
                    }}
                    placeholder={formData.categoryId ? 'Type sub-category (optional)' : 'Select a category first'}
                    disabled={!formData.categoryId}
                    value={formData.subCategoryName}
                    onChange={e => setFormData({ ...formData, subCategoryName: e.target.value, subCategoryId: '' })}
                  />
                )}
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Brand (Optional)</label>
                <select style={inputStyle} value={formData.brandId}
                  onChange={e => setFormData({ ...formData, brandId: e.target.value })}>
                  <option value="">Select Brand</option>
                  {safeBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div style={{ ...fieldStyle }}>
                <label style={labelStyle}>Event Tags</label>
                <EventTagSelector
                  value={formData.tag}
                  onChange={val => setFormData({ ...formData, tag: val })}
                />
                <span style={{ fontSize: 11, color: KM.muted, marginTop: 3 }}>
                  Search from events or type a new tag and press Enter
                </span>
              </div>

              <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
                <label style={labelStyle}>Short Description</label>
                <input style={inputStyle} value={formData.shortDescription}
                  onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="e.g. Handcrafted crochet gift box with personalised name tag" />
              </div>

              <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
                <label style={labelStyle}>Full Description</label>
                <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                  value={formData.fullDescription}
                  onChange={e => setFormData({ ...formData, fullDescription: e.target.value })}
                  placeholder="Materials, dimensions, customisation details, delivery time…" />
              </div>

              <div ref={variantBuilderRef} style={{ gridColumn: 'span 2' }}>
                <VariantBuilder variants={variants} errors={errors.variantErrors || []} tab={variantTab} onTabChange={setVariantTab} onChange={(updated) => {
                  setVariants(updated);
                  const first = updated[0];
                  if (first?.mrp && first?.salesPrice && Number(first.mrp) > 0) {
                    const auto = Math.round((1 - Number(first.salesPrice) / Number(first.mrp)) * 100);
                    if (auto >= 0 && auto <= 100) setFormData(f => ({ ...f, discount: String(auto) }));
                  }
                }} />
              </div>
              <div style={{ gridColumn: 'span 2', marginTop: -10 }}>
                <ErrorMsg field="variants" />
              </div>

              {/* ── Final Discount ── */}
              <div style={{
                gridColumn: 'span 2',
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
                padding: '14px 16px',
                background: '#fff',
                border: `1px solid ${KM.border}`,
                borderRadius: 10,
              }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Final Discount (%)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      style={{ ...inputStyle, paddingRight: 80 }}
                      type="number" min="0" max="100"
                      value={formData.discount}
                      placeholder="0"
                      onChange={e => setFormData({ ...formData, discount: e.target.value })}
                    />
                    <ErrorMsg field="discount" />
                    {formData.discount > 0 && (
                      <span style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        fontSize: 11, fontWeight: 700, color: KM.orange,
                        background: KM.orangeLight, padding: '2px 8px', borderRadius: 4,
                      }}>{formData.discount}% OFF</span>
                    )}
                  </div>
                </div>
                <div style={{ ...fieldStyle, justifyContent: 'flex-end' }}>
                  {(() => {
                    const mrp = Number(variants[0]?.mrp);
                    const disc = Number(formData.discount);
                    if (!mrp || !disc) return null;
                    const effective = (mrp * (1 - disc / 100)).toFixed(2);
                    return (
                      <div style={{
                        padding: '9px 12px', background: KM.bg,
                        border: `1px solid ${KM.border}`, borderRadius: 8,
                        fontSize: 13, color: KM.text, display: 'flex', gap: 10, alignItems: 'center',
                      }}>
                        <span style={{ color: KM.muted, fontSize: 11, textDecoration: 'line-through' }}>₹{mrp}</span>
                        <span style={{ fontWeight: 700, color: KM.green }}>₹{effective}</span>
                        <span style={{ fontSize: 11, color: KM.orange, fontWeight: 600 }}>Save {disc}%</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', gap: 20, flexWrap: 'wrap', padding: '12px 14px', background: KM.orangeLight, borderRadius: 8 }}>
                {[
                  { key: 'isCustomisable', label: '🎨 Customisable' },
                  { key: 'isNewArrival', label: '✨ New Arrival' },
                  { key: 'isHotDeal', label: '🔥 Hot Deal' },
                ].map(item => (
                  <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                    <input type="checkbox" checked={!!formData[item.key]}
                      onChange={e => setFormData({ ...formData, [item.key]: e.target.checked })} />
                    {item.label}
                  </label>
                ))}
              </div>

              {/* Hidden file input kept for programmatic use; gallery UI removed */}
              <input ref={fileInputRef} type="file" multiple accept="image/*"
                style={{ display: 'none' }} onChange={handleFileChange} />

              <div className="km-form-actions km-field-full" style={{display : "flex",gap : "10px"}}>
                <button type="submit" className="km-btn-submit">
                  {editingId ? 'Update Product' : 'Save Product'}
                </button>
                {editingId && (
                  <button type="button" className="km-btn-cancel" onClick={handleCancel}
                    >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <p style={{ padding: 20 }}>Loading Products...</p> : (
        <DataTable
          columns={['No.', 'Gallery', 'Product', 'Category', 'Sub-Cat', 'Price', 'Disc', 'Stock', 'Variants', 'Flags', 'Actions']}
          initialRows={rows}
          renderRow={(row, i) => {
            const firstVar = row.Variants?.[0];
            const stock = totalStock(row);
            const productImgs = row.images || (row.image ? (Array.isArray(row.image) ? row.image : [row.image]) : []);
            const variantImgs = (row.Variants || []).map(v => v.image).filter(Boolean);
            const imgs = productImgs.length ? productImgs : variantImgs;
            return (
              <tr key={row.id}>
                <td style={{ color: KM.muted, fontSize: 11 }}>{i + 1}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {imgs.slice(0, 3).map((img, idx) => (
                      <img key={idx} src={getImageUrl(img)} alt=""
                        width="36" height="36"
                        style={{ borderRadius: 7, objectFit: 'cover', border: `1px solid ${KM.border}` }} />
                    ))}
                    {imgs.length > 3 && (
                      <div style={{
                        width: 36, height: 36, borderRadius: 7,
                        background: KM.bg, border: `1px solid ${KM.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: KM.muted, fontWeight: 600,
                      }}>+{imgs.length - 3}</div>
                    )}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{row.name}</div>
                  {row.shortDescription && (
                    <div style={{ fontSize: 11, color: KM.muted, marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.shortDescription}
                    </div>
                  )}
                </td>
                <td style={{ fontSize: 12, fontWeight: 500 }}>
                  {row.Category?.name || row.Category?.label || '—'}
                </td>
                <td style={{ fontSize: 12, color: KM.muted, textTransform: "capitalize" }} className='text-capitalize'>
                  {row.SubCategory?.label || row.subCategoryName || '—'}
                </td>
                <td style={{ fontWeight: 700 }}>₹{firstVar?.salesPrice ?? row.price ?? 0}</td>
                <td>
                  {row.discount > 0
                    ? <span style={tag(KM.orange, KM.orangeLight)}>{row.discount}% off</span>
                    : <span style={{ color: KM.muted }}>—</span>}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: stockColor(stock) }} />
                    <span style={{ fontWeight: 700, color: stockColor(stock) }}>{stock}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, maxWidth: 160 }}>
                    {row.Variants?.slice(0, 4).map((v, j) => {
                      const attrs = Array.isArray(v.attributes) ? v.attributes : [];
                      const label = attrs.length
                        ? attrs.map(a => a.value).filter(Boolean).join(' / ')
                        : [v.subCategory, v.colour, v.size, v.material].filter(Boolean).join(' / ')
                        || v.variantName || '—';
                      return (
                        <span key={j} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#f0f4ff', color: KM.blue, border: `1px solid #c7d4f0`, fontWeight: 500 }}>
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {row.isNew && <span style={tag(KM.green, '#ecfdf5')}>NEW</span>}
                    {row.isCustomisable && <span style={tag(KM.teal, '#ecfeff')}>CUSTOM</span>}
                    {row.isHotDeal && <span style={tag(KM.orange, KM.orangeLight)}>HOT DEAL</span>}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="action-btn btn-edit" onClick={() => handleEdit(row)}>Edit</button>
                    <button className="action-btn btn-del" onClick={() => handleDelete(row.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            );
          }}
        />
      )}
    </div>
  );
}