import { useState, useRef, useCallback, useEffect } from 'react';
import { confirmDelete } from '../../utils/sweetalert';
import { removeVariant } from '../../redux/services/variantsService';
import { useDispatch } from 'react-redux';

const KM = {
  orange: '#F15A24', orangeLight: '#FEF0EB', blue: '#1A3A6B',
  green: '#39B54A', teal: '#00B4D8', border: '#E5E7EB',
  text: '#1A1A2E', muted: '#6B7280', bg: '#F9FAFB', blueFaint: '#EEF2FB',
  red: '#EF4444', redLight: '#FEF2F2',
};

// ── Variant Image Dimension Validator (same rules as product gallery) ─────────
const VARIANT_IMAGE_RULES = {
  width: 800,
  height: 960,
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
        const ratio = width / height;
        const diff = Math.abs(ratio - VARIANT_IMAGE_RULES.aspectRatio) / VARIANT_IMAGE_RULES.aspectRatio;
        if (diff > VARIANT_IMAGE_RULES.tolerance) {
          resolve({ valid: false, error: `Wrong ratio. Use 5:6 (${VARIANT_IMAGE_RULES.width}×${VARIANT_IMAGE_RULES.height}px). Yours: ${width}×${height}px` });
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
  // Dead keys from Products.js mappedVariants — added so they appear in the searchable dropdown
  // and can be toggled as open-choice (inputType: text) for personalized product dimensions
  'Engraving': [],
  'Print Text': [],
  'Dimensions': [],
  'Sub-type':   [],
};

const OPTION_KEYS = Object.keys(OPTION_PRESETS);

// ── Input Type presets (seed list — admin can add custom names freely via the same
//    searchable-dropdown pattern used for Option Type). These are session-local only,
//    matching the behavior of custom Option Type keys today (not persisted globally).
export const INPUT_TYPE_PRESETS = ['Color', 'Size', 'Text', 'Custom List'];

// ── renderAs mapping — the ONE place where infinite admin-typed inputType names
//    collapse to 3 finite client rendering buckets (color / select / text).
//    'Color' (case-insensitive) → color picker widget
//    'Custom List' (case-insensitive) → dropdown from customListValues
//    everything else → plain text input (Size, Text, Engraving, Pincode, Date, …)
export const getRenderAs = (inputType) => {
  if (!inputType) return 'text';
  const t = inputType.trim().toLowerCase();
  if (t === 'color') return 'color';
  if (t === 'custom list') return 'select';
  return 'text';
};

// ── Normalize value for duplicate detection ───────────────────────────────────
const norm = (v) => v.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
const isColourKey = (key) => /colou?r/i.test(key || '');
export const isHexColor = (value) => /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value || '').trim());

export const renderVariantLabel = (str, circleSize = 12, spacing = 4) => {
  if (!str) return '—';
  const parts = str.split(/(\s*·\s*|\s*\/\s*)/);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap' }}>
      {parts.map((part, idx) => {
        if (/^\s*[·/]\s*$/.test(part)) {
          return <span key={idx} style={{ color: '#aaa', margin: '0 4px' }}>{part}</span>;
        }
        if (part.includes(':')) {
          const colonIdx = part.indexOf(':');
          const key = part.slice(0, colonIdx + 1);
          const val = part.slice(colonIdx + 1).trim();
          if (isHexColor(val)) {
            return (
              <span key={idx} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <span>{key}</span>
                <span
                  style={{
                    width: circleSize,
                    height: circleSize,
                    borderRadius: '50%',
                    border: '1px solid #dcdcdc',
                    backgroundColor: val,
                    display: 'inline-block',
                    marginLeft: spacing,
                    marginRight: spacing,
                    flexShrink: 0,
                  }}
                />
                <span>{val}</span>
              </span>
            );
          }
        }
        const trimmed = part.trim();
        if (isHexColor(trimmed)) {
          return (
            <span key={idx} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <span
                style={{
                  width: circleSize,
                  height: circleSize,
                  borderRadius: '50%',
                  border: '1px solid #dcdcdc',
                  backgroundColor: trimmed,
                  display: 'inline-block',
                  marginRight: spacing,
                  flexShrink: 0,
                }}
              />
              <span>{trimmed}</span>
            </span>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
};

// ── Cartesian product ─────────────────────────────────────────────────────────
function cartesian(arrays) {
  if (!arrays.length) return [[]];
  return arrays.reduce(
    (acc, arr) => acc.flatMap(combo => arr.map(v => [...combo, v])),
    [[]]
  );
}

// ── Build variant name from option combo ─────────────────────────────────────
function comboName(combo) {
  return combo
    .map(({ key, value, isOpenChoice, label }) =>
      isOpenChoice ? `${label || key}: (customer's choice)` : `${key}: ${value}`
    )
    .join(' · ') || 'Default';
}

// ── Prune option values no longer referenced by any remaining SKU ─────────────
// Runs synchronously as part of the delete update — eliminates stale-options risk
// where a later unrelated option edit could resurrect a deleted combo via regenerate().
export function pruneOrphanedOptionValues(options, remainingVariants) {
  return options.map(opt => {
    if (opt.isOpenChoice) return opt; // open-choice options have no discrete values to prune
    const usedValues = new Set();
    remainingVariants.forEach(sku => {
      (sku.attributes || sku.combo || []).forEach(a => {
        if (a.key === opt.key && a.value && !a.isOpenChoice) usedValues.add(a.value);
      });
    });
    const nextValues = opt.values.filter(v => usedValues.has(v));
    return { ...opt, values: nextValues };
  });
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

// ── Reusable searchable dropdown (used for both Option Type and Input Type) ────
function SearchableDropdown({ value, options, placeholder, onChange, customLabel = 'Use', allOtherSelected = [] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = options.filter(k =>
    k.toLowerCase().includes(search.toLowerCase()) &&
    !allOtherSelected.includes(k)
  );
  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ ...inp, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: value ? KM.blueFaint : '#fff', borderColor: value ? '#B8C9EE' : KM.border }}
      >
        <span style={{ color: value ? KM.blue : KM.muted, fontWeight: value ? 600 : 400 }}>
          {value || placeholder}
        </span>
        <span style={{ fontSize: 10, color: KM.muted }}>▾</span>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 200, width: 220, background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', marginTop: 4, overflow: 'hidden' }}>
          <input
            autoFocus
            style={{ ...inp, borderRadius: 0, borderWidth: '0 0 1px 0' }}
            placeholder="Search or type custom…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && search.trim()) {
                onChange(search.trim());
                setOpen(false); setSearch('');
              }
              if (e.key === 'Escape') setOpen(false);
            }}
          />
          <div style={{ maxHeight: 180, overflowY: 'auto' }}>
            {filtered.map(k => (
              <div key={k} onClick={() => { onChange(k); setOpen(false); setSearch(''); }}
                style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, background: value === k ? KM.blueFaint : 'transparent', color: value === k ? KM.blue : KM.text }}
                onMouseEnter={e => { if (value !== k) e.currentTarget.style.background = KM.bg; }}
                onMouseLeave={e => { if (value !== k) e.currentTarget.style.background = 'transparent'; }}
              >
                {k}
              </div>
            ))}
            {search && !filtered.includes(search.trim()) && (
              <div onClick={() => { onChange(search.trim()); setOpen(false); setSearch(''); }}
                style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: KM.orange, borderTop: `1px solid ${KM.border}` }}>
                + {customLabel} "{search.trim()}" as custom
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── OptionRow — one option type with its values ───────────────────────────────
function OptionRow({ option, onChange, onRemove, canRemove, allOtherKeys }) {
  const [valueInput, setValueInput] = useState('');
  const [inputTypeSearch, setInputTypeSearch] = useState('');
  const [inputTypeOpen, setInputTypeOpen] = useState(false);
  const [customInputTypes, setCustomInputTypes] = useState([]);
  const inputRef = useRef();
  const isColour = isColourKey(option.key);

  const allInputTypes = [...INPUT_TYPE_PRESETS, ...customInputTypes.filter(t => !INPUT_TYPE_PRESETS.includes(t))];
  const renderAs = getRenderAs(option.inputType);

  const addValue = (raw) => {
    let v = raw.trim();
    if (isColour && !option.isOpenChoice) {
      if (!isHexColor(v)) return;
      v = v.toUpperCase();
    }
    if (!v) return;
    if (option.values.some(existing => norm(existing) === norm(v))) return;
    onChange({ ...option, values: [...option.values, v] });
    setValueInput('');
    inputRef.current?.focus();
  };

  const removeValue = (idx) => onChange({ ...option, values: option.values.filter((_, i) => i !== idx) });

  const toggleOpenChoice = (checked) => {
    // Default inputType: 'Text' for known text-type keys, 'Color' for colour-like keys, else 'Text'
    const defaultInputType = isColourKey(option.key) ? 'Color' : 'Text';
    onChange({
      ...option,
      isOpenChoice: checked,
      inputType: option.inputType || defaultInputType,
      renderAs: getRenderAs(option.inputType || defaultInputType),
      label: option.label || '',
      hint: option.hint || '',
      customListValues: option.customListValues || [],
      values: checked ? [] : option.values,
    });
  };

  const updateOpenChoiceField = (field, val) => {
    const updated = { ...option, [field]: val };
    if (field === 'inputType') {
      updated.renderAs = getRenderAs(val);
    }
    onChange(updated);
  };

  const addCustomListValue = (raw) => {
    const v = raw.trim();
    if (!v) return;
    const existing = option.customListValues || [];
    if (existing.some(e => norm(e) === norm(v))) return;
    onChange({ ...option, customListValues: [...existing, v] });
    setValueInput('');
    inputRef.current?.focus();
  };

  const removeCustomListValue = (idx) => {
    const next = (option.customListValues || []).filter((_, i) => i !== idx);
    onChange({ ...option, customListValues: next });
  };

  return (
    <div style={{ background: '#fff', border: `1px solid ${option.isOpenChoice ? '#B8C9EE' : KM.border}`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>

        {/* Option type selector */}
        <div style={{ flex: '0 0 170px', position: 'relative' }}>
          <label style={lbl}>Option Type</label>
          <SearchableDropdown
            value={option.key}
            options={OPTION_KEYS}
            placeholder="Select type…"
            allOtherSelected={allOtherKeys}
            onChange={(k) => onChange({ ...option, key: k, values: [], isOpenChoice: false })}
          />
        </div>

        {/* Values area OR open-choice config panel */}
        <div style={{ flex: 1 }}>
          {option.isOpenChoice ? (
            /* ── Open-choice config panel ── */
            <div style={{ background: KM.blueFaint, borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: KM.blue, marginBottom: 2 }}>
                🔓 Customer's choice configuration
              </div>

              {/* Input Type — searchable, same pattern as Option Type key */}
              <div>
                <label style={lbl}>Input Type</label>
                <SearchableDropdown
                  value={option.inputType || 'Text'}
                  options={allInputTypes}
                  placeholder="Select input type…"
                  customLabel="Use"
                  onChange={(t) => {
                    if (!INPUT_TYPE_PRESETS.includes(t)) {
                      setCustomInputTypes(prev => [...new Set([...prev, t])]);
                    }
                    updateOpenChoiceField('inputType', t);
                  }}
                />
                <div style={{ fontSize: 10, color: KM.muted, marginTop: 3 }}>
                  {renderAs === 'color' && 'Renders as: colour picker on storefront'}
                  {renderAs === 'select' && 'Renders as: dropdown on storefront'}
                  {renderAs === 'text' && 'Renders as: text input on storefront'}
                </div>
              </div>

              {/* Label override */}
              <div>
                <label style={lbl}>Label (optional)</label>
                <input
                  style={inp}
                  placeholder={option.key || 'Label shown to customer'}
                  value={option.label || ''}
                  onChange={e => updateOpenChoiceField('label', e.target.value)}
                />
              </div>

              {/* Hint text */}
              <div>
                <label style={lbl}>Hint text (optional)</label>
                <input
                  style={inp}
                  placeholder="Helper text shown to customer"
                  value={option.hint || ''}
                  onChange={e => updateOpenChoiceField('hint', e.target.value)}
                />
              </div>

              {/* Custom list values — only shown for renderAs === 'select' */}
              {renderAs === 'select' && (
                <div>
                  <label style={lbl}>Dropdown options</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {(option.customListValues || []).map((v, i) => (
                      <span key={i} style={{ ...pill(true) }}>
                        <span>{v}</span>
                        <button type="button" onClick={() => removeCustomListValue(i)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: KM.muted, fontSize: 14, padding: '0 0 0 2px', lineHeight: 1 }}>×</button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      ref={inputRef}
                      style={{ ...inp, flex: 1 }}
                      placeholder="Add option…"
                      value={valueInput}
                      onChange={e => setValueInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomListValue(valueInput); } }}
                    />
                    <button type="button" onClick={() => addCustomListValue(valueInput)}
                      disabled={!valueInput.trim()}
                      style={{ padding: '8px 14px', background: KM.teal, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, opacity: !valueInput.trim() ? 0.4 : 1 }}>
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Normal fixed-values UI ── */
            <>
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
                  <span key={i} style={{ ...pill(true), display: 'inline-flex', alignItems: 'center' }}>
                    {isColour && isHexColor(v) && (
                      <span
                        style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid #dcdcdc', backgroundColor: v, display: 'inline-block', marginRight: 6, flexShrink: 0 }}
                      />
                    )}
                    <span>{v}</span>
                    <button type="button" onClick={() => removeValue(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: KM.muted, fontSize: 14, padding: '0 0 0 2px', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>×</button>
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
                    onChange={e => setValueInput(e.target.value.toUpperCase())}
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
            </>
          )}
        </div>

        {/* Right-side controls: open-choice toggle + remove */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, marginTop: 20 }}>
          {option.key && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: option.isOpenChoice ? KM.blue : KM.muted, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input
                type="checkbox"
                checked={!!option.isOpenChoice}
                onChange={e => toggleOpenChoice(e.target.checked)}
                style={{ accentColor: KM.blue }}
              />
              Let customer choose
            </label>
          )}
          {canRemove && (
            <button type="button" onClick={onRemove}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: KM.red, fontSize: 18, padding: '4px 6px', alignSelf: 'flex-start' }}
              title="Remove option">
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SKU Row — card layout with big image upload ───────────────────────────────
function SkuRow({ sku, index, onChange, onDelete, errors = [] }) {
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
        <div style={{ fontSize: 10, fontWeight: 700, color: KM.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Image • 800×960px (5:6) • Max: 3MB</div>
        <input ref={imgRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleImg} />
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

        {/* Name + status + delete */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: KM.blue }}>{sku.variantName}</div>
            <div style={{ fontSize: 11, color: KM.muted, marginTop: 2 }}>
              {sku.combo?.map((c, cIdx) => {
                if (c.isOpenChoice) {
                  return (
                    <span key={cIdx} style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {cIdx > 0 && <span style={{ margin: '0 10px', color: KM.border }}>·</span>}
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#EEF2FB', color: KM.blue, fontWeight: 700 }}>
                        🔓 Customer picks {c.label || c.key}
                      </span>
                    </span>
                  );
                }
                const isCol = isColourKey(c.key);
                const hasPreview = isCol && isHexColor(c.value);
                return (
                  <span key={cIdx} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <span>{c.key}: </span>
                    {hasPreview && (
                      <span
                        style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid #dcdcdc', backgroundColor: c.value, display: 'inline-block', marginLeft: 4, marginRight: 4, flexShrink: 0 }}
                      />
                    )}
                    <span style={{ marginLeft: hasPreview ? 0 : 4 }}>{c.value}</span>
                    {cIdx < sku.combo.length - 1 && <span style={{ margin: '0 10px', color: KM.border }}>·</span>}
                  </span>
                );
              })}
            </div>
            {hasErr && <div style={{ fontSize: 11, color: KM.red, fontWeight: 600, marginTop: 3 }}>{errors.join(' · ')}</div>}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <button type="button"
              onClick={() => onChange({ ...sku, status: sku.status === 'Active' ? 'Inactive' : 'Active' })}
              style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: `1px solid ${sku.status === 'Active' ? KM.green : KM.border}`, background: sku.status === 'Active' ? '#F0FFF4' : KM.bg, color: sku.status === 'Active' ? KM.green : KM.muted, cursor: 'pointer', fontWeight: 700 }}>
              {sku.status === 'Active' ? '● Active' : '○ Inactive'}
            </button>
            {/* 🗑 Delete button — same visual style as image remove */}
            <button type="button" onClick={() => onDelete(index)}
              title="Delete this SKU"
              style={{ width: 26, height: 26, borderRadius: '50%', background: KM.red, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              🗑
            </button>
          </div>
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
  // Separate fixed options (need cartesian) from open-choice options (always 1 slot)
  const fixedOptions = options.filter(o => o.key && o.values.length > 0 && !o.isOpenChoice);
  const openChoiceOptions = options.filter(o => o.key && o.isOpenChoice);

  if (!fixedOptions.length && !openChoiceOptions.length) return [];

  // Generate cartesian product only over fixed dimensions
  const combos = fixedOptions.length
    ? cartesian(fixedOptions.map(o => o.values.map(v => ({ key: o.key, value: v }))))
    : [[]]; // single empty combo when only open-choice dims exist

  return combos.map(fixedCombo => {
    // Append open-choice entries (each one contributes exactly 1 slot, not multiplied)
    const openChoiceEntries = openChoiceOptions.map(o => ({
      key: o.key,
      value: 'Any',
      isOpenChoice: true,
      inputType: o.inputType,
      renderAs: o.renderAs || getRenderAs(o.inputType),
      label: o.label || o.key,
      hint: o.hint || '',
      customListValues: o.customListValues || [],
    }));

    const combo = [...fixedCombo, ...openChoiceEntries];
    const variantName = comboName(combo);

    // Preserve existing sku data if combo already existed (order-independent match for fixed dims only)
    const existing = existingSkus.find(s => {
      const sAttrs = s.attributes || s.combo || [];
      // Match only on fixed (non-open-choice) attributes
      const sFixed = sAttrs.filter(a => !a.isOpenChoice);
      return attributesMatch(sFixed, fixedCombo);
    });

    // attributes for API: fixed attrs + open-choice passthrough objects
    const attributesFromCombo = combo.map(c => c.isOpenChoice
      ? { key: c.key, value: c.value, isOpenChoice: true, inputType: c.inputType, renderAs: c.renderAs, label: c.label, hint: c.hint, customListValues: c.customListValues }
      : { key: c.key, value: c.value, customValue: '' }
    );

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
//   onDeleteSku  — optional async (sku, index) => Promise<boolean>
//                  Parent handles confirm dialog + dispatch + toast.
//                  If not passed, SKU-delete is local-only (no API call).
// ═══════════════════════════════════════════════════════════════════════════════
export default function VariantBuilder({ variants = [], onChange, errors = {}, existingOptions, tab: tabProp, onTabChange, onDeleteSku }) {
  // Options = the matrix rows (Colour: [Red, Blue], Size: [S, M, L])
  const [options, setOptions] = useState(() => {
    if (existingOptions?.length) return existingOptions;
    // Reconstruct option matrix from existing variants
    if (variants.length > 0) {
      const optionMap = {};
      const openChoiceMap = {}; // key → open-choice config
      variants.forEach(v => {
        (v.attributes || []).forEach(a => {
          if (!a.key || a.key === 'Custom Note') return;
          if (a.isOpenChoice) {
            // Carry open-choice config through
            if (!openChoiceMap[a.key]) openChoiceMap[a.key] = a;
            return;
          }
          if (!a.value) return;
          if (!optionMap[a.key]) optionMap[a.key] = new Set();
          optionMap[a.key].add(a.value);
        });
      });
      const fixedKeys = Object.keys(optionMap);
      const openChoiceKeys = Object.keys(openChoiceMap);
      const allKeys = [...fixedKeys, ...openChoiceKeys.filter(k => !fixedKeys.includes(k))];
      if (allKeys.length) {
        return allKeys.map(k => {
          if (openChoiceMap[k]) {
            const a = openChoiceMap[k];
            return {
              id: k, key: k, values: [],
              isOpenChoice: true,
              inputType: a.inputType || 'Text',
              renderAs: a.renderAs || getRenderAs(a.inputType),
              label: a.label || '',
              hint: a.hint || '',
              customListValues: a.customListValues || [],
            };
          }
          return { id: k, key: k, values: [...optionMap[k]] };
        });
      }
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

  // Keep a ref to variants so regenerate always reads the freshest value (avoids stale-closure bug)
  const variantsRef = useRef(variants);
  useEffect(() => { variantsRef.current = variants; }, [variants]);

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

  // Always reads the latest variants via ref — fixes stale-closure Cartesian generation bug
  const regenerate = useCallback((opts) => {
    const next = buildSkus(opts, variantsRef.current);
    onChange(next);
  }, [onChange]);

  const updateSku = (i, updated) => {
    const next = [...variants]; next[i] = updated;
    onChange(next);
  };

  // ── SKU deletion — VariantBuilder stays Redux-free, actual API call delegated to onDeleteSku prop ──
  const requestDeleteSku = async (i) => {
    const sku = variants[i];
    const isNewSku = String(sku.id).startsWith('new_');

    if (!isNewSku && onDeleteSku) {
      // Parent (Products.js / Variants.js) handles confirm dialog + dispatch(removeVariant) + toast
      const ok = await onDeleteSku(sku, i);
      if (!ok) return; // User declined or API failed — do not remove from local state
    }

    // Splice variant from array
    const nextVariants = variants.filter((_, j) => j !== i);

    // Prune any option values now orphaned — runs synchronously in the same update
    // so a later unrelated option edit cannot resurrect the deleted combo via regenerate()
    const nextOptions = pruneOrphanedOptionValues(options, nextVariants);
    setOptions(nextOptions);

    onChange(nextVariants);
  };

  const bulkApply = ({ mrp, salesPrice, stock }) => {
    onChange(variants.map(v => ({
      ...v,
      ...(mrp ? { mrp } : {}),
      ...(salesPrice ? { salesPrice } : {}),
      ...(stock ? { stock } : {}),
    })));
  };

  // totalCombos: only multiply over fixed options (open-choice contributes 1x multiplier)
  const totalCombos = (() => {
    const fixedValid = options.filter(o => o.key && o.values.length && !o.isOpenChoice);
    const hasAnyOpen = options.some(o => o.key && o.isOpenChoice);
    if (!fixedValid.length && !hasAnyOpen) return 0;
    const fixedCount = fixedValid.length ? fixedValid.reduce((acc, o) => acc * o.values.length, 1) : 1;
    return hasAnyOpen || fixedValid.length ? fixedCount : 0;
  })();

  const allOtherKeys = (idx) => options.filter((_, i) => i !== idx).map(o => o.key).filter(Boolean);

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
            Toggle "Let customer choose" to let shoppers specify a dimension (e.g. engraving text, custom colour).
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
                    onDelete={requestDeleteSku}
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

  // If this attribute is open-choice, render a read-only badge instead of an editable row.
  // This prevents crashes from preset.map on keys with no preset entry, and prevents
  // accidental editing of open-choice configuration in the standalone Variants.js modal.
  if (attr.isOpenChoice) {
    const displayLabel = attr.label || attr.key;
    const displayType = attr.inputType || 'text';
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
        <div style={{ flex: 1, padding: '8px 12px', background: '#EEF2FB', borderRadius: 8, border: '1px solid #B8C9EE', fontSize: 12, color: '#1A3A6B', fontWeight: 600 }}>
          🔓 Customer picks {displayLabel} ({displayType})
        </div>
        <button type="button" onClick={onRemove} disabled={isOnly}
          style={{ background: 'none', border: 'none', cursor: isOnly ? 'default' : 'pointer', color: isOnly ? '#D1D5DB' : '#EF4444', fontSize: 16, padding: '4px 6px' }}>
          ✕
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', width: '100%' }}>
      <div style={{ flex: '0 0 160px', position: 'relative' }}>
        <div onClick={() => setKeyOpen(o => !o)}
          style={{ ...inp, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: attr.key ? '#EEF2FB' : '#fff', borderColor: attr.key ? '#B8C9EE' : '#E5E7EB' }}>
          <span style={{ color: attr.key ? '#1A3A6B' : '#6B7280', fontWeight: attr.key ? 600 : 400 }}>
            {attr.key || 'Select / type…'}
          </span>
          <span style={{ fontSize: 10, color: '#6B7280' }}>▾</span>
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
