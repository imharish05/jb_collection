import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDeliveryZones, createDeliveryZone, editDeliveryZone, removeDeliveryZone } from '../../redux/services/deliveryZonesService';
import { confirmDelete } from '../../utils/sweetalert';
import { hasPermission } from '../../utils/authHelper';
import AccessDenied from '../AccessDenied';

const KM = {
  orange: '#b60410', blue: '#1A3A6B', green: '#39B54A',
  teal: '#00B4D8', border: '#E5E7EB', text: '#1A1A2E',
  muted: '#6B7280', bg: '#F9FAFB', red: '#EF4444',
};

// All Indian states + UTs
const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  // Union Territories
  'Andaman & Nicobar Islands','Chandigarh','Dadra & Nagar Haveli and Daman & Diu',
  'Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const BLANK = { state: '', deliveryCharge: '', status: 'Active' };

export default function DeliveryZones({ showToast }) {
  const dispatch = useDispatch();
  const { items: rows, loading } = useSelector(state => state.deliveryZones);

  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState({ ...BLANK });
  const [search, setSearch]       = useState('');
  const [errors, setErrors]       = useState({});

  useEffect(() => { dispatch(fetchDeliveryZones()); }, [dispatch]);

  if (!hasPermission('coupons_view')) { // reuse coupons permission or adapt
    return <AccessDenied moduleName="Delivery Zones" />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.state.trim()) next.state = 'Please select a state';
    if (form.deliveryCharge === '' || isNaN(Number(form.deliveryCharge))) next.deliveryCharge = 'Enter a valid charge (use 0 for free delivery)';
    setErrors(next);
    return !Object.keys(next).length;
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...BLANK });
    setErrors({});
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (z) => {
    setEditingId(z.id);
    setForm({ state: z.state, deliveryCharge: z.deliveryCharge, status: z.status });
    setErrors({});
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...BLANK });
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const tid = showToast.loading(editingId ? 'Updating zone…' : 'Adding zone…');
    try {
      const payload = { ...form, deliveryCharge: parseFloat(form.deliveryCharge) };
      if (editingId) {
        await dispatch(editDeliveryZone({ id: editingId, data: payload }));
        showToast.success('Zone updated!', tid);
      } else {
        await dispatch(createDeliveryZone(payload));
        showToast.success('Zone added!', tid);
      }
      cancel();
      dispatch(fetchDeliveryZones());
    } catch (err) {
      showToast.error(err?.response?.data?.message || 'Failed', tid);
    }
  };

  const handleDelete = (id) => {
    confirmDelete({
      title: 'Delete Zone?',
      message: 'This delivery zone will be permanently deleted.',
      onConfirm: async () => {
        const tid = showToast.loading('Deleting…');
        try {
          await dispatch(removeDeliveryZone(id));
          showToast.success('Deleted!', tid);
        } catch (err) {
          showToast.error('Failed to delete', tid);
        }
      },
    });
  };

  const filtered = rows.filter(r =>
    r.state?.toLowerCase().includes(search.toLowerCase())
  );

  /* ── styles ─────────────────────────────────── */
  const card = {
    background: '#fff', border: `1px solid ${KM.border}`,
    borderRadius: 12, marginBottom: 24, overflow: 'hidden',
  };
  const header = {
    background: KM.blue, padding: '16px 24px',
    display: 'flex', alignItems: 'center', gap: 12,
    borderTopLeftRadius: 11, borderTopRightRadius: 11,
  };
  const fld = { display: 'flex', flexDirection: 'column', gap: 5 };
  const lbl = { fontSize: 11, fontWeight: 600, color: KM.muted, textTransform: 'uppercase', letterSpacing: '.05em' };
  const inp = {
    padding: '9px 12px', border: `1px solid ${KM.border}`,
    borderRadius: 8, fontSize: 13, color: KM.text,
    background: '#fff', outline: 'none', width: '100%',
    boxSizing: 'border-box', fontFamily: 'inherit',
  };
  const errTxt = { fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 2 };
  const btn = (bg, cl = '#fff') => ({
    padding: '9px 20px', background: bg, color: cl,
    border: 'none', borderRadius: 8, fontSize: 13,
    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  });

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: KM.text }}>Delivery Zone Charges</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: KM.muted }}>
            Set delivery fees by state — applied automatically at checkout.
          </p>
        </div>
        {!showForm && (
          <button onClick={openAdd} style={{ ...btn(KM.orange), display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add Zone
          </button>
        )}
      </div>

      {/* ── Add / Edit Form ── */}
      {showForm && (
        <div style={card}>
          <div style={header}>
            <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🚚</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>
                {editingId ? 'Edit Delivery Zone' : 'Add Delivery Zone'}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Set state-wise delivery charge</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* State */}
            <div style={{ ...fld, gridColumn: 'span 2' }}>
              <label style={lbl}>State / UT *</label>
              <select name="state" value={form.state} onChange={handleChange} style={inp}>
                <option value="">— Select State —</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && <span style={errTxt}>{errors.state}</span>}
            </div>

            {/* Delivery Charge */}
            <div style={fld}>
              <label style={lbl}>Delivery Charge (₹) *</label>
              <input
                type="number" min="0" step="0.01" name="deliveryCharge"
                value={form.deliveryCharge} onChange={handleChange}
                placeholder="e.g. 50 (use 0 for free)" style={inp}
              />
              {errors.deliveryCharge && <span style={errTxt}>{errors.deliveryCharge}</span>}
              <span style={{ fontSize: 11, color: KM.muted, marginTop: 2 }}>Enter 0 for free delivery</span>
            </div>

            {/* Status */}
            <div style={fld}>
              <label style={lbl}>Status</label>
              <select name="status" value={form.status} onChange={handleChange} style={inp}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Buttons */}
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="submit" style={{ ...btn(KM.orange), flex: 1 }}>
                {editingId ? '✓ Update Zone' : '+ Add Zone'}
              </button>
              <button type="button" onClick={cancel} style={{ ...btn('#f1f5f9', KM.text), flex: 'none', minWidth: 90 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Table ── */}
      <div style={card}>
        {/* Table toolbar */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${KM.border}`, display: 'flex', alignItems: 'center', gap: 12, background: KM.bg }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search states…"
            style={{ ...inp, maxWidth: 280, padding: '8px 12px' }}
          />
          <span style={{ marginLeft: 'auto', fontSize: 12, color: KM.muted, fontWeight: 500 }}>
            {filtered.length} zone{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: KM.muted }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🚚</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: KM.text }}>No delivery zones yet</div>
            <div style={{ fontSize: 12, color: KM.muted, marginTop: 4 }}>Click "+ Add Zone" to create your first zone.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: KM.bg }}>
                  {['#', 'State', 'Delivery Charge', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '11px 16px', textAlign: 'left', fontWeight: 700,
                      fontSize: 11, color: KM.muted, textTransform: 'uppercase',
                      letterSpacing: '.05em', borderBottom: `1px solid ${KM.border}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((z, i) => (
                  <tr key={z.id} style={{ borderBottom: `1px solid ${KM.border}`, background: i % 2 === 0 ? '#fff' : KM.bg }}>
                    <td style={{ padding: '12px 16px', color: KM.muted, fontWeight: 500 }}>#{i + 1}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: KM.text }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>📍</span>
                        {z.state}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: Number(z.deliveryCharge) === 0 ? KM.green : KM.text, fontSize: 14 }}>
                      {Number(z.deliveryCharge) === 0 ? '🎉 Free' : `₹${parseFloat(z.deliveryCharge).toFixed(2)}`}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: z.status === 'Active' ? '#dcfce7' : '#fee2e2',
                        color: z.status === 'Active' ? '#16a34a' : '#dc2626',
                      }}>
                        {z.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => openEdit(z)}
                          style={{ padding: '6px 14px', background: '#EFF6FF', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(z.id)}
                          style={{ padding: '6px 14px', background: '#FEF2F2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
