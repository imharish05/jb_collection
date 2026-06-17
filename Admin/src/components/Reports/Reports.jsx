import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../DataTable/DataTable';
import { fetchProducts } from '../../redux/services/productsService';
import { fetchOrders } from '../../redux/services/ordersService';
import { fetchCustomers } from '../../redux/services/customersService';
import styles from '../Dashboard/Dashboard.module.css';

const KM = { red: '#EF4444', orange: '#F59E0B', green: '#39B54A', muted: '#6B7280' };

const DATE_RANGES = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: 'month', label: 'This Month' },
];

function inRange(dateStr, rangeId) {
  if (rangeId === 'all' || !dateStr) return true;
  const d = new Date(dateStr);
  const now = new Date();
  if (rangeId === 'today') {
    return d.toDateString() === now.toDateString();
  }
  if (rangeId === '7d') {
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - 7);
    return d >= cutoff;
  }
  if (rangeId === '30d') {
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - 30);
    return d >= cutoff;
  }
  if (rangeId === 'month') {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }
  return true;
}

function totalStock(p) {
  return p.Variants?.reduce((a, v) => a + Number(v.stock || 0), 0) ?? 0;
}

function stockColor(qty) {
  if (qty === 0) return KM.red;
  if (qty < 11) return KM.red;
  if (qty < 51) return KM.orange;
  return KM.green;
}

function stockLabel(qty) {
  if (qty < 11) return 'Low / Out';
  if (qty < 51) return 'Medium';
  return 'In Stock';
}

const ORDER_STATUS_LABEL = {
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  processing: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

const STATUS_COLORS = {
  confirmed: { color: '#2563eb', bg: '#dbeafe' },
  shipped:   { color: '#d97706', bg: '#fef3c7' },
  processing:{ color: '#7c3aed', bg: '#ede9fe' },
  delivered: { color: '#16a34a', bg: '#dcfce7' },
  cancelled: { color: '#dc2626', bg: '#fee2e2' },
  returned:  { color: '#6b7280', bg: '#f3f4f6' },
};

function statusBadge(status) {
  const c = STATUS_COLORS[status] || { color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, color: c.color, background: c.bg,
      padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap',
    }}>
      {ORDER_STATUS_LABEL[status] || status}
    </span>
  );
}

export default function Reports() {
  const dispatch = useDispatch();
  const { items: products, loading: productsLoading } = useSelector(s => s.products || {});
  const { items: orders, loading: ordersLoading } = useSelector(s => s.orders || {});
  const { items: customers, loading: customersLoading } = useSelector(s => s.customers || {});

  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchOrders());
    dispatch(fetchCustomers());
  }, [dispatch]);

  const filteredOrders = useMemo(
    () => (Array.isArray(orders) ? orders : []).filter(o => inRange(o.createdAt, dateRange)),
    [orders, dateRange]
  );

  // ── Customer spend / order-count, derived from filtered orders ──
  const customerStatsByEmail = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      const email = o.customer_email || o.user?.email || '';
      if (!email) return;
      if (!map[email]) map[email] = { orders: 0, spend: 0, lastOrder: null };
      map[email].orders += 1;
      map[email].spend += Number(o.total ?? o.totalAmount ?? o.total_amount ?? 0);
      const created = o.createdAt ? new Date(o.createdAt) : null;
      if (created && (!map[email].lastOrder || created > map[email].lastOrder)) {
        map[email].lastOrder = created;
      }
    });
    return map;
  }, [filteredOrders]);

  const customerRows = useMemo(() => {
    return (Array.isArray(customers) ? customers : []).map(c => {
      const stat = customerStatsByEmail[c.email] || { orders: 0, spend: 0, lastOrder: null };
      return { ...c, ordersCount: stat.orders, spend: stat.spend, lastOrder: stat.lastOrder };
    });
  }, [customers, customerStatsByEmail]);

  const totalProducts = Array.isArray(products) ? products.length : 0;
  const totalOrders = filteredOrders.length;
  const activeCustomers = Object.keys(customerStatsByEmail).length;

  return (
    <div className={styles.dash}>
      <div className={styles.greeting}>
        <div>
          <h1 className={styles.greetTitle}>Reports</h1>
          <p className={styles.greetSub}>Quick look at products, orders, and customers.</p>
        </div>
        <select
          className="search-input"
          style={{ minWidth: 160 }}
          value={dateRange}
          onChange={e => setDateRange(e.target.value)}
        >
          {DATE_RANGES.map(r => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard} style={{ '--bg': 'linear-gradient(135deg,#487fff 0%,#486cea 100%)' }}>
          <div className={styles.scTop}>
            <div className={styles.scMeta}>
              <div>
                <p className={styles.scLabel}>Products</p>
                <p className={styles.scVal}>{productsLoading ? '—' : totalProducts}</p>
              </div>
            </div>
          </div>
          <div className={styles.scCircle1} />
          <div className={styles.scCircle2} />
        </div>
        <div className={styles.statCard} style={{ '--bg': 'linear-gradient(135deg,#ea8b0c 0%,#d97b08 100%)' }}>
          <div className={styles.scTop}>
            <div className={styles.scMeta}>
              <div>
                <p className={styles.scLabel}>Orders</p>
                <p className={styles.scVal}>{ordersLoading ? '—' : totalOrders}</p>
              </div>
            </div>
          </div>
          <div className={styles.scCircle1} />
          <div className={styles.scCircle2} />
        </div>
        <div className={styles.statCard} style={{ '--bg': 'linear-gradient(135deg,#45b369 0%,#2a8a22 100%)' }}>
          <div className={styles.scTop}>
            <div className={styles.scMeta}>
              <div>
                <p className={styles.scLabel}>Customers</p>
                <p className={styles.scVal}>{customersLoading ? '—' : activeCustomers}</p>
              </div>
            </div>
          </div>
          <div className={styles.scCircle1} />
          <div className={styles.scCircle2} />
        </div>
      </div>

      <div className="section-header">
        <div className="section-title">Products</div>
      </div>
      <DataTable
        columns={['Product', 'Category', 'Stock', 'Status']}
        initialRows={Array.isArray(products) ? products : []}
        loading={productsLoading}
        renderRow={(p) => {
          const stock = totalStock(p);
          return (
            <tr key={p.id}>
              <td style={{ fontWeight: 600 }}>{p.name}</td>
              <td>{p.Category?.name || p.Category?.label || '—'}</td>
              <td style={{ fontWeight: 700, color: stockColor(stock) }}>{stock}</td>
              <td>
                <span style={{ fontSize: 11, fontWeight: 700, color: stockColor(stock) }}>
                  {stockLabel(stock)}
                </span>
              </td>
            </tr>
          );
        }}
      />

      <div className="section-header" style={{ marginTop: 28 }}>
        <div className="section-title">Orders</div>
      </div>
      <DataTable
        columns={['Order ID', 'Customer', 'Status', 'Total']}
        initialRows={filteredOrders}
        loading={ordersLoading}
        renderRow={(o) => (
          <tr key={o.id}>
            <td className="td-id">#{o.referenceSlug || o.id}</td>
            <td>{o.customer_name || o.user?.name || '—'}</td>
            <td>{statusBadge(o.status)}</td>
            <td className="td-price">
              ₹{Number(o.total ?? o.totalAmount ?? o.total_amount ?? 0).toFixed(2)}
            </td>
          </tr>
        )}
      />

      <div className="section-header" style={{ marginTop: 28 }}>
        <div className="section-title">Customers</div>
      </div>
      <DataTable
        columns={['Customer', 'Email', 'Orders', 'Spend', 'Last Order']}
        initialRows={customerRows}
        loading={customersLoading}
        renderRow={(c) => (
          <tr key={c.id}>
            <td style={{ fontWeight: 600 }}>{c.name}</td>
            <td className="td-muted">{c.email}</td>
            <td><span className="km-count-badge">{c.ordersCount}</span></td>
            <td className="td-price">₹{c.spend.toFixed(2)}</td>
            <td className="td-muted">
              {c.lastOrder
                ? c.lastOrder.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—'}
            </td>
          </tr>
        )}
      />
    </div>
  );
}