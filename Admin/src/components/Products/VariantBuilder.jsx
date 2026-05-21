import { useState, useRef } from 'react';

// ── Brand Colors ──────────────────────────────────────────────────────────────
const KM = {
  orange: '#F15A24', orangeLight: '#FEF0EB', blue: '#1A3A6B',
  green: '#39B54A', teal: '#00B4D8', border: '#E5E7EB',
  text: '#1A1A2E', muted: '#6B7280', bg: '#F9FAFB',
  blueFaint: '#EEF2FB',
};

// ── Predefined attribute suggestions ─────────────────────────────────────────
export const ATTRIBUTE_PRESETS = {
  'Colour':    { type: 'dropdown', options: ['Red','Pink','Yellow','Green','Blue','Purple','Gold','Silver','White','Black','Rose Gold','Multicolour','Custom'] },
  'Size':      { type: 'dropdown', options: ['XS','S','M','L','XL','XXL','Free Size','Small','Medium','Large','Custom'] },
  'Material':  { type: 'dropdown', options: ['Gold-plated','Silver','Stainless Steel','Brass','Copper','Leather','Wood','Acrylic','Clay','Custom'] },
  'Finish':    { type: 'dropdown', options: ['Matte','Glossy','Antique','Polished','Hand-painted','Mirror-finish','Oxidised','Plain'] },
  'Capacity':  { type: 'dropdown', options: ['50ml','100ml','200ml','250ml','350ml','500ml','750ml','1L','1.5L','Custom'] },
  'Engraving': { type: 'text', options: [] },
  'Print Text':{ type: 'text', options: [] },
  'Weight':    { type: 'text', options: [] },
  'Dimensions':{ type: 'text', options: [] },
  'Custom Note':{ type: 'text', options: [] },
};

const PRESET_KEYS = Object.keys(ATTRIBUTE_PRESETS);

// Build variant name from attributes — shows "Key: Value" pairs
function buildVariantName(attributes) {
  return attributes
    .map(a => {
      const val = a.value === 'Custom' ? (a.customValue || 'Custom') : a.value;
      if (!val) return '';
      // For Custom Note, show just the value (not "Custom Note: Colour: Red")
      if (a.key === 'Custom Note') return val;
      return a.key ? `${a.key}: ${val}` : val;
    })
    .filter(Boolean)
    .join(' · ') || 'Default';
}

function blankAttribute() {
  return { key: '', value: '', customValue: '' };
}

function blankVariant() {
  return {
    id: Date.now() + Math.random(),
    attributes: [blankAttribute()],
    mrp: '',
    salesPrice: '',
    stock: '',
    imageFile: null,      // File object (new upload)
    imagePreview: null,   // blob: or saved URL
  };
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  input: {
    padding: '8px 10px', border: `1px solid ${KM.border}`,
    borderRadius: 7, fontSize: 13, color: KM.text,
    background: '#fff', fontFamily: 'inherit',
    outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  label: {
    fontSize: 11, fontWeight: 600, color: KM.muted,
    textTransform: 'uppercase', letterSpacing: '0.06em',
    display: 'block', marginBottom: 4,
  },
  iconBtn: (color = KM.muted) => ({
    background: 'none', border: 'none', cursor: 'pointer',
    color, fontSize: 16, padding: '4px 6px', borderRadius: 6,
    lineHeight: 1, display: 'flex', alignItems: 'center',
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// AttributeRow — one key/value pair inside a variant
// ─────────────────────────────────────────────────────────────────────────────
export function AttributeRow({ attr, onChange, onRemove, isOnly }) {
  const preset = ATTRIBUTE_PRESETS[attr.key];
  const isDropdown = preset?.type === 'dropdown';
  const showCustomInput = isDropdown && attr.value === 'Custom';
  const showTextInput = preset?.type === 'text' || !preset;
  const [keyOpen, setKeyOpen] = useState(false);
  const [keySearch, setKeySearch] = useState('');
  const keyRef = useRef();

  const filteredPresets = PRESET_KEYS.filter(k =>
    k.toLowerCase().includes(keySearch.toLowerCase())
  );

  const selectKey = (k) => {
    setKeyOpen(false);
    setKeySearch('');
    onChange({ ...attr, key: k, value: '', customValue: '' });
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', width: '100%' }}>

      {/* Key selector */}
      <div style={{ flex: '0 0 160px', position: 'relative' }} ref={keyRef}>
        <div
          onClick={() => setKeyOpen(o => !o)}
          style={{
            ...s.input, cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: attr.key ? KM.blueFaint : '#fff',
            borderColor: attr.key ? '#B8C9EE' : KM.border,
          }}
        >
          <span style={{ color: attr.key ? KM.blue : KM.muted, fontWeight: attr.key ? 600 : 400 }}>
            {attr.key || 'Select / type…'}
          </span>
          <span style={{ fontSize: 10, color: KM.muted }}>▾</span>
        </div>

        {keyOpen && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 100, width: 220,
            background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)', marginTop: 4, overflow: 'hidden',
          }}>
            <input
              autoFocus
              style={{ ...s.input, borderRadius: 0, borderWidth: '0 0 1px 0', borderColor: KM.border }}
              placeholder="Search or type custom…"
              value={keySearch}
              onChange={e => setKeySearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && keySearch.trim()) {
                  selectKey(keySearch.trim());
                }
                if (e.key === 'Escape') setKeyOpen(false);
              }}
            />
            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
              {filteredPresets.map(k => (
                <div
                  key={k}
                  onClick={() => selectKey(k)}
                  style={{
                    padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: attr.key === k ? KM.blueFaint : 'transparent',
                    color: attr.key === k ? KM.blue : KM.text,
                  }}
                  onMouseEnter={e => { if (attr.key !== k) e.currentTarget.style.background = KM.bg; }}
                  onMouseLeave={e => { if (attr.key !== k) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span>{k}</span>
                  <span style={{ fontSize: 10, color: KM.muted }}>
                    {ATTRIBUTE_PRESETS[k].type === 'dropdown' ? '▾ list' : 'Aa text'}
                  </span>
                </div>
              ))}
              {keySearch && !filteredPresets.includes(keySearch) && (
                <div
                  onClick={() => selectKey(keySearch.trim())}
                  style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: KM.orange, borderTop: `1px solid ${KM.border}` }}
                >
                  + Use "{keySearch}" as custom key
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Value input */}
      <div style={{ flex: 1 }}>
        {isDropdown ? (
          <select
            style={{ ...s.input, background: '#fff' }}
            value={attr.value}
            onChange={e => onChange({ ...attr, value: e.target.value, customValue: '' })}
          >
            <option value="">Select value…</option>
            {preset.options.map(o => <option key={o}>{o}</option>)}
          </select>
        ) : (
          <input
            style={s.input}
            placeholder={
              attr.key === 'Custom Note' ? 'e.g. Colour: Red, Font: Arial' :
              attr.key === 'Engraving' ? 'e.g. "John & Sara 2024"' :
              attr.key === 'Print Text' ? 'e.g. Company logo / name' :
              attr.key === 'Weight' ? 'e.g. 250g' :
              attr.key === 'Dimensions' ? 'e.g. 10×8×5 cm' :
              'Enter value…'
            }
            value={attr.value}
            onChange={e => onChange({ ...attr, value: e.target.value })}
          />
        )}
        {showCustomInput && (
          <input
            style={{ ...s.input, marginTop: 5 }}
            placeholder={`Custom ${attr.key.toLowerCase()}…`}
            value={attr.customValue || ''}
            onChange={e => onChange({ ...attr, customValue: e.target.value })}
          />
        )}
        {/* Custom Note helper: parse "Key: Val, Key2: Val2" and show preview chips */}
        {attr.key === 'Custom Note' && attr.value && (
          <div style={{ marginTop: 5, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {attr.value.split(',').map(p => p.trim()).filter(Boolean).map((part, i) => {
              const ci = part.indexOf(':');
              if (ci > -1) {
                const k = part.slice(0, ci).trim();
                const v = part.slice(ci + 1).trim();
                return (
                  <span key={i} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: '#FEF0EB', border: '1px solid #F5C09A', color: '#8B3A0F', fontWeight: 500 }}>
                    <span style={{ fontWeight: 700 }}>{k}:</span> {v}
                  </span>
                );
              }
              return <span key={i} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: '#FEF0EB', border: '1px solid #F5C09A', color: '#8B3A0F' }}>{part}</span>;
            })}
          </div>
        )}
      </div>

      {/* Remove attribute */}
      <button
        type="button"
        onClick={onRemove}
        disabled={isOnly}
        style={{
          ...s.iconBtn(isOnly ? '#D1D5DB' : '#EF4444'),
          marginTop: 7, cursor: isOnly ? 'default' : 'pointer',
        }}
        title="Remove attribute"
      >
        ✕
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VariantCard — one collapsible variant with its attributes + pricing
// ─────────────────────────────────────────────────────────────────────────────
function VariantCard({ variant, index, onChange, onRemove, canRemove, errors = [] }) {
  const [open, setOpen] = useState(true);
  const variantName = buildVariantName(variant.attributes);

  const updateAttr = (i, updated) => {
    const attrs = [...variant.attributes];
    attrs[i] = updated;
    onChange({ ...variant, attributes: attrs });
  };

  const addAttr = () => onChange({
    ...variant,
    attributes: [...variant.attributes, blankAttribute()],
  });

  const removeAttr = (i) => onChange({
    ...variant,
    attributes: variant.attributes.filter((_, j) => j !== i),
  });

  const updateField = (k, v) => onChange({ ...variant, [k]: v });

  const imgInputRef = useRef();

  const handleVariantImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    onChange({ ...variant, imageFile: file, imagePreview: preview });
  };

  const removeVariantImage = () => {
    onChange({ ...variant, imageFile: null, imagePreview: null });
  };

  return (
    <div style={{
      border: `1px solid ${KM.border}`, borderRadius: 10,
      background: '#fff', overflow: 'hidden', marginBottom: 10,
    }}>
      {/* Header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', cursor: 'pointer',
          background: open ? KM.blueFaint : KM.bg,
          borderBottom: open ? `1px solid ${KM.border}` : 'none',
          userSelect: 'none',
        }}
      >
        <span style={{
          width: 22, height: 22, borderRadius: 6, background: KM.blue,
          color: '#fff', fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{index + 1}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: KM.blue }}>
            {variantName}
          </span>
          {!open && (variant.mrp || variant.salesPrice) && (
            <span style={{ fontSize: 11, color: KM.muted, marginLeft: 10 }}>
              {variant.salesPrice ? `₹${variant.salesPrice}` : ''}{variant.mrp ? ` / MRP ₹${variant.mrp}` : ''}
              {variant.stock ? ` · ${variant.stock} in stock` : ''}
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, color: KM.muted }}>{open ? '▲' : '▼'}</span>
        {canRemove && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onRemove(); }}
            style={{ ...s.iconBtn('#EF4444'), marginLeft: 4 }}
            title="Remove variant"
          >
            🗑
          </button>
        )}
      </div>

      {open && (
        <div style={{ padding: '14px 14px 16px' }}>
          {errors.length > 0 && (
            <div style={{
              marginBottom: 12, padding: '8px 10px',
              background: '#FEF2F2', border: '1px solid #FCA5A5',
              borderRadius: 7, color: '#dc2626', fontSize: 11, fontWeight: 600,
            }}>
              {errors.map((msg, i) => <div key={i}>{msg}</div>)}
            </div>
          )}
          {/* Attributes */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ ...s.label, marginBottom: 0 }}>Attributes</span>
              <button
                type="button"
                onClick={addAttr}
                style={{
                  fontSize: 11, padding: '4px 10px', background: 'transparent',
                  color: KM.teal, border: `1px solid ${KM.teal}`,
                  borderRadius: 6, cursor: 'pointer', fontWeight: 600,
                }}
              >
                + Add Attribute
              </button>
            </div>

            {/* Column headers */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 6, paddingRight: 30 }}>
              <span style={{ ...s.label, flex: '0 0 160px', marginBottom: 0 }}>Attribute Key</span>
              <span style={{ ...s.label, flex: 1, marginBottom: 0 }}>Value</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {variant.attributes.map((attr, i) => (
                <AttributeRow
                  key={i}
                  attr={attr}
                  onChange={updated => updateAttr(i, updated)}
                  onRemove={() => removeAttr(i)}
                  isOnly={variant.attributes.length === 1}
                />
              ))}
            </div>
          </div>

          {/* Generated name preview */}
          <div style={{
            padding: '8px 12px', background: KM.orangeLight,
            borderRadius: 7, marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 11, color: KM.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Variant Name</span>
            <span style={{
              fontSize: 13, fontWeight: 700, color: KM.orange,
              background: '#fff', padding: '2px 10px', borderRadius: 5,
              border: `1px solid ${KM.orange}20`,
            }}>
              {variantName}
            </span>
          </div>

          {/* Pricing row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={s.label}>MRP (₹) *</label>
              <input
                style={s.input} type="number" required placeholder="0"
                value={variant.mrp}
                onChange={e => updateField('mrp', e.target.value)}
              />
            </div>
            <div>
              <label style={s.label}>Sales Price (₹) *</label>
              <input
                style={s.input} type="number" required placeholder="0"
                value={variant.salesPrice}
                onChange={e => updateField('salesPrice', e.target.value)}
              />
              {variant.mrp && variant.salesPrice && Number(variant.mrp) > 0 && (
                <span style={{ fontSize: 11, color: KM.green, fontWeight: 700, marginTop: 3, display: 'block' }}>
                  {Math.round((1 - variant.salesPrice / variant.mrp) * 100)}% off
                </span>
              )}
            </div>
            <div>
              <label style={s.label}>Stock *</label>
              <input
                style={s.input} type="number" required placeholder="0"
                value={variant.stock}
                onChange={e => updateField('stock', e.target.value)}
              />
            </div>
          </div>

          {/* Variant Image — same design as product gallery */}
          <div style={{ marginTop: 14 }}>
            <label style={s.label}>Variant Image</label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '6px 0' }}>
              {/* Upload trigger */}
              <div
                onClick={() => imgInputRef.current.click()}
                style={{
                  width: 100, height: 100,
                  border: `2px dashed ${KM.teal}`,
                  borderRadius: 12,
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
                  onChange={handleVariantImage}
                />
                <span style={{ fontSize: 22 }}>➕</span>
                <span style={{ fontSize: 11, color: KM.teal, fontWeight: 600, marginTop: 4 }}>Upload</span>
              </div>

              {/* Preview */}
              {variant.imagePreview && (
                <div style={{
                  width: 100, height: 100, position: 'relative',
                  borderRadius: 12, overflow: 'hidden',
                  border: `1px solid ${KM.border}`, flexShrink: 0,
                }}>
                  <img
                    src={variant.imagePreview}
                    alt="variant"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={removeVariantImage}
                    style={{
                      position: 'absolute', top: 5, right: 5,
                      background: '#ef4444', color: '#fff',
                      border: 'none', borderRadius: '50%',
                      width: 20, height: 20, cursor: 'pointer',
                      fontSize: 11, lineHeight: 1, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >✕</button>
                  <div style={{
                    position: 'absolute', bottom: 0, width: '100%',
                    background: 'rgba(0,0,0,0.55)', color: '#fff',
                    fontSize: 10, textAlign: 'center', padding: '2px 0',
                  }}>
                    {variant.imagePreview.startsWith('blob:') ? 'New' : 'Saved'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VariantBuilder — main export, drop this into your Products form
// ─────────────────────────────────────────────────────────────────────────────
export default function VariantBuilder({ variants, onChange, errors = [] }) {
  const addVariant = () => onChange([...variants, blankVariant()]);
  const removeVariant = (i) => onChange(variants.filter((_, j) => j !== i));
  const updateVariant = (i, updated) => {
    const v = [...variants]; v[i] = updated; onChange(v);
  };

  // Build the payload shape your backend expects
  const getPayload = () =>
    variants.map(v => ({
      variantName: buildVariantName(v.attributes),
      mrp: v.mrp,
      salesPrice: v.salesPrice,
      stock: v.stock,
      imageFile: v.imageFile || null,          // File object — append to FormData separately
      imagePreview: v.imagePreview || null,     // saved URL (if editing)
      attributes: v.attributes
        .filter(a => a.key && (a.value || a.customValue))
        .map(a => ({
          key: a.key,
          value: a.value === 'Custom' ? (a.customValue || 'Custom') : a.value,
        })),
      // Flat fields for backward-compat
      colour:      v.attributes.find(a => a.key === 'Colour')?.value || '',
      size:        v.attributes.find(a => a.key === 'Size')?.value || '',
      material:    v.attributes.find(a => a.key === 'Material')?.value || '',
      finish:      v.attributes.find(a => a.key === 'Finish')?.value || '',
      engraving:   v.attributes.find(a => a.key === 'Engraving')?.value || '',
      printText:   v.attributes.find(a => a.key === 'Print Text')?.value || '',
      weight:      v.attributes.find(a => a.key === 'Weight')?.value || '',
      dimensions:  v.attributes.find(a => a.key === 'Dimensions')?.value || '',
      customLabel: v.attributes.find(a => a.key === 'Custom Note')?.value || '',
      unit: v.attributes.find(a => a.key === 'Size')?.value || 'Free Size',
    }));

  return (
    <div style={{ gridColumn: 'span 2', background: KM.bg, border: `1px solid ${KM.border}`, borderRadius: 10, padding: 16 }}>

      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: KM.blue, letterSpacing: '0.02em' }}>
            🎁 Product Variants
          </span>
          <span style={{ fontSize: 11, color: KM.muted, marginLeft: 8 }}>
            Define custom attributes per variant (colour, size, material, etc.)
          </span>
        </div>
        <button
          type="button"
          onClick={addVariant}
          style={{
            fontSize: 12, padding: '6px 14px', background: KM.orange,
            color: '#fff', border: 'none', borderRadius: 7,
            cursor: 'pointer', fontWeight: 700,
          }}
        >
          + Add Variant
        </button>
      </div>

      {variants.map((v, i) => (
        <VariantCard
          key={v.id}
          index={i}
          variant={v}
          onChange={updated => updateVariant(i, updated)}
          onRemove={() => removeVariant(i)}
          canRemove={variants.length > 1}
          errors={errors[i] || []}
        />
      ))}


    </div>
  );
}
