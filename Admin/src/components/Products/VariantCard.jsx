import React, { useState, useRef } from 'react';

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

const ErrorMsg = ({ error }) => {
  if (!error || !error.length) return null;
  return (
    <span style={{ color: '#dc2626', fontSize: 11, fontWeight: 600, marginTop: 4 }}>
      {Array.isArray(error) ? error.join(' · ') : error}
    </span>
  );
};

export default function VariantCard({
  variant,
  onChange,
  errors = [],
  title = "First Variant",
  subtitle = "Fill in the variant details below (mandatory either color or size)",
  onRemove,
  index = 0,
  isEditMode = false
}) {
  const [customSizeInput, setCustomSizeInput] = useState('');
  const variantGalleryInputRef = useRef(null);
  const mainImageInputRef = useRef(null);

  const getAttr = (key) => variant?.attributes?.find(a => a.key === key)?.value || '';

  const updateAttr = (key, value) => {
    const updated = { ...variant };
    let attrs = updated.attributes ? [...updated.attributes] : [];
    const idx = attrs.findIndex(a => a.key === key);
    if (idx !== -1) {
      if (value) attrs[idx].value = value;
      else attrs.splice(idx, 1);
    } else if (value) {
      attrs.push({ key, value });
    }
    updated.attributes = attrs;
    
    // Update variantName based on color and size
    const colVal = attrs.find(a => a.key === 'Colour')?.value || '';
    const sizeVal = attrs.find(a => a.key === 'Size')?.value || '';
    updated.variantName = [
      colVal ? `Colour: ${colVal}` : '',
      sizeVal ? `Size: ${sizeVal}` : ''
    ].filter(Boolean).join(' · ') || 'Default';

    onChange(updated, index);
  };

  const handleChange = (field, value) => {
    onChange({ ...variant, [field]: value }, index);
  };

  const handleColorNameChange = (val) => updateAttr('Colour', val);
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
  const handleSizeChange = (val) => updateAttr('Size', val);

  const handleVariantGalleryChange = (e) => {
    const selected = Array.from(e.target.files);
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
    e.target.value = null;
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

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange({ ...variant, imageFile: file, imagePreview: url }, index);
    e.target.value = null;
  };

  const currentSize = getAttr('Size');

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
        <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
          <label style={labelStyle}>Color Name <span style={{ color: KM.muted, fontWeight: 400, textTransform: 'none' }}>(shown to customer)</span></label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input style={{ ...inputStyle, flex: 1 }} value={getAttr('Colour')} onChange={e => handleColorNameChange(e.target.value)} placeholder="e.g. Cherry Red, Blue, Maroon..." />
          </div>
          <span style={{ fontSize: 11, color: KM.muted, marginTop: 2 }}>
            Customer sees this name — the hex below is used only for the colour swatch.
          </span>
        </div>

        <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
          <label style={labelStyle}>Color HEX <span style={{ color: KM.muted, fontWeight: 400, textTransform: 'none' }}>(for colour swatch preview)</span></label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="color"
              style={{ width: 50, height: 38, border: `1px solid ${KM.border}`, borderRadius: 8, padding: 3, cursor: 'pointer', background: '#fff' }}
              value={getAttr('ColourHex') || '#000000'}
              onChange={e => handleColorHexChange(e.target.value)}
            />
            <input
              style={{ ...inputStyle, width: 150 }}
              value={getAttr('ColourHex') || ''}
              onChange={e => handleColorHexChange(e.target.value)}
              placeholder="#000000"
            />
            <span style={{ fontSize: 12, color: KM.muted }}>Pick a colour — this fills the swatch on the product page.</span>
          </div>
        </div>

        <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
          <label style={labelStyle}>Size</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {['FREE SIZE', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map(sz => {
              const isSelected = currentSize.toUpperCase() === sz;
              return (
                <button key={sz} type="button" onClick={() => handleSizeChange(sz)} style={{ padding: '8px 16px', border: `1px solid ${isSelected ? '#8252e9' : KM.border}`, borderRadius: 8, background: isSelected ? '#8252e9' : '#fff', color: isSelected ? '#fff' : '#1e293b', fontWeight: 'bold', fontSize: 13, cursor: 'pointer' }}>
                  {sz}
                </button>
              );
            })}
          </div>

          {currentSize && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#f3e8ff', border: '1px solid #c084fc', color: '#6b21a8', borderRadius: 6, fontSize: 13, fontWeight: '600', marginTop: 4, marginBottom: 8, width: 'fit-content' }}>
              <span>{currentSize}</span>
              <span onClick={() => handleSizeChange('')} style={{ cursor: 'pointer', color: '#a855f7', fontWeight: 'bold', marginLeft: 4 }}>✕</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <input style={inputStyle} value={customSizeInput} onChange={e => setCustomSizeInput(e.target.value)} placeholder="Type and press Enter or click a preset above" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (customSizeInput.trim()) { handleSizeChange(customSizeInput.trim()); setCustomSizeInput(''); } } }} />
            <button type="button" onClick={() => { if (customSizeInput.trim()) { handleSizeChange(customSizeInput.trim()); setCustomSizeInput(''); } }} style={{ padding: '8px 20px', background: '#8252e9', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Add</button>
          </div>
        </div>

        <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
          <label style={labelStyle}>SKU Code</label>
          <input style={inputStyle} value={variant?.sku || ''} onChange={e => handleChange('sku', e.target.value)} placeholder="Unique SKU, e.g. TIN-SAR-001-RED" />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Selling Price (₹) *</label>
          <input type="number" step="0.01" style={inputStyle} required value={variant?.salesPrice || ''} onChange={e => handleChange('salesPrice', e.target.value)} placeholder="0.00" />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>MRP Price (₹)</label>
          <input type="number" step="0.01" style={inputStyle} value={variant?.mrp || ''} onChange={e => handleChange('mrp', e.target.value)} placeholder="0.00" />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Stock Qty *</label>
          <input type="number" style={inputStyle} required value={variant?.stock || ''} onChange={e => handleChange('stock', e.target.value)} placeholder="0" />
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

        {isEditMode && (
          <div style={fieldStyle}>
            <label style={labelStyle}>Status *</label>
            <select style={inputStyle} value={variant?.status || 'Active'} onChange={e => handleChange('status', e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        )}

        {/* Variant Gallery upload */}
        <div style={{ ...fieldStyle, gridColumn: 'span 2', marginTop: 10 }}>
          <label style={labelStyle}>Variant Gallery (Optional Sub-images)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <div onClick={() => variantGalleryInputRef.current.click()} style={{ width: 80, height: 80, border: `2px dashed ${KM.border}`, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fafafa' }}>
              <span style={{ fontSize: 20 }}>+</span>
              <span style={{ fontSize: 10, color: KM.muted, fontWeight: 600 }}>add</span>
            </div>
            {(variant?.galleryPreviews || []).map((item, idx) => (
              <div key={idx} style={{ position: 'relative', width: 80, height: 80 }}>
                <img src={item?.url || item} alt="Gallery item" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: `1px solid ${KM.border}` }} />
                <button type="button" onClick={() => removeVariantGalleryImage(idx)} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: KM.orange, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            ))}
          </div>
          <input ref={variantGalleryInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleVariantGalleryChange} />
        </div>

      </div>
      <div style={{ gridColumn: 'span 2', padding: '0 24px 20px' }}>
        <ErrorMsg error={errors} />
      </div>
    </div>
  );
}
