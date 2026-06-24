import { useMemo, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import DataTable from '../DataTable/DataTable';
import { fetchOrders, changeOrderStatus, changeOrderItemStatus } from '../../redux/services/ordersService';
import { renderVariantLabel } from '../Products/VariantBuilder';
import { hasPermission } from '../../utils/authHelper';
import AccessDenied from '../AccessDenied';

// ✅ Removed 'returned' from STATUS_OPTIONS, added 'pending'
const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'processing', 'delivered', 'cancelled'];
const labelFor = s => ({
  pending: 'Pending',
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

const REFUND_STATUS_LABEL = {
  pending:          { label: 'Refund Pending',   bg: '#fff8e1', color: '#e65100' },
  initiated:        { label: 'Refund Initiated', bg: '#e3f2fd', color: '#1565c0' },
  completed:        { label: 'Refunded ✓',       bg: '#e8f5e9', color: '#2e7d32' },
  failed:           { label: 'Refund Failed',    bg: '#ffebee', color: '#c62828' },
  manual_pending:   { label: 'Manual Refund Pending',   bg: '#fff8e1', color: '#e65100' },
  manual_completed: { label: 'Manual Refund Done ✓',    bg: '#e8f5e9', color: '#2e7d32' },
};

// Helper: get the most relevant refund from order.refunds[]
const getOrderRefund = (order) => {
  const refunds = Array.isArray(order.refunds) ? order.refunds : [];
  // Prefer order-level refunds (returnId == null means it's a cancellation refund)
  const cancelRefund = refunds.find(r => !r.returnId);
  return cancelRefund || refunds[0] || null;
};

const renderPaymentStatus = (order) => {
  if (order.status === 'cancelled') {
    const refund = getOrderRefund(order);
    const wasPaidOnline = order.paymentMethod !== 'cod' && order.paymentMethod !== 'FULL_COD';
    const hadAdvance = safeNumber(order.advancePaid) > 0;

    if (refund && (wasPaidOnline || hadAdvance)) {
      const cfg = REFUND_STATUS_LABEL[refund.refundStatus] || { label: refund.refundStatus, bg: '#f3f4f6', color: '#4b5563' };
      return <span className="status-pill" style={{ background: cfg.bg, color: cfg.color, padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}>{cfg.label}</span>;
    }
    // COD cancelled — nothing to refund
    return <span className="status-pill" style={{ background: '#ffebee', color: '#c62828', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}>Cancelled</span>;
  }

  const status = order.paymentStatus;
  if (status === 'paid') {
    return <span className="status-pill" style={{ background: '#e8f5e9', color: '#2e7d32', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}>Paid</span>;
  }
  if (status === 'failed') {
    return <span className="status-pill" style={{ background: '#ffebee', color: '#dc2626', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}>Failed</span>;
  }
  if (status === 'refunded') {
    return <span className="status-pill" style={{ background: '#f3f4f6', color: '#4b5563', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}>Refunded</span>;
  }
  return <span className="status-pill" style={{ background: '#fff3e0', color: '#e65100', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}>Pending</span>;
};


export default function Orders({ status = null }) {
  const dispatch = useDispatch();
  const { items: allOrders, loading } = useSelector(state => state.orders);
  const [expanded, setExpanded] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const rows = useMemo(() => {
    const normalized = (Array.isArray(allOrders) ? allOrders : []).map((o) => {
      const user = o.user || o.User || null;
      const items = o.items || o.orderItems || [];
      const coupon = o.coupon_code ?? o.couponCode ?? null;
      const total = o.total ?? o.totalAmount ?? o.total_amount ?? null;
      const customerName = o.customer_name ?? user?.name ?? user?.fullName ?? '';
      const customerEmail = o.customer_email ?? user?.email ?? '';
      const customerPhone = o.customer_phone ?? user?.phone ?? o.shippingAddress?.phone ?? '';
      const customerType = user?.roleRecord?.name || (user?.role === 'admin' ? 'Admin' : (user ? 'Registered Customer' : 'Guest'));

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
        customerName,
        customerEmail,
        customerPhone,
        customerType,
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

  // Extract unique custom fonts from orders to load dynamically
  const uniqueFonts = useMemo(() => {
    const fonts = new Set();
    rows.forEach(order => {
      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          let custom = item.customisationDetails;
          if (typeof custom === 'string') {
            try {
              custom = JSON.parse(custom);
              if (typeof custom === 'string') {
                custom = JSON.parse(custom);
              }
            } catch {
              custom = null;
            }
          }
          if (custom && typeof custom === 'object') {
            Object.entries(custom).forEach(([key, val]) => {
              if (val && typeof val === 'string' && key.toLowerCase().includes('font')) {
                const fontName = val.trim();
                if (fontName) {
                  fonts.add(fontName);
                }
              }
            });
          }
        });
      }
    });
    return Array.from(fonts);
  }, [rows]);

  // Dynamically load Google Font stylesheets
  useEffect(() => {
    if (uniqueFonts.length > 0) {
      uniqueFonts.forEach(fontName => {
        const fontId = `google-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
        if (!document.getElementById(fontId)) {
          const link = document.createElement('link');
          link.id = fontId;
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700&display=swap`;
          document.head.appendChild(link);
        }
      });
    }
  }, [uniqueFonts]);

  useEffect(() => {
    setExpanded(null);
    dispatch(fetchOrders());
  }, [dispatch, status]);

  if (!hasPermission('orders_view')) {
    return <AccessDenied moduleName="Orders" />;
  }

  const updateStatus = async (orderId, newStatus) => {
    const currentOrder = rows.find(order => order.id === orderId);
    if (!currentOrder || currentOrder.status === newStatus || updatingOrderId === orderId) return;

    setUpdatingOrderId(orderId);
    try {
      await dispatch(changeOrderStatus({ id: orderId, status: newStatus }));
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setUpdatingOrderId(current => current === orderId ? null : current);
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
        {/* {!loading && <span className="km-count-badge">{rows.length}</span>} */}
      </div>

      {loading ? (
        <p className="km-loading">Loading orders...</p>
      ) : rows.length === 0 ? (
        <p className="km-empty">No orders found.</p>
      ) : (
        <DataTable
          columns={['#ID', 'Customer', 'Items', 'Total', 'Payment Status', 'Coupon', 'Status', 'Date', 'Details']}
          initialRows={rows}
          renderRow={(order) => {
            const billing = order.billingAddress;
            const shipping = order.shippingAddress;
            const isOpen = expanded === order.id;
            const shippingAddr = shipping || billing;
            const sameAddress = !shipping || JSON.stringify(shipping) === JSON.stringify(billing);
            const isUpdatingStatus = updatingOrderId === order.id;
            return (
              <>
                <tr key={order.id}>
                  <td className="td-id">{order.referenceSlug || order.id}</td>
                  <td>
                    <div className="td-name" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span>{order.customer_name || '—'}</span>
                      {order.customerType && order.customerType.toLowerCase() !== 'registered customer' && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 700,
                          backgroundColor: order.customerType.toLowerCase() === 'guest' ? '#f3f4f6' : '#e0f2fe',
                          color: order.customerType.toLowerCase() === 'guest' ? '#4b5563' : '#0369a1',
                          padding: '1px 5px',
                          borderRadius: 4,
                          display: 'inline-block'
                        }}>
                          {order.customerType}
                        </span>
                      )}
                    </div>
                    {order.customer_email && <div className="td-sub">{order.customer_email}</div>}
                    {order.customer_phone && <div className="td-sub">{order.customer_phone}</div>}
                  </td>
                  <td><span className="km-count-badge">{order.items?.length || 0} items</span></td>
                  <td className="td-price">₹{safeNumber(order.totalAmount).toFixed(2)}</td>
                  <td>
                    {renderPaymentStatus(order)}
                  </td>
                  <td>
                    {order.couponCode
                      ? <span className="status-pill pill-approved">{order.couponCode}</span>
                      : <span className="td-muted">—</span>}
                  </td>
                  <td>
                    {hasPermission('orders_edit') ? (
                      <div className={`km-status-wrapper ${isUpdatingStatus ? 'is-updating' : ''}`}>
                        <select
                          className={`km-status-select km-status-${order.status}`}
                          value={order.status}
                          onChange={e => updateStatus(order.id, e.target.value)}
                          disabled={isUpdatingStatus}
                          aria-busy={isUpdatingStatus}
                        >
                          {STATUS_OPTIONS.map(st => (
                            <option key={st} value={st}>{labelFor(st)}</option>
                          ))}
                        </select>
                        <span className="km-status-chevron">▾</span>
                        {isUpdatingStatus && (
                          <span className="km-status-spinner">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="2" opacity="0.2" />
                              <path d="M 8 1.5 A 6.5 6.5 0 0 1 13.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className={`km-status-select km-status-${order.status}`} style={{ display: 'inline-block', padding: '6px 12px', borderRadius: '6px', fontWeight: 600, fontSize: '12px', textAlign: 'center', minWidth: '100px' }}>
                        {labelFor(order.status)}
                      </span>
                    )}
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
                    <td colSpan={9} className="km-order-detail-cell">
                      <div className="km-form-card">
                        <div className="km-form-header">
                          <div className="km-form-header-icon">📦</div>
                          <div>
                            <div className="km-form-header-title" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span>Order {order.referenceSlug || order.id} — {order.customer_name}</span>
                              {order.customerType && order.customerType.toLowerCase() !== 'registered customer' && (
                                <span style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  backgroundColor: order.customerType.toLowerCase() === 'guest' ? 'rgba(255,255,255,0.15)' : '#38bdf8',
                                  color: order.customerType.toLowerCase() === 'guest' ? '#fff' : '#0f172a',
                                  padding: '2px 8px',
                                  borderRadius: 20,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em'
                                }}>
                                  {order.customerType}
                                </span>
                              )}
                            </div>
                            <div className="km-form-header-sub">
                              Payment: {
                                (() => {
                                  const ADMIN_PAYMENT_LABELS = {
                                    partial_cod: '🔀 Partial COD',
                                    cod:         '💵 Cash on Delivery',
                                    upi:         '📱 UPI',
                                    card:        '💳 Credit / Debit Card',
                                    netbanking:  '🏦 Net Banking',
                                    wallet:      '👛 Wallet',
                                    razorpay:    '💳 Online (Razorpay)',
                                  };
                                  return ADMIN_PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || '—';
                                })()
                              } ({order.paymentStatus || '—'})

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
                                <div key={i} className="km-order-item-row" style={{ display: 'block', paddingBottom: '10px', borderBottom: '1px solid #f0f0f0', marginBottom: '10px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>
                                      <strong>{item.productName}</strong>
                                      {item.selectedVariantName && (
                                        <span style={{ marginLeft: 5, fontSize: 10, fontWeight: 700, background: '#e8f0ff', color: '#1A52A8', padding: '1px 6px', borderRadius: 10, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
                                          {renderVariantLabel(item.selectedVariantName, 10, 3)}
                                        </span>
                                      )}
                                      <span className="td-muted"> × {item.quantity}</span>
                                    </span>
                                    <span className="td-price-sm">₹{(safeNumber(item.price) * safeNumber(item.quantity, 1)).toFixed(2)}</span>
                                  </div>
                                  
                                  {/* Combo products */}
                                  {(() => {
                                    let selectedProducts = item.selectedProducts;
                                    if (typeof selectedProducts === 'string') {
                                      try { selectedProducts = JSON.parse(selectedProducts); } catch { selectedProducts = null; }
                                    }
                                    if (Array.isArray(selectedProducts) && selectedProducts.length > 0) {
                                      return (
                                        <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: '2px solid #db1a5d', background: '#fafafa', borderRadius: 4, padding: '6px 10px' }}>
                                          <div style={{ fontSize: 10, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                                            Combo Included Products:
                                          </div>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                            {selectedProducts.map((p, idx) => (
                                              <div key={idx} style={{ fontSize: 11, color: '#333', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: 600 }}>• {p.name}</span>
                                                {p.variantName && (
                                                  <span style={{ fontSize: 9, background: '#fff0f6', color: '#db1a5d', border: '1px solid #ffd6e7', borderRadius: 3, padding: '1px 5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                                    {renderVariantLabel(p.variantName, 9, 3)}
                                                  </span>
                                                )}
                                                <span style={{ color: '#888', fontSize: 10 }}>× {p.quantity}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}

                                  {/* Customisation Details */}
                                  {(() => {
                                    let custom = item.customisationDetails;
                                    if (typeof custom === 'string') {
                                      try {
                                        custom = JSON.parse(custom);
                                        if (typeof custom === 'string') {
                                          custom = JSON.parse(custom);
                                        }
                                      } catch {
                                        custom = null;
                                      }
                                    }
                                    if (custom && typeof custom === 'object' && Object.values(custom).some(Boolean)) {
                                      return (
                                        <div style={{ marginTop: 8, border: '1.5px solid #fbbf24', borderRadius: 8, overflow: 'hidden' }}>
                                          {/* Header */}
                                          <div style={{ background: '#fbbf24', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 13 }}>🎨</span>
                                            <span style={{ fontSize: 10, fontWeight: 800, color: '#451a03', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Customer Customisation</span>
                                          </div>
                                          {/* Body */}
                                          <div style={{ background: '#fffbeb', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {Object.entries(custom).map(([key, val]) => {
                                              if (!val) return null;
                                              const label = key
                                                .split('_')
                                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                                .join(' ');

                                              const isColorValue = typeof val === 'string' && (val.startsWith('#') || ['red', 'blue', 'green', 'yellow', 'gold', 'silver', 'black', 'white', 'rose gold', 'bronze', 'orange', 'pink', 'purple', 'grey', 'brown'].includes(val.toLowerCase()));
                                              const isFont = key.toLowerCase().includes('font');
                                              const isLongText = typeof val === 'string' && val.length > 30;

                                              if (isFont) {
                                                const textFieldVal = (() => {
                                                   const priorityKeys = ['name', 'text', 'custom_text', 'customisation_text', 'engraving_text'];
                                                   for (const pk of priorityKeys) {
                                                     if (custom[pk]) return custom[pk];
                                                   }
                                                   for (const [k, v] of Object.entries(custom)) {
                                                     const kLower = k.toLowerCase();
                                                     if (kLower.includes('font') || kLower.includes('color')) continue;
                                                     if (typeof v !== 'string') continue;
                                                     const isColor = v.startsWith('#') || ['red', 'blue', 'green', 'yellow', 'gold', 'silver', 'black', 'white', 'rose gold', 'bronze', 'orange', 'pink', 'purple', 'grey', 'brown'].includes(v.toLowerCase());
                                                     if (isColor) continue;
                                                     return v;
                                                   }
                                                   return '';
                                                })();
                                                const previewText = textFieldVal || 'Font Preview';

                                                return (
                                                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                      <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e', minWidth: 60 }}>{label}:</span>
                                                      <span style={{ fontSize: 11, fontWeight: 600, color: '#333' }}>
                                                        {val}
                                                      </span>
                                                    </div>
                                                    <div style={{
                                                      marginLeft: 66,
                                                      padding: '4px 10px',
                                                      background: '#fff',
                                                      borderRadius: 6,
                                                      border: '1.5px dashed #fde68a',
                                                      fontFamily: val,
                                                      fontSize: 15,
                                                      color: '#111',
                                                      display: 'inline-block',
                                                      alignSelf: 'flex-start',
                                                    }}>
                                                      {previewText}
                                                    </div>
                                                  </div>
                                                );
                                              }

                                              if (isColorValue) {
                                                return (
                                                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e', minWidth: 60 }}>{label}:</span>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                      <span style={{ width: 14, height: 14, borderRadius: '50%', background: val, border: '1.5px solid #ccc', display: 'inline-block', flexShrink: 0 }} />
                                                      <span style={{ fontSize: 11, fontWeight: 600, color: '#333' }}>{val}</span>
                                                    </span>
                                                  </div>
                                                );
                                              }

                                              return (
                                                <div key={key} style={{ display: 'flex', alignItems: isLongText ? 'flex-start' : 'baseline', gap: 6 }}>
                                                  <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e', minWidth: 60 }}>{label}:</span>
                                                  <span style={{
                                                    fontSize: isLongText ? 11 : 14,
                                                    fontWeight: isLongText ? 500 : 700,
                                                    color: '#1a1a1a',
                                                    whiteSpace: 'pre-wrap',
                                                    background: '#fff',
                                                    border: '1px solid #fde68a',
                                                    borderRadius: 4,
                                                    padding: '2px 8px',
                                                    letterSpacing: '0.02em',
                                                    flex: isLongText ? 1 : undefined,
                                                  }}>{val}</span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
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
                            
                            {order.awbCode && (
                              <div style={{ marginTop: 10, padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>🚚 Shipment Tracking</span>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 6 }}>
                                  <span className="td-muted">AWB Code</span>
                                  <strong style={{ fontFamily: 'monospace', color: '#166534' }}>{order.awbCode}</strong>
                                </div>
                                {order.courier && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                                    <span className="td-muted">Courier Partner</span>
                                    <strong style={{ color: '#374151' }}>{order.courier}</strong>
                                  </div>
                                )}
                                <a
                                  href={`https://shiprocket.co/tracking/${order.awbCode}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ display: 'block', textAlign: 'center', background: '#166534', color: '#fff', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 6, marginTop: 8, textDecoration: 'none', transition: 'background 0.2s' }}
                                  onMouseEnter={(e) => e.target.style.background = '#14532d'}
                                  onMouseLeave={(e) => e.target.style.background = '#166534'}
                                >
                                  Track Package
                                </a>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="km-detail-section-title">Payment Summary</div>

                            {/* ── Order breakdown ── */}
                            <div className="km-payment-row">
                              <span className="td-muted">Subtotal (before GST)</span>
                              <span>
                                ₹{safeNumber(
                                  order.taxAmount > 0
                                    ? order.subtotalAmount - order.taxAmount
                                    : order.subtotalAmount
                                ).toFixed(2)}
                              </span>
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
                                      {order.codCollected && (
                                        <div style={{
                                          marginTop: 8,
                                          padding: '4px 8px',
                                          background: '#e8f5e9',
                                          color: '#2e7d32',
                                          borderRadius: 4,
                                          fontWeight: 700,
                                          fontSize: 11,
                                          textAlign: 'center'
                                        }}>
                                          ✓ COD Cash Collected
                                        </div>
                                      )}
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
                                      {order.status !== 'cancelled' && order.status !== 'returned' && (
                                        <button
                                          onClick={async () => {
                                            const result = await Swal.fire({
                                              title: 'Mark COD as Collected?',
                                              html: `<p style="margin:0;font-size:14px;color:#555">Confirm that <strong>₹${codDueAmt?.toFixed(2) ?? order.codAmount?.toFixed(2)}</strong> cash has been collected at the door.</p>`,
                                              icon: 'question',
                                              showCancelButton: true,
                                              confirmButtonColor: '#db1a5d',
                                              cancelButtonColor: '#6b7280',
                                              confirmButtonText: '💵 Yes, Mark Collected',
                                              cancelButtonText: 'Cancel',
                                              borderRadius: '16px',
                                            });
                                            if (!result.isConfirmed) return;
                                            const tid = toast.loading('Marking COD as collected…');
                                            try {
                                              await dispatch(changeOrderStatus({ id: order.id, paymentStatus: 'paid', codCollected: true }));
                                              toast.success('COD cash marked as collected!', { id: tid });
                                            } catch (err) {
                                              toast.error(err?.response?.data?.message || 'Failed to update payment status', { id: tid });
                                            }
                                          }}
                                          style={{
                                            marginTop: 10,
                                            width: '100%',
                                            padding: '8px 12px',
                                            background: '#db1a5d',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 6,
                                            fontWeight: 700,
                                            fontSize: 12,
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                          }}
                                          onMouseEnter={(e) => e.target.style.background = '#b8124b'}
                                          onMouseLeave={(e) => e.target.style.background = '#db1a5d'}
                                        >
                                          💵 Mark COD as Collected
                                        </button>
                                      )}
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
                                      {order.codCollected && (
                                        <div style={{
                                          marginTop: 8,
                                          padding: '4px 8px',
                                          background: '#e8f5e9',
                                          color: '#2e7d32',
                                          borderRadius: 4,
                                          fontWeight: 700,
                                          fontSize: 11,
                                          textAlign: 'center'
                                        }}>
                                          ✓ COD Cash Collected
                                        </div>
                                      )}
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
                                      {order.status !== 'cancelled' && order.status !== 'returned' && (
                                        <button
                                          onClick={async () => {
                                            const result = await Swal.fire({
                                              title: 'Mark COD as Collected?',
                                              html: `<p style="margin:0;font-size:14px;color:#555">Confirm that <strong>₹${codDueAmt?.toFixed(2) ?? order.codAmount?.toFixed(2)}</strong> cash has been collected at the door.</p>`,
                                              icon: 'question',
                                              showCancelButton: true,
                                              confirmButtonColor: '#db1a5d',
                                              cancelButtonColor: '#6b7280',
                                              confirmButtonText: '💵 Yes, Mark Collected',
                                              cancelButtonText: 'Cancel',
                                              borderRadius: '16px',
                                            });
                                            if (!result.isConfirmed) return;
                                            const tid = toast.loading('Marking COD as collected…');
                                            try {
                                              await dispatch(changeOrderStatus({ id: order.id, paymentStatus: 'paid', codCollected: true }));
                                              toast.success('COD cash marked as collected!', { id: tid });
                                            } catch (err) {
                                              toast.error(err?.response?.data?.message || 'Failed to update payment status', { id: tid });
                                            }
                                          }}
                                          style={{
                                            marginTop: 10,
                                            width: '100%',
                                            padding: '8px 12px',
                                            background: '#db1a5d',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 6,
                                            fontWeight: 700,
                                            fontSize: 12,
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                          }}
                                          onMouseEnter={(e) => e.target.style.background = '#b8124b'}
                                          onMouseLeave={(e) => e.target.style.background = '#db1a5d'}
                                        >
                                          💵 Mark COD as Collected
                                        </button>
                                      )}
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

                            {/* ── Refund Info (for cancelled online-paid orders) ── */}
                            {order.status === 'cancelled' && (() => {
                              const refund = getOrderRefund(order);
                              const wasPaidOnline = order.paymentMethod !== 'cod' && order.paymentMethod !== 'FULL_COD';
                              const hadAdvance = safeNumber(order.advancePaid) > 0;
                              if (!refund || (!wasPaidOnline && !hadAdvance)) return null;
                              const cfg = REFUND_STATUS_LABEL[refund.refundStatus] || { label: refund.refundStatus, bg: '#f3f4f6', color: '#4b5563' };
                              return (
                                <div style={{ marginTop: 14, borderTop: '1px solid #fde8e8', paddingTop: 12 }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: '#c62828', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Refund Details</div>

                                  <div className="km-payment-row">
                                    <span className="td-muted">Refund Status</span>
                                    <span style={{ background: cfg.bg, color: cfg.color, padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 11 }}>{cfg.label}</span>
                                  </div>

                                  <div className="km-payment-row">
                                    <span className="td-muted">Refund Amount</span>
                                    <span style={{ fontWeight: 700, color: refund.refundStatus === 'completed' || refund.refundStatus === 'manual_completed' ? '#2e7d32' : '#374151' }}>
                                      ₹{safeNumber(refund.refundAmount).toFixed(2)}
                                    </span>
                                  </div>

                                  {refund.razorpayRefundId && (
                                    <div className="km-payment-row">
                                      <span className="td-muted">Razorpay Refund ID</span>
                                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#1565c0', background: '#e3f2fd', padding: '2px 6px', borderRadius: 4 }}>
                                        {refund.razorpayRefundId}
                                      </span>
                                    </div>
                                  )}

                                  {!refund.razorpayRefundId && refund.refundMode === 'razorpay' && (
                                    <div className="km-payment-row">
                                      <span className="td-muted">Razorpay Refund ID</span>
                                      <span style={{ color: '#9ca3af', fontSize: 11, fontStyle: 'italic' }}>Not yet assigned</span>
                                    </div>
                                  )}

                                  {refund.refundMode === 'manual_offline' && refund.manualRefundNotes && (
                                    <div className="km-payment-row" style={{ alignItems: 'flex-start' }}>
                                      <span className="td-muted">Refund Notes</span>
                                      <span style={{ fontSize: 11, color: '#374151', textAlign: 'right', maxWidth: '55%' }}>{refund.manualRefundNotes}</span>
                                    </div>
                                  )}

                                  {refund.refundedAt && (
                                    <div className="km-payment-row">
                                      <span className="td-muted">Refunded On</span>
                                      <span style={{ fontSize: 11 }}>{new Date(refund.refundedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                    </div>
                                  )}

                                  {order.razorpayPaymentId && (
                                    <div className="km-payment-row">
                                      <span className="td-muted">Original Payment ID</span>
                                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{order.razorpayPaymentId}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
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