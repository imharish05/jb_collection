import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../DataTable/DataTable';
import { fetchCombos, createCombo, editCombo, removeCombo } from '../../redux/services/comboService';
import { fetchProducts } from '../../redux/services/productsService';
import { confirmDelete } from '../../utils/sweetalert';

// ── Categories-style Image Upload (matches Categories.js exactly) ─────────────
function ImageUploadField({ label = 'Image', imageFile, preview, fileInputRef, onFileChange, onClear }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: 'span 2' }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, alignItems: 'flex-start' }}>
        <div
          className={`combo-drop-zone${imageFile ? ' combo-drop-zone--active' : ''}`}
          onClick={() => fileInputRef.current.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onFileChange}
          />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, textAlign: 'center' }}>{imageFile ? '✅' : '📸'}</div>
            <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>
              {imageFile ? <b>{imageFile.name}</b> : <>Click to <b>browse</b> or drag image</>}
            </p>
          </div>
        </div>
        {preview && (
          <div style={{ width: 110, height: 110, borderRadius: 12, overflow: 'hidden', position: 'relative', border: '2px solid #487fff', flexShrink: 0 }}>
            <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button type="button" onClick={onClear}
              style={{ position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
const IMG_URL = process.env.REACT_APP_IMG_URL;

const getImg = (p) => {
  if (!p) return null;
  if (p.startsWith('http')) return p;
  return `${IMG_URL}/uploads/${p.replace(/^\//, '').replace(/^uploads\//, '')}`;
};

const KM = {
  orange: '#F15A24', orangeLight: '#FEF0EB', blue: '#1A3A6B',
  green: '#39B54A', teal: '#00B4D8', border: '#E5E7EB',
  text: '#1A1A2E', muted: '#6B7280', bg: '#F9FAFB',
};
const field  = { display: 'flex', flexDirection: 'column', gap: 5 };
const lbl    = { fontSize: 11, fontWeight: 500, color: KM.muted, textTransform: 'uppercase', letterSpacing: '0.05em' };
const inp    = { padding: '9px 12px', border: `1px solid ${KM.border}`, borderRadius: 8, fontSize: 13, color: KM.text, background: '#fff', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' };

const BLANK = { name: '', label: '', value: '', price: '', discountedPrice: '', description: '', isActive: true };

export default function Combos({ showToast }) {
  const dispatch = useDispatch();
  const { items: combos, loading } = useSelector(s => s.combos  || {});
  const { items: allProducts }     = useSelector(s => s.products || {});

  const [showForm,    setShowForm]    = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [formData,    setFormData]    = useState({ ...BLANK });
  const [selectedIds, setSelectedIds] = useState([]);   // product UUIDs in this combo
  const [imgFile,     setImgFile]     = useState(null);
  const [imgPreview,  setImgPreview]  = useState(null);
  const [search,      setSearch]      = useState('');
  const fileRef = useRef();

  useEffect(() => {
    dispatch(fetchCombos());
    dispatch(fetchProducts());
  }, []);

  const closeForm = () => {
    setShowForm(false); setEditingId(null);
    setFormData({ ...BLANK }); setSelectedIds([]);
    setImgFile(null); setImgPreview(null); setSearch('');
  };

  const handleEdit = (c) => {
    setEditingId(c.id);
    setFormData({
      name:            c.name            || '',
      label:           c.label           || '',
      value:           c.value           || '',
      price:           c.price           || '',
      discountedPrice: c.discountedPrice || '',
      description:     c.description     || '',
      isActive:        c.isActive !== false,
    });
    let pIds = c.productIds || [];
    if (typeof pIds === 'string') { try { pIds = JSON.parse(pIds); } catch { pIds = []; } }
    setSelectedIds(Array.isArray(pIds) ? pIds : []);
    setImgFile(null);
    setImgPreview(c.image ? getImg(c.image) : null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImgChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImgFile(f);
    setImgPreview(URL.createObjectURL(f));
  };

  const toggleProduct = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Auto-fill label + value from name
  const handleNameChange = (val) => {
    const slug = val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setFormData(f => ({
      ...f, name: val,
      label: val,
      value: slug,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name',  formData.name);
    fd.append('label', formData.label || formData.name);
    fd.append('value', formData.value || formData.name.toLowerCase().replace(/\s+/g, '-'));
    fd.append('price', formData.price);
    if (formData.discountedPrice) fd.append('discountedPrice', formData.discountedPrice);
    if (formData.description)     fd.append('description',     formData.description);
    fd.append('isActive',   formData.isActive);
    fd.append('productIds', JSON.stringify(selectedIds));
    if (imgFile) fd.append('image', imgFile);

    const tid = showToast.loading(editingId ? 'Updating combo…' : 'Adding combo…');
    try {
      if (editingId) {
        await dispatch(editCombo({ id: editingId, formData: fd }));
        showToast.success('Combo updated', tid);
      } else {
        await dispatch(createCombo(fd));
        showToast.success('✨ Combo added', tid);
      }
      closeForm();
    } catch (err) {
      showToast.error(err?.response?.data?.message || 'Operation failed', tid);
    }
  };


   const handleDelete = (id) => {
      confirmDelete({
        title: 'Delete Combo?',
        message: 'Are you sure you want to delete this combo?',
        onConfirm: async () => {
          try {
            await dispatch(removeCombo(id));
          } catch (err) {
            console.error('Failed to delete combo:', err);
          }
        },
      });
    };
  

  // Filtered product list for the picker
  const filteredProducts = allProducts.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const disc = formData.price && formData.discountedPrice
    ? Math.round((1 - formData.discountedPrice / formData.price) * 100)
    : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="section-title">Combos</div>
        <button className="action-btn btn-edit" onClick={() => showForm ? closeForm() : setShowForm(true)}>
          {showForm ? 'Close' : '+ Add Combo'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
          {/* Header */}
          <div style={{ background: KM.blue, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16 }}>🎁</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>{editingId ? 'Edit Combo' : 'Add New Combo'}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 }}>Bundle products into a combo with a special price</div>
            </div>
          </div>

          <div style={{ padding: '20px 24px 24px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>

              {/* Name */}
              <div style={{ ...field, gridColumn: 'span 2' }}>
                <label style={lbl}>Combo Name *</label>
                <input style={inp} required value={formData.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g. Birthday Gift Combo" />
              </div>

              {/* Price */}
              <div style={field}>
                <label style={lbl}>MRP (₹) *</label>
                <input style={inp} type="number" required min="0" value={formData.price}
                  onChange={e => setFormData(f => ({ ...f, price: e.target.value }))}
                  placeholder="0" />
              </div>
              <div style={field}>
                <label style={lbl}>Discounted Price (₹)</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ ...inp, paddingRight: disc > 0 ? 72 : 12 }} type="number" min="0"
                    value={formData.discountedPrice}
                    onChange={e => setFormData(f => ({ ...f, discountedPrice: e.target.value }))}
                    placeholder="0" />
                  {disc > 0 && (
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, color: KM.orange, background: KM.orangeLight, padding: '2px 7px', borderRadius: 4 }}>
                      {disc}% OFF
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div style={{ ...field, gridColumn: 'span 2' }}>
                <label style={lbl}>Description</label>
                <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }}
                  value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder="What's included in this combo…" />
              </div>

              {/* Status */}
              <div style={field}>
                <label style={lbl}>Status</label>
                <select style={inp} value={formData.isActive}
                  onChange={e => setFormData(f => ({ ...f, isActive: e.target.value === 'true' }))}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              {/* Image — categories-style drop zone */}
              <ImageUploadField
                label="Combo Image"
                imageFile={imgFile}
                preview={imgPreview}
                fileInputRef={fileRef}
                onFileChange={handleImgChange}
                onClear={() => {
                  setImgFile(null);
                  const original = editingId ? combos.find(c => c.id === editingId) : null;
                  setImgPreview(original?.image ? getImg(original.image) : null);
                  if (fileRef.current) fileRef.current.value = '';
                }}
              />

              {/* Product Picker */}
              <div style={{ gridColumn: 'span 2', border: `1px solid ${KM.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ background: KM.bg, padding: '10px 14px', borderBottom: `1px solid ${KM.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: KM.text }}>
                    Products in Combo
                    <span style={{ marginLeft: 8, background: KM.teal, color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: 11 }}>{selectedIds.length}</span>
                  </span>
                  <input
                    style={{ ...inp, width: 200, padding: '6px 10px', fontSize: 12 }}
                    placeholder="Search products…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div style={{ maxHeight: 260, overflowY: 'auto', padding: '8px 0' }}>
                  {filteredProducts.length === 0 && (
                    <div style={{ padding: '16px', textAlign: 'center', color: KM.muted, fontSize: 13 }}>No products found</div>
                  )}
                  {filteredProducts.map(p => {
                    const checked = selectedIds.includes(p.id);
                    const imgPath = Array.isArray(p.image) ? p.image[0] : p.image;
                    return (
                      <div key={p.id}
                        onClick={() => toggleProduct(p.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 14px', cursor: 'pointer',
                          background: checked ? '#EFF6FF' : 'transparent',
                          borderLeft: checked ? `3px solid ${KM.teal}` : '3px solid transparent',
                          transition: 'background 0.15s',
                        }}
                      >
                        <input type="checkbox" readOnly checked={checked}
                          style={{ accentColor: KM.teal, width: 15, height: 15, cursor: 'pointer' }} />
                        {imgPath ? (
                          <img src={getImg(imgPath)} alt="" width={32} height={32}
                            style={{ borderRadius: 6, objectFit: 'cover', border: `1px solid ${KM.border}` }} />
                        ) : (
                          <div style={{ width: 32, height: 32, borderRadius: 6, background: KM.bg, border: `1px solid ${KM.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎁</div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: KM.text }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: KM.muted }}>₹{p.price} · {p.Variants?.length || 0} variants</div>
                        </div>
                        {checked && <span style={{ fontSize: 11, color: KM.teal, fontWeight: 700 }}>✓ Added</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button type="submit" style={{ gridColumn: 'span 2', padding: 11, background: KM.orange, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>
                {editingId ? 'Update Combo' : 'Save Combo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? <p style={{ padding: 20 }}>Loading combos…</p> : (
        <DataTable
          columns={['No.', 'Image', 'Name', 'Label', 'Price', 'Offer', 'Products', 'Status', 'Actions']}
          initialRows={combos}
          renderRow={(row, i) => (
            <tr key={row.id}>
              <td style={{ color: KM.muted, fontSize: 11 }}>{i + 1}</td>
              <td>
                {row.image ? (
                  <img src={getImg(row.image)} alt={row.name} width={40} height={40}
                    style={{ borderRadius: 8, objectFit: 'cover', border: `1px solid ${KM.border}` }} />
                ) : <span style={{ fontSize: 22 }}>🎁</span>}
              </td>
              <td style={{ fontWeight: 600, fontSize: 13 }}>{row.name}</td>
              <td style={{ fontSize: 12, color: KM.muted }}>{row.label}</td>
              <td style={{ fontWeight: 700 }}>₹{row.price}</td>
              <td>
                {row.discountedPrice ? (
                  <div>
                    <div style={{ fontWeight: 700, color: KM.green }}>₹{row.discountedPrice}</div>
                    {row.price > 0 && (
                      <div style={{ fontSize: 10, color: KM.orange, fontWeight: 600 }}>
                        {Math.round((1 - row.discountedPrice / row.price) * 100)}% off
                      </div>
                    )}
                  </div>
                ) : <span style={{ color: KM.muted }}>—</span>}
              </td>
              <td>
                {(() => {
                  const ids = typeof row.productIds === 'string'
                    ? (() => { try { return JSON.parse(row.productIds); } catch { return []; } })()
                    : (Array.isArray(row.productIds) ? row.productIds : []);
                  if (!ids.length) return <span style={{ color: KM.muted }}>—</span>;
                  const names = ids.map(id => allProducts.find(p => p.id === id)?.name).filter(Boolean);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontSize: 11, background: '#f0f4ff', color: KM.blue, borderRadius: 4, padding: '2px 8px', fontWeight: 600, border: '1px solid #c7d4f0', display: 'inline-block', width: 'fit-content' }}>
                        {ids.length} item{ids.length !== 1 ? 's' : ''}
                      </span>
                     
                    </div>
                  );
                })()}
              </td>
              <td>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: row.isActive ? '#ecfdf5' : '#fef2f2', color: row.isActive ? KM.green : '#dc2626' }}>
                  {row.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="action-btn btn-edit" onClick={() => handleEdit(row)}>Edit</button>
                  <button className="action-btn btn-del"  onClick={() => handleDelete(row.id)}>Delete</button>
                </div>
              </td>
            </tr>
          )}
        />
      )}

      <style>{`
        .combo-drop-zone {
          flex: 1;
          height: 110px;
          border: 2px dashed rgba(0, 0, 0, 0.1);
          background: rgba(0, 0, 0, 0.02);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .combo-drop-zone:hover {
          border-color: #60a5fa;
          background: #eff6ff;
        }
        .combo-drop-zone--active {
          border-color: #45b369;
          background: rgba(69, 179, 105, 0.05);
        }
      `}</style>
    </div>
  );
}