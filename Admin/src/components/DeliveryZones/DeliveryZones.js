import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../DataTable/DataTable';
import { fetchDeliveryZones, createDeliveryZone, editDeliveryZone, removeDeliveryZone } from '../../redux/services/deliveryZonesService';
import { confirmDelete } from '../../utils/sweetalert';
import { hasPermission } from '../../utils/authHelper';
import AccessDenied from '../AccessDenied';

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
  const [errors, setErrors]       = useState({});

  useEffect(() => { dispatch(fetchDeliveryZones()); }, [dispatch]);

  if (!hasPermission('coupons_view')) {
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
    if (form.deliveryCharge === '' || isNaN(Number(form.deliveryCharge)))
      next.deliveryCharge = 'Enter a valid charge (use 0 for free delivery)';
    setErrors(next);
    return !Object.keys(next).length;
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...BLANK });
    setErrors({});
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
      resetForm();
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

  return (
    <div className="categories-container">
      <div className="section-header">
        <div className="section-title">Delivery Zone Charges</div>
        <button
          className="action-btn btn-edit"
          onClick={() => { if (showForm) resetForm(); else openAdd(); }}
        >
          {showForm ? 'Close' : '+ Add Zone'}
        </button>
      </div>

      {showForm && (
        <div className="km-form-card fade-in">
          <div className="km-form-header">
            <div className="km-form-header-icon">🚚</div>
            <div>
              <div className="km-form-header-title">{editingId ? 'Edit Delivery Zone' : 'Add Delivery Zone'}</div>
              <div className="km-form-header-sub">Set state-wise delivery charge</div>
            </div>
          </div>

          <div className="km-form-body">
            <form className="km-form-grid" onSubmit={handleSubmit}>

              {/* State */}
              <div className="km-field km-field-full">
                <label className="km-label">State / UT *</label>
                <select
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className={`km-input${errors.state ? ' km-input-error' : ''}`}
                >
                  <option value="">— Select State —</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && <div className="km-error-msg">⚠ {errors.state}</div>}
              </div>

              {/* Delivery Charge */}
              <div className="km-field">
                <label className="km-label">Delivery Charge (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="deliveryCharge"
                  value={form.deliveryCharge}
                  onChange={handleChange}
                  placeholder="e.g. 50 (use 0 for free)"
                  className={`km-input${errors.deliveryCharge ? ' km-input-error' : ''}`}
                />
                {errors.deliveryCharge && <div className="km-error-msg">⚠ {errors.deliveryCharge}</div>}
                <span style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Enter 0 for free delivery</span>
              </div>

              {/* Status */}
              <div className="km-field">
                <label className="km-label">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="km-input"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Form Actions */}
              <div className="km-form-actions" style={{ display: 'flex' }}>
                <button type="submit" className="km-btn-submit">
                  {editingId ? 'Update Zone' : 'Save Zone'}
                </button>
                <button type="button" className="km-btn-cancel" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="km-loading">Loading delivery zones...</p>
      ) : (
        <DataTable
          columns={(() => {
            const cols = ['#', 'State', 'Delivery Charge', 'Status'];
            cols.push('Actions');
            return cols;
          })()}
          initialRows={rows}
          renderRow={(row, i) => (
            <tr key={row.id}>
              <td className="td-id">{i + 1}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 15 }}>📍</span>
                  {row.state}
                </div>
              </td>
              <td style={{ fontWeight: 700, color: Number(row.deliveryCharge) === 0 ? '#16a34a' : undefined }}>
                {Number(row.deliveryCharge) === 0 ? '🎉 Free' : `₹${parseFloat(row.deliveryCharge).toFixed(2)}`}
              </td>
              <td>
                <span className={`status-pill ${row.status === 'Active' ? 'pill-active' : 'pill-inactive'}`}>
                  {row.status}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="action-btn btn-edit" onClick={() => openEdit(row)}>Edit</button>
                  <button className="action-btn btn-del" onClick={() => handleDelete(row.id)}>Delete</button>
                </div>
              </td>
            </tr>
          )}
        />
      )}

      <style>{`
        .km-form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .km-field-full {
          grid-column: span 2;
        }

        .km-error-msg {
          color: #ef4444;
          font-size: 12px;
          margin-top: 6px;
        }

        .km-input-error {
          border-color: #ef4444 !important;
        }

        .km-form-actions {
          grid-column: span 2;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 10px;
          padding-top: 20px;
          border-top: 1px solid rgba(0,0,0,0.05);
        }

        .km-btn-submit {
          padding: 10px 24px;
          background: #487fff;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .km-btn-cancel {
          padding: 10px 24px;
          background: #f1f1f1;
          color: #333;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .km-btn-submit:hover, .km-btn-cancel:hover {
          opacity: 0.8;
        }

        .fade-in {
          animation: kmFadeIn 0.3s ease-out;
        }

        @keyframes kmFadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
