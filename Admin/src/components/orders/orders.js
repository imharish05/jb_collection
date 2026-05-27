import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../DataTable/DataTable';
import { fetchOrders, changeOrderStatus } from '../../redux/services/ordersService';

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const labelFor = s => ({
  pending: 'New / Pending',
  confirmed: 'Confirmed',
  processing: 'Out for Delivery',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}[s] || s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
const parseAddr = (raw) => { try { return JSON.parse(raw); } catch { return null; } };

const AddressBlock = ({ addr, phone, email }) => {
  if (!addr) return <p className="td-muted">Not provided</p>;
  return (
    <div className="km-billing-info">
      <div><strong>{addr.firstName} {addr.lastName}</strong></div>
      {addr.businessName && <div className="td-muted">{addr.businessName}</div>}
      <div>{addr.address}{addr.apartment ? `, ${addr.apartment}` : ''}</div>
      <div>{addr.city}{addr.postCode ? ` — ${addr.postCode}` : ''}</div>
      {addr.state && <div className="td-muted">{addr.state}</div>}
      {phone && <div className="td-muted">{phone}</div>}
      {email && <div className="td-muted">{email}</div>}
    </div>
  );
};

export default function Orders({ status = null }) {
  const dispatch = useDispatch();
  const { items: allOrders, loading } = useSelector(state => state.orders);
  const [expanded, setExpanded] = useState(null);

  const rows = status ? allOrders.filter(o => o.status === status) : allOrders;

  useEffect(() => {
    setExpanded(null);
    dispatch(fetchOrders());
  }, [dispatch, status]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await dispatch(changeOrderStatus({ id: orderId, status: newStatus }));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">{status ? `${labelFor(status)} Orders` : 'All Orders'}</div>
        {!loading && <span className="km-count-badge">{rows.length}</span>}
      </div>

      {loading ? (
        <p className="km-loading">Loading orders...</p>
      ) : rows.length === 0 ? (
        <p className="km-empty">No orders found.</p>
      ) : (
        <DataTable
          columns={['#ID', 'Customer', 'Items', 'Total', 'Coupon', 'Status', 'Date', 'Details']}
          initialRows={rows}
          renderRow={(order) => {
            const billing = parseAddr(order.billing_address);
            const shipping = parseAddr(order.shipping_address);
            const isOpen = expanded === order.id;
            const shippingAddr = shipping || billing;
            const sameAddress = !shipping || JSON.stringify(shipping) === JSON.stringify(billing);
            return (
              <>
                <tr key={order.id}>
                  <td className="td-id">#{order.id}</td>
                  <td>
                    <div className="td-name">{order.customer_name}</div>
                    <div className="td-sub">{order.customer_email}</div>
                    <div className="td-sub">{order.customer_phone}</div>
                  </td>
                  <td><span className="km-count-badge">{order.items?.length || 0} items</span></td>
                  <td className="td-price">₹{Number(order.total).toFixed(2)}</td>
                  <td>
                    {order.coupon_code
                      ? <span className="status-pill pill-approved">{order.coupon_code}</span>
                      : <span className="td-muted">—</span>}
                  </td>
                  <td>
                    <select className={`km-status-select km-status-${order.status}`}
                      value={order.status} onChange={e => updateStatus(order.id, e.target.value)}>
                      {STATUS_OPTIONS.map(st => <option key={st} value={st}>{labelFor(st)}</option>)}
                    </select>
                  </td>
                  <td className="td-muted">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <button className="action-btn btn-edit" onClick={() => setExpanded(isOpen ? null : order.id)}>
                      {isOpen ? '▲ Hide' : '▼ View'}
                    </button>
                  </td>
                </tr>
                {isOpen && (
                  <tr key={`${order.id}-detail`}>
                    <td colSpan={8} className="km-order-detail-cell">
                      <div className="km-form-card">
                        <div className="km-form-header">
                          <div className="km-form-header-icon">📦</div>
                          <div>
                            <div className="km-form-header-title">Order #{order.id} — {order.customer_name}</div>
                            <div className="km-form-header-sub">Payment ID: {order.payment_id || '—'}</div>
                          </div>
                        </div>
                        <div className="km-order-detail-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                          <div>
                            <div className="km-detail-section-title">Items Ordered</div>
                            {order.items?.length > 0
                              ? order.items.map((item, i) => (
                                <div key={i} className="km-order-item-row">
                                  <span>
                                    {item.productName}
                                    {item.selectedVariantName && (
                                      <span style={{ marginLeft: 5, fontSize: 10, fontWeight: 700, background: '#e8f0ff', color: '#1A52A8', padding: '1px 6px', borderRadius: 10, whiteSpace: 'nowrap' }}>
                                        {item.selectedVariantName}
                                      </span>
                                    )}
                                    <span className="td-muted"> × {item.quantity}</span>
                                  </span>
                                  <span className="td-price-sm">₹{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))
                              : <p className="td-muted">No items found</p>}
                          </div>
                          <div>
                            <div className="km-detail-section-title">Billing Address</div>
                            <AddressBlock addr={billing} phone={order.customer_phone} email={order.customer_email} />
                          </div>
                          <div>
                            <div className="km-detail-section-title">
                              Shipping Address
                              {sameAddress && (
                                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: 20 }}>Same as billing</span>
                              )}
                            </div>
                            <AddressBlock addr={shippingAddr} phone={!sameAddress ? order.customer_phone : null} email={null} />
                          </div>
                          <div>
                            <div className="km-detail-section-title">Payment Summary</div>
                            <div className="km-payment-row"><span className="td-muted">Subtotal</span><span>₹{Number(order.subtotal).toFixed(2)}</span></div>
                            <div className="km-payment-row"><span className="td-muted">Tax</span><span>₹{Number(order.tax).toFixed(2)}</span></div>
                            <div className="km-payment-row"><span className="td-muted">Delivery</span><span className="td-green">FREE</span></div>
                            {order.discount > 0 && (
                              <div className="km-payment-row">
                                <span className="td-muted">Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
                                <span className="td-green">−₹{Number(order.discount).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="km-payment-total"><span>Total Paid</span><span className="td-price">₹{Number(order.total).toFixed(2)}</span></div>
                            {order.order_notes && <div className="km-order-notes">{order.order_notes}</div>}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          }}
        />
      )}
    </div>
  );
}