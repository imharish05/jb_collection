import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../DataTable/DataTable';
import { fetchCoupons, createCoupon, editCoupon, removeCoupon } from '../../redux/services/couponsService';
import { confirmDelete } from '../../utils/sweetalert';

export default function Coupons({ showToast }) {
  const dispatch = useDispatch();
  const { items: rows, loading } = useSelector(state => state.coupons);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    code: '', type: 'percent', value: '',
    min_order: 0, max_discount: '', expires_at: '', is_active: true
  });

  useEffect(() => {
    dispatch(fetchCoupons())
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleEditClick = (c) => {
    setEditingId(c.id);
    setFormData({
      code: c.code, type: c.type, value: c.value, min_order: c.min_order,
      max_discount: c.max_discount || '',
      expires_at: c.expires_at ? c.expires_at.split('T')[0] : '',
      is_active: c.is_active
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setShowForm(false); setEditingId(null);
    setFormData({ code: '', type: 'percent', value: '', min_order: 0, max_discount: '', expires_at: '', is_active: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, max_discount: formData.max_discount || null, expires_at: formData.expires_at || null };
    const id = showToast.loading(editingId ? 'Updating coupon…' : 'Creating coupon…');
    try {
      if (editingId) {
        await dispatch(editCoupon({ id: editingId, data: payload }));
        showToast.success('Coupon updated', id);
      } else {
        await dispatch(createCoupon(payload));
        showToast.success('Coupon created', id);
      }
      resetForm();
      dispatch(fetchCoupons());
    } catch (err) {
      showToast.error(err?.response?.data?.message || err?.message || 'Operation failed', id);
    }
  };

  const handleDelete = async (couponId) => {
    confirmDelete({
      title: 'Delete Coupon?',
      message: 'Are you sure you want to delete this coupon?',
      onConfirm: async () => {
        try {
          await dispatch(removeCoupon(couponId));
        } catch (err) {
          console.error('Failed to delete coupon:', err);
        }
      },
    });
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Coupons</div>
        <button className="action-btn btn-edit" onClick={() => showForm ? resetForm() : setShowForm(true)}>
          {showForm ? 'Close' : '+ Add Coupon'}
        </button>
      </div>

      {showForm && (
        <div className="km-form-card">
          <div className="km-form-header">
            <div className="km-form-header-icon">%</div>
            <div>
              <div className="km-form-header-title">{editingId ? 'Edit Coupon' : 'Add New Coupon'}</div>
              <div className="km-form-header-sub">Live preview updates as you type</div>
            </div>
          </div>
          <div className="km-coupon-preview">
            <div className="km-coupon-ticket">
              <div className="km-coupon-stripe" />
              <div className="km-coupon-body">
                <div className="km-coupon-label">OFFER PREVIEW</div>
                <div className="km-coupon-code">{formData.code || 'CODE'}</div>
                <div className="km-coupon-value">
                  {formData.type === 'percent' ? `${formData.value || 0}%` : `₹${formData.value || 0}`}
                  <span className="km-coupon-off"> OFF</span>
                </div>
                {formData.type === 'percent' && formData.max_discount > 0 && (
                  <div className="km-coupon-cap">Up to ₹{formData.max_discount}</div>
                )}
                <div className="km-coupon-min">Min Order: ₹{formData.min_order}</div>
              </div>
              <div className="km-coupon-notch" />
            </div>
          </div>
          <div className="km-form-body">
            <form className="km-form-grid" onSubmit={handleSubmit}>
              <div className="km-field km-field-full">
                <label className="km-label">Coupon Code</label>
                <input className="km-input" name="code" type="text" placeholder="e.g. WELCOME100" required
                  value={formData.code} onChange={handleChange} />
              </div>
              <div className="km-field">
                <label className="km-label">Type</label>
                <select className="km-select" name="type" value={formData.type} onChange={handleChange}>
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div className="km-field">
                <label className="km-label">Value</label>
                <input className="km-input" name="value" type="number" required value={formData.value} onChange={handleChange} />
              </div>
              <div className="km-field">
                <label className="km-label">Min Order (₹)</label>
                <input className="km-input" name="min_order" type="number" value={formData.min_order} onChange={handleChange} />
              </div>
              <div className="km-field">
                <label className="km-label">Max Discount Cap (₹)</label>
                <input className={`km-input ${formData.type === 'fixed' ? 'km-input-disabled' : ''}`}
                  name="max_discount" type="number" placeholder={formData.type === 'fixed' ? 'N/A' : '0'}
                  disabled={formData.type === 'fixed'} value={formData.max_discount} onChange={handleChange} />
              </div>
              <div className="km-field">
                <label className="km-label">Expiry Date</label>
                <input className="km-input" name="expires_at" type="date" value={formData.expires_at} onChange={handleChange} />
              </div>
              <div className="km-field km-field-checkbox">
                <label className="km-checkbox-label">
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} />
                  Active Status
                </label>
              </div>
              <button type="submit" className="km-btn-submit">{editingId ? 'Update Coupon' : 'Save Coupon'}</button>
              <button type="button" className="km-btn-cancel" onClick={resetForm}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="km-loading">Loading...</p>
      ) : (
        <DataTable
          columns={['Code', 'Discount', 'Min Order', 'Max Cap', 'Expiry', 'Status', 'Actions']}
          initialRows={rows}
          renderRow={(row) => (
            <tr key={row.id}>
              <td className="td-code">{row.code}</td>
              <td><strong>{row.type === 'percent' ? `${row.value}%` : `₹${row.value}`}</strong></td>
              <td>₹{row.min_order}</td>
              <td>{row.type === 'percent' && row.max_discount ? `₹${row.max_discount}` : '—'}</td>
              <td className="td-muted">{row.expires_at ? new Date(row.expires_at).toLocaleDateString('en-IN') : 'No Expiry'}</td>
              <td>
                <span className={`status-pill ${row.is_active ? 'pill-active' : 'pill-inactive'}`}>
                  {row.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </td>
              <td>
                <button className="action-btn btn-edit" onClick={() => handleEditClick(row)}>Edit</button>
                <button className="action-btn btn-del" onClick={() => handleDelete(row.id)}>Delete</button>
              </td>
            </tr>
          )}
        />
      )}
    </div>
  );
}
