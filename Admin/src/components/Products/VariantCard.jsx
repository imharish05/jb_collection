import React, { useState, useRef } from 'react';

export const ALL_OPTIONS_SCHEMA = [
  { key: 'Colour', type: 'color' },
  { key: 'Size', type: 'size' },
  { key: 'Material', type: 'text', placeholder: 'e.g. Cotton, Jute, Brass' },
  { key: 'Pack Size', type: 'text', placeholder: 'e.g. Single, Pack of 12' },
  { key: 'Weight', type: 'text', placeholder: 'e.g. 500 g, 1 kg' },
  { key: 'Volume', type: 'text', placeholder: 'e.g. 50 ml, 100 ml' },
  { key: 'Quantity', type: 'text', placeholder: 'e.g. 30 Tablets, 10 Pieces' }
];

const KM = {
  orange: '#b60410', orangeLight: '#FEF0EB', blue: '#1A3A6B',
  green: '#39B54A', teal: '#00B4D8', border: '#E5E7EB',
  text: '#1A1A2E', muted: '#6B7280', bg: '#F9FAFB', blueFaint: '#EEF2FB',
  red: '#EF4444', redLight: '#FEF2F2',
};

const formCard = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
  border: `1px solid ${KM.border}`,
  overflow: 'hidden',
  marginBottom: 20
};

const formHeader = {
  padding: '16px 20px',
  background: '#f8fafc',
  borderBottom: `1px solid ${KM.border}`,
  display: 'flex',
  alignItems: 'center',
  gap: 12
};

const headerIcon = {
  width: 32,
  height: 32,
  background: 'rgba(255,255,255,0.2)',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 16
};

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: KM.text,
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
};

const inputStyle = {
  padding: '10px 14px',
  border: `1px solid ${KM.border}`,
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s',
  background: '#fff'
};



export default function VariantCard({
  variant,
  onChange,
  errors = [],
  title = "First Variant",
  subtitle = "Fill in the variant details below (mandatory either color or size)",
  onRemove,
  index = 0,
  isEditMode = false,
  attributesSchema = ALL_OPTIONS_SCHEMA,
  isDynamicBuilder = false
}) {
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [showCustomKeyForm, setShowCustomKeyForm] = useState(false);
  const [openInputKey, setOpenInputKey] = useState(null);
  const [inlineVal, setInlineVal] = useState('');
  const [inlineHex, setInlineHex] = useState('#000000');
  const variantGalleryInputRef = useRef(null);
  const [galleryDragActive, setGalleryDragActive] = useState(false);

  const handleGalleryDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setGalleryDragActive(true);
    } else if (e.type === "dragleave") {
      setGalleryDragActive(false);
    }
  };

  const handleGalleryDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setGalleryDragActive(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      handleVariantGalleryChange({ target: { files } });
    }
  };

  const getAttr = (key) => variant?.attributes?.find(a => a.key === key)?.value || '';

  const updateAttr = (key, value, extraAttrs = []) => {
    const updated = { ...variant };
    let attrs = updated.attributes ? [...updated.attributes] : [];
    const idx = attrs.findIndex(a => a.key === key);
    if (idx !== -1) {
      if (value !== undefined) attrs[idx] = { ...attrs[idx], value };
    } else {
      attrs.push({ key, value });
    }

    extraAttrs.forEach(extra => {
      const eIdx = attrs.findIndex(a => a.key === extra.key);
      if (eIdx !== -1) {
        attrs[eIdx] = { ...attrs[eIdx], value: extra.value };
      } else {
        attrs.push({ key: extra.key, value: extra.value });
      }
    });
    updated.attributes = attrs;

    // Update variantName based on all non-ColourHex attributes with non-empty values
    updated.variantName = attrs
      .filter(a => a.key && a.key !== 'ColourHex' && a.value !== undefined && a.value !== null && String(a.value).trim() !== '')
      .map(a => `${a.key}: ${a.value}`)
      .join(' · ') || 'Default';

    onChange(updated, index);
  };

  const removeAttr = (key) => {
    const updated = { ...variant };
    let attrs = updated.attributes ? [...updated.attributes] : [];
    attrs = attrs.filter(a => a.key !== key && a.key !== 'ColourHex');
    updated.attributes = attrs;
    
    // Update variantName based on all non-ColourHex attributes with non-empty values
    updated.variantName = attrs
      .filter(a => a.key && a.key !== 'ColourHex' && a.value !== undefined && a.value !== null && String(a.value).trim() !== '')
      .map(a => `${a.key}: ${a.value}`)
      .join(' · ') || 'Default';

    onChange(updated, index);
  };

  const addAttrKey = (key) => {
    if (!key) return;
    const updated = { ...variant };
    let attrs = updated.attributes ? [...updated.attributes] : [];
    if (!attrs.some(a => a.key === key)) {
      attrs.push({ key, value: '' });
      if (/colou?r/i.test(key)) {
        attrs.push({ key: 'ColourHex', value: '#000000' });
      }
    }
    updated.attributes = attrs;
    onChange(updated, index);
  };

  const handleAddCustomKey = () => {
    const cleanKey = customKeyInput.trim();
    if (!cleanKey) return;
    addAttrKey(cleanKey);
    setCustomKeyInput('');
    setShowCustomKeyForm(false);
  };

  const handleChange = (field, value) => {
    onChange({ ...variant, [field]: value }, index);
  };

  const handleColorHexChange = (val) => {
    // Update ColourHex attr without affecting variantName
    const updated = { ...variant };
    let attrs = updated.attributes ? [...updated.attributes] : [];
    const idx = attrs.findIndex(a => a.key === 'ColourHex');
    if (idx !== -1) {
      if (val) attrs[idx] = { ...attrs[idx], value: val };
      else attrs.splice(idx, 1);
    } else if (val) {
      attrs.push({ key: 'ColourHex', value: val });
    }
    updated.attributes = attrs;
    onChange(updated, index);
  };

  const handleVariantGalleryChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    const currentPreviews = variant.galleryPreviews || [];
    const newItems = selected.map(file => ({
      url: URL.createObjectURL(file),
      file: file
    }));
    onChange({
      ...variant,
      galleryPreviews: [...currentPreviews, ...newItems]
    }, index);
    if (e.target && 'value' in e.target) {
      e.target.value = null;
    }
  };

  const removeVariantGalleryImage = (idx) => {
    const currentPreviews = variant.galleryPreviews || [];
    const itemToRemove = currentPreviews[idx];
    if (itemToRemove && itemToRemove.url?.startsWith('blob:')) {
      URL.revokeObjectURL(itemToRemove.url);
    }
    onChange({
      ...variant,
      galleryPreviews: currentPreviews.filter((_, i) => i !== idx)
    }, index);
  };


  // Compute active schema based on builder vs. locked mode
  const activeKeys = [...new Set((variant?.attributes || [])
    .map(a => a.key)
    .filter(k => k && k !== 'ColourHex'))];

  const resolvedSchemaTemp = isDynamicBuilder
    ? activeKeys.map(k => {
        const matched = ALL_OPTIONS_SCHEMA.find(o => o.key === k);
        if (matched) return matched;
        return { key: k, type: /colou?r/i.test(k) ? 'color' : (/size/i.test(k) ? 'size' : 'text') };
      })
    : attributesSchema;

  const seenSchema = new Set();
  const resolvedSchema = (resolvedSchemaTemp || []).filter(f => {
    if (!f.key) return false;
    if (seenSchema.has(f.key)) return false;
    seenSchema.add(f.key);
    return true;
  });

  const availableOptions = ALL_OPTIONS_SCHEMA.filter(o => !activeKeys.includes(o.key));

  const getFieldError = (key) => {
    if (!errors) return null;
    if (Array.isArray(errors)) {
      return errors.find(msg => msg.toLowerCase().includes(key.toLowerCase()));
    }
    if (typeof errors === 'object') {
      if (errors[key]) return errors[key];
      const matchedKey = Object.keys(errors).find(k => k.toLowerCase().includes(key.toLowerCase()));
      if (matchedKey) return errors[matchedKey];
    }
    return null;
  };

  const renderFieldError = (fieldKey) => {
    const errorMsg = getFieldError(fieldKey);
    if (!errorMsg) return null;
    return (
      <span className="field-error-msg" style={{ color: '#dc2626', fontSize: 11, fontWeight: 'bold', marginTop: 4, display: 'block' }}>
        {errorMsg}
      </span>
    );
  };

  const getUnmatchedErrors = () => {
    if (!errors) return [];
    const list = Array.isArray(errors) ? errors : Object.values(errors).filter(Boolean);
    const fieldsToTrack = ['mrp', 'salesprice', 'stock', 'gallery', ...resolvedSchema.map(f => f.key.toLowerCase())];
    return list.filter(msg => {
      const low = msg.toLowerCase();
      return !fieldsToTrack.some(f => low.includes(f));
    });
  };

  return (
    <div style={{ ...formCard, gridColumn: 'span 2' }}>
      <div style={{ ...formHeader, background: KM.blue, position: 'relative' }}>
        <div style={headerIcon}>👕</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{subtitle}</div>}
        </div>
        {onRemove && (
          <button 
            type="button" 
            onClick={() => onRemove(index)}
            style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' }}
          >
            ✕ Remove
          </button>
        )}
      </div>
      
      <div style={{ padding: '20px 24px', display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>
        
        {/* Render Attributes dynamically */}
        {resolvedSchema.map(field => {
          const value = getAttr(field.key);
          const hasValue = !!value;

          const renderHeader = () => {
            const icon = field.key === 'Colour' ? '🎨' 
                       : field.key === 'Size' ? '📐' 
                       : field.key === 'Weight' ? '⚖️' 
                       : field.key === 'Volume' ? '🍼' 
                       : field.key === 'Quantity' ? '🔢' 
                       : '⚙️';
            return (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: KM.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{icon}</span> {field.key} <span style={{ color: '#dc2626' }}>*</span>
                </span>
                {isDynamicBuilder && (
                  <button
                    type="button"
                    onClick={() => removeAttr(field.key)}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 11, fontWeight: 'bold', padding: 0 }}
                  >
                    ✕ Remove Option
                  </button>
                )}
              </div>
            );
          };

          const getPresets = () => {
            const k = field.key.toLowerCase();
            if (k.includes('pack')) return ['Single', 'Pack of 2', 'Pack of 4', 'Pack of 6'];
            if (k.includes('size')) return ['FREE SIZE', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
            if (k.includes('colour') || k.includes('color')) return ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow'];
            if (k.includes('weight')) return ['1 kg', '500 g', '250 g', '100 g'];
            if (k.includes('volume')) return ['1 L', '500 ml', '250 ml', '100 ml'];
            return [];
          };

          const presets = getPresets();

          return (
            <div key={field.key} style={{ ...fieldStyle, gridColumn: 'span 2', background: '#fafafa', padding: 12, borderRadius: 8, border: `1px solid ${KM.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {renderHeader()}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {/* Active value pill */}
                {hasValue ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#f3e8ff', border: '1px solid #c084fc', color: '#6b21a8', borderRadius: 20, fontSize: 13, fontWeight: '600' }}>
                    {field.type === 'color' && (
                      <span
                        style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid #c084fc', backgroundColor: getAttr('ColourHex') || '#000000', display: 'inline-block' }}
                      />
                    )}
                    <span>{value}</span>
                    <span
                      onClick={() => {
                        if (field.type === 'color') {
                          updateAttr(field.key, '', [{ key: 'ColourHex', value: '' }]);
                        } else {
                          updateAttr(field.key, '');
                        }
                      }}
                      style={{ cursor: 'pointer', color: '#a855f7', fontWeight: 'bold', marginLeft: 4, fontSize: 12 }}
                    >
                      ✕
                    </span>
                  </div>
                ) : null}

                {/* Inline input form if open */}
                {openInputKey === field.key ? (
                  field.type === 'color' ? (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#f8fafc', padding: 8, borderRadius: 8, border: `1px solid ${KM.border}` }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: 9, color: KM.muted, fontWeight: 700 }}>COLOUR NAME</span>
                        <input
                          style={{ ...inputStyle, padding: '5px 8px', width: 240 }}
                          placeholder="e.g. Cherry Red, Blue"
                          value={inlineVal}
                          onChange={e => setInlineVal(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: 9, color: KM.muted, fontWeight: 700 }}>HEX VALUE</span>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <input
                            type="color"
                            style={{ width: 28, height: 28, border: `1px solid ${KM.border}`, borderRadius: 6, padding: 2, cursor: 'pointer', background: '#fff' }}
                            value={inlineHex}
                            onChange={e => setInlineHex(e.target.value)}
                          />
                          <input
                            style={{ ...inputStyle, width: 80, padding: '4px 6px', fontSize: 12 }}
                            value={inlineHex}
                            onChange={e => setInlineHex(e.target.value)}
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, alignSelf: 'flex-end', marginBottom: 2 }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (inlineVal.trim()) {
                              updateAttr(field.key, inlineVal.trim(), [{ key: 'ColourHex', value: inlineHex }]);
                              setOpenInputKey(null);
                            }
                          }}
                          style={{ padding: '6px 12px', background: KM.teal, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 12 }}
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenInputKey(null)}
                          style={{ padding: '6px 12px', background: '#e2e8f0', color: KM.text, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 12 }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        style={{ ...inputStyle, padding: '6px 10px', width: 150 }}
                        placeholder={`Enter ${field.key}...`}
                        value={inlineVal}
                        onChange={e => setInlineVal(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (inlineVal.trim()) {
                              updateAttr(field.key, inlineVal.trim());
                              setOpenInputKey(null);
                            }
                          }
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (inlineVal.trim()) {
                            updateAttr(field.key, inlineVal.trim());
                            setOpenInputKey(null);
                          }
                        }}
                        style={{ padding: '6px 12px', background: KM.teal, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 12 }}
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenInputKey(null)}
                        style={{ padding: '6px 12px', background: '#e2e8f0', color: KM.text, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 12 }}
                      >
                        Cancel
                      </button>
                    </div>
                  )
                ) : (
                  /* Dashed Add button if no value is set */
                  !hasValue && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenInputKey(field.key);
                        setInlineVal('');
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 14px',
                        background: '#fff',
                        border: '1px dashed #22c55e',
                        color: '#22c55e',
                        borderRadius: 20,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                      }}
                    >
                      + Add {field.key}
                    </button>
                  )
                )}

                {/* Color HEX picker inline next to the active color pill */}
                {field.type === 'color' && hasValue && (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 12 }}>
                    <span style={{ fontSize: 11, color: KM.muted, fontWeight: 600 }}>HEX:</span>
                    <input
                      type="color"
                      style={{ width: 28, height: 28, border: `1px solid ${KM.border}`, borderRadius: 6, padding: 2, cursor: 'pointer', background: '#fff' }}
                      value={getAttr('ColourHex') || '#000000'}
                      onChange={e => handleColorHexChange(e.target.value)}
                    />
                    <input
                      style={{ ...inputStyle, width: 80, padding: '4px 6px', fontSize: 12 }}
                      value={getAttr('ColourHex') || ''}
                      onChange={e => handleColorHexChange(e.target.value)}
                      placeholder="#000000"
                    />
                  </div>
                )}
              </div>

              {/* Suggestions Presets */}
              {!hasValue && presets.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {presets.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        if (field.type === 'color') {
                          const hexMap = {
                            black: '#000000',
                            white: '#ffffff',
                            red: '#ff0000',
                            blue: '#0000ff',
                            green: '#008000',
                            yellow: '#ffff00',
                          };
                          const hex = hexMap[preset.toLowerCase()] || '#000000';
                          updateAttr(field.key, preset, [{ key: 'ColourHex', value: hex }]);
                        } else {
                          updateAttr(field.key, preset);
                        }
                      }}
                      style={{
                        padding: '4px 10px',
                        border: `1px solid ${KM.border}`,
                        borderRadius: 20,
                        background: '#fff',
                        color: KM.text,
                        fontSize: 11,
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = KM.blue; e.currentTarget.style.color = KM.blue; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = KM.border; e.currentTarget.style.color = KM.text; }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              )}

              {renderFieldError(field.key)}
            </div>
          );
        })}

        {/* Dynamic Builder: Selector to add options */}
        {isDynamicBuilder && (
          <div style={{ gridColumn: 'span 2', display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10, padding: '16px 20px', borderRadius: 10, border: `1.5px dashed ${KM.border}`, background: '#f8fafc' }}>
            <div style={{ width: '100%', fontSize: 11, fontWeight: 700, color: KM.blue, textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 4 }}>
              Add Option Type
            </div>
            {availableOptions.map(o => (
              <button
                key={o.key}
                type="button"
                onClick={() => addAttrKey(o.key)}
                style={{
                  padding: '6px 14px',
                  background: '#fff',
                  border: `1.5px dashed ${KM.blue}`,
                  color: KM.blue,
                  borderRadius: 20,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#f1f5f9'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#fff'; }}
              >
                + Add {o.key}
              </button>
            ))}
            {showCustomKeyForm ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  style={{ ...inputStyle, padding: '5px 10px', width: 150 }}
                  placeholder="Custom option key..."
                  value={customKeyInput}
                  onChange={e => setCustomKeyInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomKey(); } }}
                  autoFocus
                />
                <button type="button" onClick={handleAddCustomKey} style={{ padding: '6px 12px', background: KM.teal, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 12 }}>Add</button>
                <button type="button" onClick={() => setShowCustomKeyForm(false)} style={{ padding: '6px 12px', background: '#e2e8f0', color: KM.text, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 12 }}>Cancel</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustomKeyForm(true)}
                style={{
                  padding: '6px 14px',
                  background: '#fff',
                  border: `1.5px dashed ${KM.orange}`,
                  color: KM.orange,
                  borderRadius: 20,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
              >
                + Add Custom Type...
              </button>
            )}
          </div>
        )}

        {isEditMode && (
          <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
            <label style={labelStyle}>Status *</label>
            <select style={inputStyle} value={variant?.status || 'Active'} onChange={e => handleChange('status', e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        )}

        <div style={fieldStyle}>
          <label style={labelStyle}>Selling Price (₹) *</label>
          <input type="number" step="0.01" style={inputStyle} required value={variant?.salesPrice || ''} onChange={e => handleChange('salesPrice', e.target.value)} placeholder="0.00" />
          {renderFieldError('salesPrice')}
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>MRP Price (₹)</label>
          <input type="number" step="0.01" style={inputStyle} value={variant?.mrp || ''} onChange={e => handleChange('mrp', e.target.value)} placeholder="0.00" />
          {renderFieldError('mrp')}
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Stock Qty *</label>
          <input type="number" style={inputStyle} required value={variant?.stock || ''} onChange={e => handleChange('stock', e.target.value)} placeholder="0" />
          {renderFieldError('stock')}
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Low Stock Threshold</label>
          <input type="number" style={inputStyle} value={variant?.lowStockThreshold || '10'} onChange={e => handleChange('lowStockThreshold', e.target.value)} placeholder="10" />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>GST Mode</label>
          <select style={inputStyle} value={variant?.gstMode || 'Inclusive'} onChange={e => handleChange('gstMode', e.target.value)}>
            <option value="Inclusive">Inclusive</option>
            <option value="Exclusive">Exclusive</option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>GST Rate</label>
          <select style={inputStyle} value={variant?.gstRate || '0%'} onChange={e => handleChange('gstRate', e.target.value)}>
            <option value="0%">0%</option>
            <option value="5%">5% (SGST 2.5% + CGST 2.5%)</option>
            <option value="18%">18% (SGST 9% + CGST 9%)</option>
            <option value="40%">40% (SGST 20% + CGST 20%)</option>
          </select>
        </div>

        {/* Variant Gallery upload */}
        <div style={{ ...fieldStyle, gridColumn: 'span 2', marginTop: 10 }}>
          <label style={labelStyle}>Variant Gallery (Optional Sub-images)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <div
              onClick={() => variantGalleryInputRef.current.click()}
              onDragEnter={handleGalleryDrag}
              onDragLeave={handleGalleryDrag}
              onDragOver={handleGalleryDrag}
              onDrop={handleGalleryDrop}
              style={{
                width: 80,
                height: 80,
                border: `2px dashed ${galleryDragActive ? KM.orange : KM.border}`,
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: galleryDragActive ? 'rgba(245,158,11,0.08)' : '#fafafa',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: 20 }}>+</span>
              <span style={{ fontSize: 10, color: galleryDragActive ? KM.orange : KM.muted, fontWeight: 600 }}>add</span>
            </div>
            {(variant?.galleryPreviews || []).map((item, idx) => (
              <div key={idx} style={{ position: 'relative', width: 80, height: 80 }}>
                <img src={item?.url || item} alt="Gallery item" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: `1px solid ${KM.border}` }} />
                <button type="button" onClick={() => removeVariantGalleryImage(idx)} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: KM.orange, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            ))}
          </div>
          <input ref={variantGalleryInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleVariantGalleryChange} />
          {renderFieldError('gallery')}
        </div>

      </div>
      {getUnmatchedErrors().length > 0 && (
        <div style={{ gridColumn: 'span 2', padding: '0 24px 20px' }}>
          <span className="field-error-msg" style={{ color: '#dc2626', fontSize: 11, fontWeight: 600 }}>
            {getUnmatchedErrors().join(' · ')}
          </span>
        </div>
      )}
    </div>
  );
}

export const getProductVariantSchema = (product) => {
  if (!product) return [];
  
  // Reconstruct schema from existing variants
  const variantsList = Array.isArray(product.Variants) ? product.Variants : [];
  if (variantsList.length > 0) {
    const defaultVariant = variantsList[0];
    let attrs = [];
    if (Array.isArray(defaultVariant.attributes)) {
      attrs = defaultVariant.attributes;
    } else if (typeof defaultVariant.attributes === 'string') {
      try { attrs = JSON.parse(defaultVariant.attributes); } catch { attrs = []; }
    }
    
    // Filter out ColourHex helper and deduplicate keys to avoid double inputs
    const seen = new Set();
    const keys = attrs
      .filter(a => a.key && a.key !== 'ColourHex')
      .map(a => ({
        key: a.key,
        type: /colou?r/i.test(a.key) ? 'color' : (/size/i.test(a.key) ? 'size' : 'text')
      }))
      .filter(a => {
        if (seen.has(a.key)) return false;
        seen.add(a.key);
        return true;
      });
    if (keys.length > 0) return keys;
  }

  // Fallback to ALL_OPTIONS_SCHEMA
  return ALL_OPTIONS_SCHEMA;
};
