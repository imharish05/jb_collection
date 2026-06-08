import { useState, useRef, useCallback, useEffect } from 'react';

const KM = {
  orange: '#F15A24', orangeLight: '#FEF0EB', blue: '#1A3A6B',
  green: '#39B54A', teal: '#00B4D8', border: '#E5E7EB',
  text: '#1A1A2E', muted: '#6B7280', bg: '#F9FAFB', blueFaint: '#EEF2FB',
  red: '#EF4444', redLight: '#FEF2F2',
};

// ── Variant Image Dimension Validator (same rules as product gallery) ─────────
const VARIANT_IMAGE_RULES = {
  recommended: { width: 800, height: 960 },
  minimum: { width: 400, height: 480 },
  aspectRatio: 5 / 6,
  tolerance: 0.05,
  maxFileSize: 3 * 1024 * 1024,
  formats: ['image/jpeg', 'image/webp', 'image/png'],
};

const validateVariantImage = (file) => {
  return new Promise((resolve) => {
    if (file.size > VARIANT_IMAGE_RULES.maxFileSize) {
      resolve({ valid: false, error: `File too large. Max 3MB. Yours: ${(file.size / 1024 / 1024).toFixed(2)}MB` });
      return;
    }
    if (!VARIANT_IMAGE_RULES.formats.includes(file.type)) {
      resolve({ valid: false, error: `Invalid format. Use JPG/WebP/PNG. Yours: ${file.type || 'unknown'}` });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        if (width < VARIANT_IMAGE_RULES.minimum.width || height < VARIANT_IMAGE_RULES.minimum.height) {
          resolve({ valid: false, error: `Too small. Min: ${VARIANT_IMAGE_RULES.minimum.width}×${VARIANT_IMAGE_RULES.minimum.height}px. Yours: ${width}×${height}px` });
          return;
        }
        const ratio = width / height;
        const diff = Math.abs(ratio - VARIANT_IMAGE_RULES.aspectRatio) / VARIANT_IMAGE_RULES.aspectRatio;
        if (diff > VARIANT_IMAGE_RULES.tolerance) {
          const rh = Math.round(width / VARIANT_IMAGE_RULES.aspectRatio);
          resolve({ valid: false, error: `Wrong ratio. Use 5:6 (e.g. ${width}×${rh}px). Yours: ${width}×${height}px` });
          return;
        }
        resolve({ valid: true });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// ── Predefined option types ────────────────────────────────────────────────────
export const OPTION_PRESETS = {
  'Colour':    [],
  'Size':      ['XS','S','M','L','XL','XXL','Free Size','Small','Medium','Large'],
  'Material':  ['Synthetic','Nylon','Korai Silk','Kalamkari','Transparent window bags ','Jute','Brass','Acrylic','Wood','Leather','Steel','Copper','Clay','Glass','Ceramic'],
  'Finish':    ['Matte','Glossy','Antique','Polished','Hand-painted','Mirror','Oxidised'],
  'Storage':   ['32GB','64GB','128GB','256GB','512GB','1TB'],
  'Style':     ['Classic','Modern','Vintage','Minimalist','Luxury','Rustic'],
  'Bundle':    ['Single','Pair','Set of 3','Set of 5','Set of 10'],
  'Capacity':  ['50ml','100ml','250ml','500ml','1L','1.5L','2L'],
  'Weight':    ['Light','Standard','Heavy'],
  'Design':    ['Cow','Cow and calf','Peacock','Lotus','Flowers','Elephant','Mandala','Standard','Heavy','Plain','Kolam','Wavey lines','Painted'],
};

const OPTION_KEYS = Object.keys(OPTION_PRESETS);

// ── Normalize value for duplicate detection ───────────────────────────────────
const norm = (v) => v.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
const isColourKey = (key) => /colou?r/i.test(key || '');
const isHexColor = (value) => /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value || '').trim());

// ── Cartesian product ─────────────────────────────────────────────────────────
function cartesian(arrays) {
  if (!arrays.length) return [];
  return arrays.reduce(
    (acc, arr) => acc.flatMap(combo => arr.map(v => [...combo, v])),
    [[]]
  );
}

// ── Build variant name from option combo ─────────────────────────────────────
function comboName(combo) {
  return combo.map(({ key, value }) => `${key}: ${value}`).join(' · ') || 'Default';
}

// ── Styles ────────────────────────────────────────────────────────────────────
const inp = {
  padding: '8px 10px', border: `1px solid ${KM.border}`, borderRadius: 7,
  fontSize: 13, color: KM.text, background: '#fff', fontFamily: 'inherit',
  outline: 'none', width: '100%', boxSizing: 'border-box',
};
const lbl = {
  fontSize: 11, fontWeight: 600, color: KM.muted,
  textTransform: 'uppercase', letterSpacing: '0.06em',
  display: 'block', marginBottom: 4,
};
const pill = (active) => ({
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '3px 10px 3px 12px', borderRadius: 20,
  fontSize: 12, fontWeight: 600, cursor: 'default',
  background: active ? KM.blueFaint : KM.bg,
  color: active ? KM.blue : KM.muted,
  border: `1px solid ${active ? '#B8C9EE' : KM.border}`,
});

// ── OptionRow — one option type with its values ───────────────────────────────
function OptionRow({ option, onChange, onRemove, canRemove, allOtherKeys }) {
  const [valueInput, setValueInput] = useState('');
  const [keyOpen, setKeyOpen] = useState(false);
  const [keySearch, setKeySearch] = useState('');
  const inputRef = useRef();
  const isColour = isColourKey(option.key);

  const addValue = (raw) => {
    const v = raw.trim();
    if (isColour && !isHexColor(v)) return;
    if (!v) return;
    // Duplicate detection (case/space insensitive)
    if (option.values.some(existing => norm(existing) === norm(v))) return;
    onChange({ ...option, values: [...option.values, v] });
    setValueInput('');
    inputRef.current?.focus();
  };

  const removeValue = (idx) => onChange({ ...option, values: option.values.filter((_, i) => i !== idx) });

  const filteredKeys = OPTION_KEYS.filter(k =>
    k.toLowerCase().includes(keySearch.toLowerCase()) &&
    !allOtherKeys.includes(k)
  );

  return (
    <div style={{ background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>

        {/* Option type selector */}
        <div style={{ flex: '0 0 170px', position: 'relative' }}>
          <label style={lbl}>Option Type</label>
          <div
            onClick={() => setKeyOpen(o => !o)}
            style={{ ...inp, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: option.key ? KM.blueFaint : '#fff', borderColor: option.key ? '#B8C9EE' : KM.border }}
          >
            <span style={{ color: option.key ? KM.blue : KM.muted, fontWeight: option.key ? 600 : 400 }}>
              {option.key || 'Select type…'}
            </span>
            <span style={{ fontSize: 10, color: KM.muted }}>▾</span>
          </div>
          {keyOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 200, width: 220, background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', marginTop: 4, overflow: 'hidden' }}>
              <input
                autoFocus
                style={{ ...inp, borderRadius: 0, borderWidth: '0 0 1px 0' }}
                placeholder="Search or type custom…"
                value={keySearch}
                onChange={e => setKeySearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && keySearch.trim()) {
                    onChange({ ...option, key: keySearch.trim(), values: [] });
                    setKeyOpen(false); setKeySearch('');
                  }
                  if (e.key === 'Escape') setKeyOpen(false);
                }}
              />
              <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                {filteredKeys.map(k => (
                  <div key={k} onClick={() => { onChange({ ...option, key: k, values: [] }); setKeyOpen(false); setKeySearch(''); }}
                    style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, display: 'flex', justifyContent: 'space-between', background: option.key === k ? KM.blueFaint : 'transparent', color: option.key === k ? KM.blue : KM.text }}
                    onMouseEnter={e => { if (option.key !== k) e.currentTarget.style.background = KM.bg; }}
                    onMouseLeave={e => { if (option.key !== k) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span>{k}</span>
                    <span style={{ fontSize: 10, color: KM.muted }}>{(OPTION_PRESETS[k] || []).length} presets</span>
                  </div>
                ))}
                {keySearch && !filteredKeys.includes(keySearch.trim()) && (
                  <div onClick={() => { onChange({ ...option, key: keySearch.trim(), values: [] }); setKeyOpen(false); setKeySearch(''); }}
                    style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: KM.orange, borderTop: `1px solid ${KM.border}` }}>
                    + Use "{keySearch.trim()}" as custom
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Values area */}
        <div style={{ flex: 1 }}>
          <label style={lbl}>Values</label>

          {/* Preset suggestions */}
          {option.key && OPTION_PRESETS[option.key]?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
              {OPTION_PRESETS[option.key].map(preset => {
                const already = option.values.some(v => norm(v) === norm(preset));
                return (
                  <button key={preset} type="button"
                    onClick={() => !already && addValue(preset)}
                    style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, border: `1px solid ${already ? KM.green : KM.border}`, background: already ? '#F0FFF4' : '#fff', color: already ? KM.green : KM.muted, cursor: already ? 'default' : 'pointer', fontWeight: 500 }}>
                    {already ? '✓ ' : '+'}{preset}
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected values as pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8, minHeight: option.values.length ? 'auto' : 0 }}>
            {option.values.map((v, i) => (
              <span key={i} style={pill(true)}>
                {v}
                <button type="button" onClick={() => removeValue(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: KM.muted, fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>

          {/* Custom value input */}
          <div style={{ display: 'flex', gap: 6 }}>
            {isColour ? (
              <input
                ref={inputRef}
                type="color"
                style={{ width: 52, height: 36, padding: 2, border: `1px solid ${KM.border}`, borderRadius: 7, background: '#fff', cursor: option.key ? 'pointer' : 'not-allowed' }}
                value={isHexColor(valueInput) ? valueInput : '#000000'}
                disabled={!option.key}
                onChange={e => setValueInput(e.target.value)}
              />
            ) : (
              <input
                ref={inputRef}
                style={{ ...inp, flex: 1 }}
                placeholder={option.key ? `Add ${option.key.toLowerCase()} value…` : 'Select option type first'}
                value={valueInput}
                disabled={!option.key}
                onChange={e => setValueInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addValue(valueInput); } }}
              />
            )}
            <button type="button" onClick={() => addValue(isColour && !valueInput ? '#000000' : valueInput)}
              disabled={!option.key || (!isColour && !valueInput.trim())}
              style={{ padding: '8px 14px', background: KM.teal, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, opacity: (!option.key || (!isColour && !valueInput.trim())) ? 0.4 : 1 }}>
              {isColour ? 'Add Colour' : 'Add'}
            </button>
          </div>
        </div>

        {/* Remove option */}
        {canRemove && (
          <button type="button" onClick={onRemove}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: KM.red, fontSize: 18, padding: '4px 6px', marginTop: 20, alignSelf: 'flex-start' }}
            title="Remove option">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// ── SKU Row — card layout with big image upload ───────────────────────────────
function SkuRow({ sku, index, onChange, errors = [] }) {
  const imgRef = useRef();
  const [imgError, setImgError] = useState('');

  const handleImg = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgError('');
    validateVariantImage(file).then((result) => {
      if (!result.valid) {
        setImgError(result.error);
        e.target.value = null;
        return;
      }
      onChange({ ...sku, imageFile: file, imagePreview: URL.createObjectURL(file) });
    });
  };

  const hasErr = errors.length > 0;
  const isOOS  = sku.stock === '0' || sku.stock === 0;
  const discount = sku.mrp && sku.salesPrice && Number(sku.mrp) > 0
    ? Math.round((1 - Number(sku.salesPrice) / Number(sku.mrp)) * 100) : 0;

  return (
    <div style={{
      display: 'flex', gap: 14, padding: '16px',
      borderBottom: `1px solid ${KM.border}`,
      background: hasErr ? KM.redLight : isOOS ? '#FFFBEB' : '#fff',
      alignItems: 'flex-start',
    }}>

      {/* Index badge */}
      <div style={{ width: 26, height: 26, borderRadius: 6, background: KM.blue, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>
        {index + 1}
      </div>

      {/* Image upload — big zone */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: KM.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Image • 800×960px (5:6) • Min: 400×480px</div>
        <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImg} />
        {sku.imagePreview ? (
          <div style={{ position: 'relative', width: 90, height: 90 }}>
            <img src={sku.imagePreview} alt="variant"
              style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 10, border: `2px solid ${KM.teal}`, display: 'block' }} />
            <button type="button" onClick={() => { onChange({ ...sku, imageFile: null, imagePreview: null }); setImgError(''); }}
              style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: KM.red, color: '#fff', border: '2px solid #fff', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontWeight: 700 }}>✕</button>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,180,216,0.85)', borderRadius: '0 0 8px 8px', fontSize: 10, color: '#fff', textAlign: 'center', padding: '3px 0', fontWeight: 600 }}>
              {sku.imagePreview.startsWith('blob:') ? 'New' : 'Saved'}
            </div>
          </div>
        ) : (
          <div onClick={() => imgRef.current?.click()}
            style={{ width: 90, height: 90, border: `2px dashed ${imgError ? KM.red : KM.teal}`, borderRadius: 10, background: imgError ? KM.redLight : '#F0FAFE', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <span style={{ fontSize: 26 }}>🖼️</span>
            <span style={{ fontSize: 10, color: imgError ? KM.red : KM.teal, fontWeight: 700 }}>Upload</span>
          </div>
        )}
        {imgError && (
          <div style={{ fontSize: 10, color: KM.red, fontWeight: 600, marginTop: 4, maxWidth: 90, lineHeight: 1.3 }}>⚠ {imgError}</div>
        )}
      </div>

      {/* Right side — name + fields */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Name + status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: KM.blue }}>{sku.variantName}</div>
            <div style={{ fontSize: 11, color: KM.muted, marginTop: 2 }}>
              {sku.combo?.map(c => `${c.key}: ${c.value}`).join('  ·  ')}
            </div>
            {hasErr && <div style={{ fontSize: 11, color: KM.red, fontWeight: 600, marginTop: 3 }}>{errors.join(' · ')}</div>}
          </div>
          <button type="button"
            onClick={() => onChange({ ...sku, status: sku.status === 'Active' ? 'Inactive' : 'Active' })}
            style={{ flexShrink: 0, fontSize: 11, padding: '4px 10px', borderRadius: 6, border: `1px solid ${sku.status === 'Active' ? KM.green : KM.border}`, background: sku.status === 'Active' ? '#F0FFF4' : KM.bg, color: sku.status === 'Active' ? KM.green : KM.muted, cursor: 'pointer', fontWeight: 700 }}>
            {sku.status === 'Active' ? '● Active' : '○ Inactive'}
          </button>
        </div>

        {/* Price + stock row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ ...lbl, marginBottom: 4 }}>MRP (₹)</label>
            <input
              style={{ ...inp }}
              type="number" min="0" step="0.01" placeholder="0.00"
              value={sku.mrp}
              onChange={e => onChange({ ...sku, mrp: e.target.value })}
            />
          </div>
          <div>
            <label style={{ ...lbl, marginBottom: 4 }}>Sale Price (₹)</label>
            <input
              style={{ ...inp, borderColor: (sku.mrp && sku.salesPrice && Number(sku.salesPrice) > Number(sku.mrp)) ? KM.red : KM.border }}
              type="number" min="0" step="0.01" placeholder="0.00"
              value={sku.salesPrice}
              onChange={e => onChange({ ...sku, salesPrice: e.target.value })}
            />
            {discount > 0 && (
              <div style={{ fontSize: 10, color: KM.green, fontWeight: 700, marginTop: 3 }}>{discount}% off</div>
            )}
          </div>
          <div>
            <label style={{ ...lbl, marginBottom: 4 }}>Stock</label>
            <input
              style={{ ...inp, borderColor: isOOS ? '#F59E0B' : KM.border }}
              type="number" min="0" placeholder="0"
              value={sku.stock}
              onChange={e => onChange({ ...sku, stock: e.target.value })}
            />
            {isOOS && <div style={{ fontSize: 10, color: '#F59E0B', fontWeight: 700, marginTop: 3 }}>Out of stock</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function attributesMatch(attrs1, attrs2) {
  const a1 = Array.isArray(attrs1) ? attrs1 : [];
  const a2 = Array.isArray(attrs2) ? attrs2 : [];
  if (a1.length !== a2.length) return false;
  
  const normKey = k => {
    const KEY_ALIASES = { color: "Colour", colour: "Colour", size: "Size", material: "Material", finish: "Finish", capacity: "Capacity" };
    return KEY_ALIASES[k?.toLowerCase()] || k;
  };

  return a1.every(x => 
    a2.some(y => normKey(x.key) === normKey(y.key) && String(x.value).trim().toLowerCase() === String(y.value).trim().toLowerCase())
  );
}

// ── Build SKU rows from option matrix ────────────────────────────────────────
function buildSkus(options, existingSkus = []) {
  const validOptions = options.filter(o => o.key && o.values.length > 0);
  if (!validOptions.length) return [];

  const combos = cartesian(validOptions.map(o => o.values.map(v => ({ key: o.key, value: v }))));

  return combos.map(combo => {
    const variantName = comboName(combo);
    // Preserve existing sku data if combo already existed (order-independent match)
    const existing = existingSkus.find(s => {
      const sAttrs = s.attributes || s.combo || [];
      return attributesMatch(sAttrs, combo);
    });
    // attributes must always be present — Products.js validation + submit both read it
    const attributesFromCombo = combo.map(c => ({ key: c.key, value: c.value, customValue: '' }));
    return existing
      ? { ...existing, combo, variantName, attributes: attributesFromCombo }
      : {
          id: `new_${Date.now()}_${Math.random()}`,
          combo,
          variantName,
          attributes: attributesFromCombo,
          mrp: existingSkus[0]?.mrp || '',
          salesPrice: existingSkus[0]?.salesPrice || '',
          stock: '',
          imageFile: null,
          imagePreview: null,
          status: 'Active',
        };
  });
}

// ── BulkEdit bar ──────────────────────────────────────────────────────────────
function BulkEditBar({ onApply }) {
  const [mrp, setMrp] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px', background: KM.blueFaint, borderBottom: `1px solid ${KM.border}`, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: KM.blue, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4 }}>Apply to all</span>
      <input style={{ ...inp, width: 100, fontSize: 12 }} type="number" placeholder="MRP ₹" value={mrp} onChange={e => setMrp(e.target.value)} />
      <input style={{ ...inp, width: 100, fontSize: 12 }} type="number" placeholder="Price ₹" value={price} onChange={e => setPrice(e.target.value)} />
      <input style={{ ...inp, width: 80, fontSize: 12 }} type="number" placeholder="Stock" value={stock} onChange={e => setStock(e.target.value)} />
      <button type="button"
        onClick={() => { onApply({ mrp, salesPrice: price, stock }); setMrp(''); setPrice(''); setStock(''); }}
        style={{ padding: '7px 14px', background: KM.orange, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
        Apply
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VariantBuilder — main export
// Props:
//   variants     — array of SKU rows (from parent state)
//   onChange     — (newVariants) => void
//   errors       — { [index]: string[] }
//   existingOptions — pre-populated option matrix when editing
// ═══════════════════════════════════════════════════════════════════════════════
export default function VariantBuilder({ variants = [], onChange, errors = {}, existingOptions, tab: tabProp, onTabChange }) {
  // Options = the matrix rows (Colour: [Red, Blue], Size: [S, M, L])
  const [options, setOptions] = useState(() => {
    if (existingOptions?.length) return existingOptions;
    // Reconstruct option matrix from existing variants
    if (variants.length > 0) {
      const optionMap = {};
      variants.forEach(v => {
        (v.attributes || []).forEach(a => {
          if (!a.key || !a.value || a.key === 'Custom Note') return;
          if (!optionMap[a.key]) optionMap[a.key] = new Set();
          optionMap[a.key].add(a.value);
        });
      });
      const keys = Object.keys(optionMap);
      if (keys.length) return keys.map(k => ({ id: k, key: k, values: [...optionMap[k]] }));
    }
    return [{ id: 'opt_0', key: '', values: [] }];
  });

  // Sync options when existingOptions is loaded/updated (resolves initialization race condition on mount)
  useEffect(() => {
    if (existingOptions?.length) {
      setOptions(existingOptions);
    }
  }, [existingOptions]);

  const [tabInternal, setTabInternal] = useState('options'); // 'options' | 'skus'
  const tab = tabProp !== undefined ? tabProp : tabInternal;
  const setTab = (t) => { setTabInternal(t); if (onTabChange) onTabChange(t); };

  const addOption = () => setOptions(o => [...o, { id: `opt_${Date.now()}`, key: '', values: [] }]);
  const removeOption = (i) => {
    const next = options.filter((_, j) => j !== i);
    setOptions(next);
    regenerate(next);
  };
  const updateOption = (i, updated) => {
    const next = [...options]; next[i] = updated;
    setOptions(next);
    regenerate(next);
  };

  const regenerate = useCallback((opts) => {
    const next = buildSkus(opts, variants);
    onChange(next);
  }, [variants, onChange]);

  const updateSku = (i, updated) => {
    const next = [...variants]; next[i] = updated;
    onChange(next);
  };

  const bulkApply = ({ mrp, salesPrice, stock }) => {
    onChange(variants.map(v => ({
      ...v,
      ...(mrp ? { mrp } : {}),
      ...(salesPrice ? { salesPrice } : {}),
      ...(stock ? { stock } : {}),
    })));
  };

  const totalCombos = (() => {
    const valid = options.filter(o => o.key && o.values.length);
    if (!valid.length) return 0;
    return valid.reduce((acc, o) => acc * o.values.length, 1);
  })();

  const allOtherKeys = (idx) => options.filter((_, i) => i !== idx).map(o => o.key).filter(Boolean);

  // ── AttributeRow export (for Variants.js standalone use) ──────────────────
  const errorCount = Object.values(errors).filter(e => Array.isArray(e) && e.length > 0).length;
  const hasErrors = errorCount > 0;

  return (
    <div style={{ gridColumn: 'span 2', background: KM.bg, border: `2px solid ${hasErrors ? KM.red : KM.border}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s' }}>

      {/* Header */}
      <div style={{ background: hasErrors ? '#7f1d1d' : KM.blue, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.2s' }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>🎁 Variant Options</span>
          {hasErrors ? (
            <span style={{ fontSize: 12, color: '#fca5a5', marginLeft: 10, fontWeight: 600 }}>
              ⚠ {errorCount} SKU{errorCount !== 1 ? 's' : ''} incomplete — fill in the details below
            </span>
          ) : (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginLeft: 10 }}>
              {totalCombos > 0 ? `${totalCombos} variant${totalCombos !== 1 ? 's' : ''} will be generated` : 'Define options below'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['options', 'skus'].map(t => {
            const isSkus = t === 'skus';
            const skuHasError = isSkus && hasErrors;
            const isActive = tab === t;
            return (
              <button key={t} type="button" onClick={() => setTab(t)}
                style={{
                  padding: '5px 14px', borderRadius: 6, border: skuHasError ? '2px solid #fca5a5' : 'none',
                  cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  background: isActive ? (skuHasError ? KM.red : KM.orange) : (skuHasError ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.15)'),
                  color: '#fff',
                  position: 'relative',
                }}>
                {t === 'options' ? '⚙️ Options' : `📦 SKUs (${variants.length})`}
                {skuHasError && (
                  <span style={{
                    position: 'absolute', top: -8, right: -8,
                    background: '#fbbf24', color: '#1a1a1a',
                    borderRadius: '50%', width: 18, height: 18,
                    fontSize: 10, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1,
                  }}>{errorCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Options tab */}
      {tab === 'options' && (
        <div style={{ padding: 16 }}>
          {hasErrors && (
            <div style={{
              marginBottom: 12, padding: '10px 14px',
              background: KM.redLight, border: `1px solid #fca5a5`,
              borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: KM.red }}>
                  {errorCount} SKU{errorCount !== 1 ? 's are' : ' is'} incomplete
                </div>
                <div style={{ fontSize: 12, color: KM.red, marginTop: 2 }}>
                  Switch to the <strong>📦 SKUs</strong> tab to fill in prices, stock and images.
                </div>
              </div>
              <button type="button" onClick={() => setTab('skus')}
                style={{ marginLeft: 'auto', padding: '6px 14px', background: KM.red, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                Fix SKUs →
              </button>
            </div>
          )}
          <div style={{ marginBottom: 12, fontSize: 12, color: KM.muted }}>
            Add option types (Colour, Size, Material…) with their values. SKUs are auto-generated as a cartesian product.
          </div>

          {options.map((opt, i) => (
            <OptionRow
              key={opt.id}
              option={opt}
              onChange={updated => updateOption(i, updated)}
              onRemove={() => removeOption(i)}
              canRemove={options.length > 1}
              allOtherKeys={allOtherKeys(i)}
            />
          ))}

          <button type="button" onClick={addOption}
            style={{ fontSize: 12, padding: '7px 16px', background: 'transparent', color: KM.teal, border: `1.5px dashed ${KM.teal}`, borderRadius: 8, cursor: 'pointer', fontWeight: 700, width: '100%', marginTop: 4 }}>
            + Add Option Type
          </button>

          {totalCombos > 0 && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: KM.orangeLight, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: KM.orange }}>
                {totalCombos} SKU{totalCombos !== 1 ? 's' : ''} ready to configure
              </span>
              <button type="button" onClick={() => setTab('skus')}
                style={{ padding: '6px 14px', background: KM.orange, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                Set Prices & Stock →
              </button>
            </div>
          )}
        </div>
      )}

      {/* SKUs tab */}
      {tab === 'skus' && (
        <div>
          {variants.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: KM.muted, fontSize: 13 }}>
              No variants yet — go to ⚙️ Options tab and add option types with values.
            </div>
          ) : (
            <>
              {hasErrors && (
                <div style={{
                  padding: '10px 16px',
                  background: KM.redLight, borderBottom: `1px solid #fca5a5`,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 16 }}>⚠️</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: KM.red }}>
                    {errorCount} SKU{errorCount !== 1 ? 's' : ''} need attention — rows highlighted below
                  </span>
                </div>
              )}
              <BulkEditBar onApply={bulkApply} />

              <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                {variants.map((sku, i) => (
                  <SkuRow
                    key={sku.id || i}
                    sku={sku}
                    index={i}
                    onChange={updated => updateSku(i, updated)}
                    errors={errors[i] || []}
                  />
                ))}
              </div>

              {/* Summary */}
              <div style={{ padding: '10px 14px', background: KM.bg, borderTop: `1px solid ${KM.border}`, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: KM.muted }}>
                  <strong style={{ color: KM.blue }}>{variants.filter(v => v.status === 'Active').length}</strong> active
                </span>
                <span style={{ fontSize: 12, color: KM.muted }}>
                  <strong style={{ color: KM.green }}>{variants.filter(v => Number(v.stock) > 0).length}</strong> in stock
                </span>
                <span style={{ fontSize: 12, color: KM.muted }}>
                  <strong style={{ color: '#F59E0B' }}>{variants.filter(v => Number(v.stock) === 0).length}</strong> out of stock
                </span>
                <span style={{ fontSize: 12, color: KM.muted }}>
                  Total: <strong style={{ color: KM.text }}>{variants.reduce((s, v) => s + (Number(v.stock) || 0), 0)}</strong> units
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── AttributeRow export (kept for Variants.js standalone admin page) ──────────
export function AttributeRow({ attr, onChange, onRemove, isOnly }) {
  const preset = OPTION_PRESETS[attr.key];
  const [keyOpen, setKeyOpen] = useState(false);
  const [keySearch, setKeySearch] = useState('');

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', width: '100%' }}>
      <div style={{ flex: '0 0 160px', position: 'relative' }}>
        <div onClick={() => setKeyOpen(o => !o)}
          style={{ ...inp, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: attr.key ? KM.blueFaint : '#fff', borderColor: attr.key ? '#B8C9EE' : KM.border }}>
          <span style={{ color: attr.key ? KM.blue : KM.muted, fontWeight: attr.key ? 600 : 400 }}>
            {attr.key || 'Select / type…'}
          </span>
          <span style={{ fontSize: 10, color: KM.muted }}>▾</span>
        </div>
        {keyOpen && (
          <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, width: 220, background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', marginTop: 4, overflow: 'hidden' }}>
            <input autoFocus style={{ ...inp, borderRadius: 0, borderWidth: '0 0 1px 0' }} placeholder="Search or type…" value={keySearch} onChange={e => setKeySearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && keySearch.trim()) { onChange({ ...attr, key: keySearch.trim(), value: '', customValue: '' }); setKeyOpen(false); setKeySearch(''); } if (e.key === 'Escape') setKeyOpen(false); }}
            />
            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
              {OPTION_KEYS.filter(k => k.toLowerCase().includes(keySearch.toLowerCase())).map(k => (
                <div key={k} onClick={() => { onChange({ ...attr, key: k, value: '', customValue: '' }); setKeyOpen(false); setKeySearch(''); }}
                  style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, background: attr.key === k ? KM.blueFaint : 'transparent', color: attr.key === k ? KM.blue : KM.text }}
                  onMouseEnter={e => { if (attr.key !== k) e.currentTarget.style.background = KM.bg; }}
                  onMouseLeave={e => { if (attr.key !== k) e.currentTarget.style.background = 'transparent'; }}>
                  {k}
                </div>
              ))}
              {keySearch && !OPTION_KEYS.includes(keySearch.trim()) && (
                <div onClick={() => { onChange({ ...attr, key: keySearch.trim(), value: '', customValue: '' }); setKeyOpen(false); setKeySearch(''); }}
                  style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: KM.orange, borderTop: `1px solid ${KM.border}` }}>
                  + Use "{keySearch.trim()}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1 }}>
        {preset ? (
          <select style={{ ...inp }} value={attr.value} onChange={e => onChange({ ...attr, value: e.target.value })}>
            <option value="">Select value…</option>
            {preset.map(o => <option key={o}>{o}</option>)}
          </select>
        ) : (
          <input style={inp} placeholder="Enter value…" value={attr.value} onChange={e => onChange({ ...attr, value: e.target.value })} />
        )}
      </div>

      <button type="button" onClick={onRemove} disabled={isOnly}
        style={{ background: 'none', border: 'none', cursor: isOnly ? 'default' : 'pointer', color: isOnly ? '#D1D5DB' : KM.red, fontSize: 16, padding: '4px 6px', marginTop: 7 }}>
        ✕
      </button>
    </div>
  );
}

export const ATTRIBUTE_PRESETS = Object.fromEntries(
  Object.entries(OPTION_PRESETS).map(([k, v]) => [k, { type: 'dropdown', options: v }])
);
