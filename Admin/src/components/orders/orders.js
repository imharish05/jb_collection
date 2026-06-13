import { useMemo, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../DataTable/DataTable';
import { fetchOrders, changeOrderStatus, changeOrderItemStatus } from '../../redux/services/ordersService';

const STATUS_OPTIONS = ['confirmed','shipped','processing', 'delivered', 'cancelled', 'returned'];
const labelFor = s => ({
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  processing: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
}[s] || s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
const safeNumber = (v, fallback = 0) => {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

const parseAddr = (raw) => {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw !== 'string') return null;
  try { return JSON.parse(raw); } catch { return null; }
};

const normalizeAddress = (addr) => {
  if (!addr) return null;

  // New Address model shape (Server/models/Address.js)
  if (addr.fullName && addr.street) {
    const parts = [
      addr.street,
      addr.apartment ? addr.apartment : null,
      addr.city ? `${addr.city}${addr.pincode ? ` — ${addr.pincode}` : ''}` : null,
      addr.state || null,
      addr.country || null,
    ].filter(Boolean);
    return {
      name: addr.fullName,
      businessName: addr.businessName || '',
      lines: parts,
      phone: addr.phone || null,
    };
  }

  // Legacy JSON string shape used by older orders
  const name = [addr.firstName, addr.lastName].filter(Boolean).join(' ').trim();
  const line1 = addr.address || '';
  const line2 = addr.apartment ? addr.apartment : '';
  const line3 = [addr.city, addr.postCode ? `— ${addr.postCode}` : ''].filter(Boolean).join(' ').trim();
  const parts = [line1, line2, line3, addr.state, addr.country].filter(Boolean);

  return {
    name: name || addr.fullName || '',
    businessName: addr.businessName || '',
    lines: parts,
    phone: addr.phone || null,
  };
};

const AddressBlock = ({ addr, fallbackPhone, email }) => {
  const n = normalizeAddress(addr);
  if (!n) return <p className="td-muted">Not provided</p>;
  return (
    <div className="km-billing-info">
      {n.name && <div><strong>{n.name}</strong></div>}
      {n.businessName && <div className="td-muted">{n.businessName}</div>}
      {n.lines.map((l, idx) => (
        <div key={idx}>{l}</div>
      ))}
      {(n.phone || fallbackPhone) && <div className="td-muted">{n.phone || fallbackPhone}</div>}
      {email && <div className="td-muted">{email}</div>}
    </div>
  );
};

export default function Orders({ status = null }) {
  const dispatch = useDispatch();
  const { items: allOrders, loading } = useSelector(state => state.orders);
  const [expanded, setExpanded] = useState(null);

  const rows = useMemo(() => {
    const normalized = (Array.isArray(allOrders) ? allOrders : []).map((o) => {
      const user = o.user || o.User || null;
      const items = o.items || o.orderItems || [];
      const coupon = o.coupon_code ?? o.couponCode ?? null;
      const total = o.total ?? o.totalAmount ?? o.total_amount ?? null;
      const customerName = o.customer_name ?? user?.name ?? user?.fullName ?? '';
      const customerEmail = o.customer_email ?? user?.email ?? '';
      const customerPhone = o.customer_phone ?? user?.phone ?? o.shippingAddress?.phone ?? '';

      const billing = parseAddr(o.billing_address ?? o.billingAddress ?? null);
      const shipping = parseAddr(o.shipping_address ?? o.shippingAddress ?? null);

      const computedSubtotal = Array.isArray(items)
        ? items.reduce((sum, it) => sum + (safeNumber(it.price) * (safeNumber(it.quantity, 1) || 1)), 0)
        : 0;

      const discount = safeNumber(o.discount ?? 0, 0);
      const tax = safeNumber(
        o.taxAmount ?? o.tax_amount ?? o.tax ?? 0,
        0
      );
      const couponDiscountAmount = safeNumber(
        o.couponDiscount ?? o.coupon_discount ?? o.discount ?? 0,
        0
      );
      const resolvedTotal = safeNumber(total, computedSubtotal - discount + tax);

      return {
        ...o,
        user,
        items,
        couponCode: coupon,
        totalAmount: resolvedTotal,
        subtotalAmount: safeNumber(o.subtotal ?? computedSubtotal, computedSubtotal),
        taxAmount: tax,
        discountAmount: couponDiscountAmount,
        couponDiscountAmount,
        shippingCharge: safeNumber(o.shippingCharge ?? o.shipping_charge ?? 0),
        // Normalize partial COD fields from all possible DB column names
        advancePaid: safeNumber(o.advancePaid ?? o.advance_paid ?? 0),
        codAmount: safeNumber(o.codAmount ?? o.cod_amount ?? 0),
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        billingAddress: billing,
        shippingAddress: shipping,
      };
    });

    const byStatus = status ? normalized.filter(o => o.status === status) : normalized;
    return byStatus;
  }, [allOrders, status]);

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

  const updateItemStatus = async (orderId, itemId, newStatus) => {
    try {
      await dispatch(changeOrderItemStatus({ orderId, itemId, status: newStatus }));
    } catch (err) {
      console.error('Failed to update item status:', err);
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
            const billing = order.billingAddress;
            const shipping = order.shippingAddress;
            const isOpen = expanded === order.id;
            const shippingAddr = shipping || billing;
            const sameAddress = !shipping || JSON.stringify(shipping) === JSON.stringify(billing);
            return (
              <>
                <tr key={order.id}>
                  <td className="td-id">#{order.id}</td>
                  <td>
                    <div className="td-name">{order.customer_name || '—'}</div>
                    {order.customer_email && <div className="td-sub">{order.customer_email}</div>}
                    {order.customer_phone && <div className="td-sub">{order.customer_phone}</div>}
                  </td>
                  <td><span className="km-count-badge">{order.items?.length || 0} items</span></td>
                  <td className="td-price">₹{safeNumber(order.totalAmount).toFixed(2)}</td>
                  <td>
                    {order.couponCode
                      ? <span className="status-pill pill-approved">{order.couponCode}</span>
                      : <span className="td-muted">—</span>}
                  </td>
                  <td>
                    <div className="km-status-wrapper">
                      <select
                        className={`km-status-select km-status-${order.status}`}
                        value={order.status}
                        onChange={e => updateStatus(order.id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map(st => (
                          <option key={st} value={st}>{labelFor(st)}</option>
                        ))}
                      </select>
                      <span className="km-status-chevron">▾</span>
                    </div>
                  </td>
                  <td className="td-muted">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
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
                            <div className="km-form-header-sub">
                              Payment: {order.paymentMethod === 'partial_cod' ? '🔀 Partial COD' : (order.paymentMethod === 'cod' ? '💵 COD' : (order.paymentMethod || '—'))} ({order.paymentStatus || '—'})
                              {order.paymentMethod === 'partial_cod' && order.paymentStatus !== 'paid' && order.partialCodAmount && (
                                <span style={{ marginLeft: 8, background: '#fff3e0', color: '#e65100', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>
                                  ₹{parseFloat(order.partialCodAmount).toFixed(2)} due on delivery
                                </span>
                              )}
                              {order.paymentMethod === 'cod' && order.paymentStatus !== 'paid' && (
                                <span style={{ marginLeft: 8, background: '#fff3e0', color: '#e65100', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>
                                  ₹{parseFloat(order.totalAmount).toFixed(2)} due on delivery
                                </span>
                              )}
                              {order.paymentMethod !== 'partial_cod' && order.paymentMethod !== 'cod' && order.paymentStatus !== 'paid' && (
                                <span style={{ marginLeft: 8, background: '#fef2f2', color: '#dc2626', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>
                                  ₹{parseFloat(order.totalAmount).toFixed(2)} unpaid
                                </span>
                              )}
                            </div>
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
                                  <span className="td-price-sm">₹{(safeNumber(item.price) * safeNumber(item.quantity, 1)).toFixed(2)}</span>
                                </div>
                              ))
                              : <p className="td-muted">No items found</p>}
                          </div>
                          <div>
                            <div className="km-detail-section-title">Billing Address</div>
                            <AddressBlock addr={billing} fallbackPhone={order.customer_phone} email={order.customer_email} />
                          </div>
                          <div>
                            <div className="km-detail-section-title">
                              Shipping Address
                              {sameAddress && (
                                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: 20 }}>Same as billing</span>
                              )}
                            </div>
                            <AddressBlock addr={shippingAddr} fallbackPhone={!sameAddress ? order.customer_phone : null} email={null} />
                          </div>
                          <div>
                            <div className="km-detail-section-title">Payment Summary</div>

                            {/* ── Order breakdown ── */}
                            <div className="km-payment-row">
                              <span className="td-muted">Subtotal</span>
                              <span>₹{safeNumber(order.subtotalAmount).toFixed(2)}</span>
                            </div>

                            <div className="km-payment-row">
                              <span className="td-muted">Tax / GST</span>
                              <span>₹{safeNumber(order.taxAmount).toFixed(2)}</span>
                            </div>

                            <div className="km-payment-row">
                              <span className="td-muted">Shipping</span>
                              {safeNumber(order.shippingCharge) > 0
                                ? <span>₹{safeNumber(order.shippingCharge).toFixed(2)}</span>
                                : <span style={{ color: '#27ae60' }}>Free</span>}
                            </div>

                            {safeNumber(order.couponDiscountAmount) > 0 && (
                              <div className="km-payment-row">
                                <span className="td-muted">
                                  Discount {order.couponCode ? `(${order.couponCode})` : ''}
                                </span>
                                <span style={{ color: '#27ae60' }}>
                                  −₹{safeNumber(order.couponDiscountAmount).toFixed(2)}
                                </span>
                              </div>
                            )}

                            {/* ── Payment method block ── */}
                            {(() => {
                              const total           = safeNumber(order.totalAmount);
                              const shippingAmt     = safeNumber(order.shippingCharge);
                              const isPaid          = order.paymentStatus === 'paid';

                              // Detect partial COD via either paymentType (DB enum) or paymentMethod string
                              const isPartialCod    = order.paymentType === 'PARTIAL_COD' ||
                                                      order.paymentMethod === 'partial_cod';

                              // advancePaid: prefer explicit DB field, fall back to shippingCharge
                              const advancePaidAmt  = isPartialCod
                                ? safeNumber(order.advancePaid ?? shippingAmt)
                                : 0;

                              // codAmount: prefer explicit DB field, derive as remainder if missing
                              const codDueAmt       = isPartialCod
                                ? safeNumber(order.codAmount > 0 ? order.codAmount : (total - advancePaidAmt))
                                : total;

                              if (isPartialCod) {
                                if (isPaid) {
                                  return (
                                    <>
                                      <div className="km-payment-row" style={{ marginTop: 10, paddingTop: 10 }}>
                                        <span className="td-muted">Delivery paid online</span>
                                        <span style={{ color: '#2e7d32', fontWeight: 600 }}>₹{advancePaidAmt.toFixed(2)}</span>
                                      </div>
                                      <div className="km-payment-row">
                                        <span className="td-muted">Paid on delivery (COD)</span>
                                        <span style={{ color: '#2e7d32', fontWeight: 600 }}>₹{codDueAmt.toFixed(2)}</span>
                                      </div>
                                      <div className="km-payment-total" style={{ borderTop: '1px solid var(--neutral-200)', marginTop: 10, paddingTop: 12 }}>
                                        <span>Total Paid</span>
                                        <span className="td-price" style={{ color: '#2e7d32' }}>₹{total.toFixed(2)}</span>
                                      </div>
                                      <div className="km-payment-row" style={{ borderTop: 'none', paddingTop: 0 }}>
                                        <span className="td-muted" style={{ fontSize: 11 }}>Due Amount</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af' }}>₹0.00</span>
                                      </div>
                                    </>
                                  );
                                } else {
                                  return (
                                    <>
                                      <div className="km-payment-row" style={{ borderTop: '1px solid var(--neutral-200)', marginTop: 10, paddingTop: 10 }}>
                                        <span className="td-muted">Delivery paid online</span>
                                        <span style={{ color: '#2e7d32', fontWeight: 600 }}>₹{advancePaidAmt.toFixed(2)}</span>
                                      </div>
                                      <div className="km-payment-row" style={{ background: '#fff8e1', borderRadius: 6, padding: '6px 8px', marginTop: 4 }}>
                                        <span style={{ color: '#e65100', fontWeight: 600 }}>Due on delivery (COD)</span>
                                        <span style={{ color: '#e65100', fontWeight: 800, fontSize: 15 }}>₹{codDueAmt.toFixed(2)}</span>
                                      </div>
                                      <div className="km-payment-total" style={{ borderTop: '1px dashed #eee', marginTop: 8, paddingTop: 8 }}>
                                        <strong>Grand Total</strong>
                                        <strong>₹{total.toFixed(2)}</strong>
                                      </div>
                                    </>
                                  );
                                }
                              } else if (order.paymentMethod === 'cod') {
                                if (isPaid) {
                                  return (
                                    <>
                                      <div className="km-payment-row" style={{ borderTop: '1px solid var(--neutral-200)', marginTop: 10, paddingTop: 10 }}>
                                        <span className="td-muted">Paid Online</span>
                                        <span>₹0.00</span>
                                      </div>
                                      <div className="km-payment-row">
                                        <span className="td-muted">Paid on Delivery</span>
                                        <span style={{ fontWeight: 600, color: '#2e7d32' }}>₹{total.toFixed(2)}</span>
                                      </div>
                                      <div className="km-payment-total" style={{ borderTop: '1px solid var(--neutral-200)', marginTop: 10, paddingTop: 12 }}>
                                        <span>Total Paid</span>
                                        <span className="td-price" style={{ color: '#2e7d32' }}>₹{total.toFixed(2)}</span>
                                      </div>
                                      <div className="km-payment-row" style={{ borderTop: 'none', paddingTop: 0 }}>
                                        <span className="td-muted" style={{ fontSize: 11 }}>Due Amount</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af' }}>₹0.00</span>
                                      </div>
                                    </>
                                  );
                                } else {
                                  return (
                                    <>
                                      <div className="km-payment-row" style={{ borderTop: '1px solid var(--neutral-200)', marginTop: 10, paddingTop: 10 }}>
                                        <span className="td-muted">Paid Amount</span>
                                        <span>₹0.00</span>
                                      </div>
                                      <div className="km-payment-row" style={{ background: '#fff8e1', borderRadius: 6, padding: '6px 8px', marginTop: 4 }}>
                                        <span style={{ color: '#e65100', fontWeight: 600 }}>Due on Delivery</span>
                                        <span style={{ color: '#e65100', fontWeight: 800 }}>₹{total.toFixed(2)}</span>
                                      </div>
                                      <div className="km-payment-total" style={{ borderTop: '1px solid var(--neutral-200)', marginTop: 10, paddingTop: 12 }}>
                                        <span>Total Order</span>
                                        <span className="td-price">₹{total.toFixed(2)}</span>
                                      </div>
                                    </>
                                  );
                                }
                              } else {
                                // Full Online Payment
                                if (isPaid) {
                                  return (
                                    <>
                                      <div className="km-payment-total" style={{ borderTop: '1px solid var(--neutral-200)', marginTop: 10, paddingTop: 12 }}>
                                        <span>Paid Amount</span>
                                        <span className="td-price" style={{ color: '#2e7d32' }}>₹{total.toFixed(2)}</span>
                                      </div>
                                      <div className="km-payment-row" style={{ borderTop: 'none', paddingTop: 0 }}>
                                        <span className="td-muted" style={{ fontSize: 11 }}>Due Amount</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af' }}>₹0.00</span>
                                      </div>
                                    </>
                                  );
                                } else {
                                  return (
                                    <>
                                      <div className="km-payment-row" style={{ background: '#fef2f2', borderRadius: 6, padding: '6px 8px', marginTop: 4 }}>
                                        <span style={{ color: '#dc2626', fontWeight: 600 }}>Due Amount (Unpaid)</span>
                                        <span style={{ color: '#dc2626', fontWeight: 800 }}>₹{total.toFixed(2)}</span>
                                      </div>
                                      <div className="km-payment-total" style={{ borderTop: '1px solid var(--neutral-200)', marginTop: 10, paddingTop: 12 }}>
                                        <span>Total Order</span>
                                        <span className="td-price">₹{total.toFixed(2)}</span>
                                      </div>
                                    </>
                                  );
                                }
                              }
                            })()}

                            {order.notes && <div className="km-order-notes">{order.notes}</div>}
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