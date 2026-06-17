import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../DataTable/DataTable';
import { fetchProducts } from '../../redux/services/productsService';
import { fetchOrders } from '../../redux/services/ordersService';
import { fetchCustomers } from '../../redux/services/customersService';
import { fetchCategories } from '../../redux/services/categoriesService';
import styles from '../Dashboard/Dashboard.module.css';

const DATE_RANGES = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'Year' },
  { id: 'custom', label: 'Custom Range' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

const REPORT_TYPES = [
  { id: 'sales', label: 'Sales (Best Sellers)' },
  { id: 'orders', label: 'Orders' },
  { id: 'customers', label: 'Customers' },
];

const ORDER_STATUS_LABEL = {
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  processing: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

const STATUS_COLORS = {
  confirmed:  { color: '#2563eb', bg: '#dbeafe' },
  shipped:    { color: '#d97706', bg: '#fef3c7' },
  processing: { color: '#7c3aed', bg: '#ede9fe' },
  delivered:  { color: '#16a34a', bg: '#dcfce7' },
  cancelled:  { color: '#dc2626', bg: '#fee2e2' },
  returned:   { color: '#6b7280', bg: '#f3f4f6' },
};

function inRange(dateStr, rangeId, extra = {}) {
  if (rangeId === 'all' || !dateStr) return true;
  const d = new Date(dateStr);
  const now = new Date();
  if (rangeId === 'today') return d.toDateString() === now.toDateString();
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
  if (rangeId === 'year') {
    return d.getFullYear() === Number(extra.year);
  }
  if (rangeId === 'custom') {
    if (!extra.fromDate && !extra.toDate) return true;
    if (extra.fromDate && d < new Date(extra.fromDate)) return false;
    if (extra.toDate) {
      const end = new Date(extra.toDate);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  }
  return true;
}

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
  const { items: categories } = useSelector(s => s.categories || {});

  const [mounted, setMounted] = useState(false);
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('all');
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchOrders());
    dispatch(fetchCustomers());
    dispatch(fetchCategories());
  }, [dispatch]);

  // ── Orders filtered by date range (and status, when on the Orders report) ──
  const filteredOrders = useMemo(() => {
    let list = (Array.isArray(orders) ? orders : []).filter(o =>
      inRange(o.createdAt, dateRange, { year: selectedYear, fromDate, toDate })
    );
    if (reportType === 'orders' && statusFilter !== 'all') {
      list = list.filter(o => o.status === statusFilter);
    }
    return list;
  }, [orders, dateRange, selectedYear, fromDate, toDate, reportType, statusFilter]);

  // ── Sales: aggregate order items into per-product units/revenue ──
  const salesRows = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      (o.items || o.orderItems || []).forEach(item => {
        const key = item.productId ?? item.productName;
        if (!map[key]) {
          map[key] = { id: key, name: item.productName || 'Unknown product', units: 0, revenue: 0 };
        }
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        map[key].units += qty;
        map[key].revenue += qty * price;
      });
    });
    return Object.values(map).sort((a, b) => b.units - a.units);
  }, [filteredOrders]);

  // ── Customers: orders count / spend, derived from filtered orders ──
  const customerRows = useMemo(() => {
    const stats = {};
    filteredOrders.forEach(o => {
      const email = o.User?.email || o.user?.email || '';
      if (!email) return;
      if (!stats[email]) stats[email] = { orders: 0, spend: 0, lastOrder: null };
      stats[email].orders += 1;
      stats[email].spend += Number(o.totalAmount) || 0;
      const created = o.createdAt ? new Date(o.createdAt) : null;
      if (created && (!stats[email].lastOrder || created > stats[email].lastOrder)) {
        stats[email].lastOrder = created;
      }
    });
    return (Array.isArray(customers) ? customers : []).map(c => {
      const s = stats[c.email] || { orders: 0, spend: 0, lastOrder: null };
      return { ...c, ordersCount: s.orders, spend: s.spend, lastOrder: s.lastOrder };
    });
  }, [customers, filteredOrders]);

  // ── Products: filtered by category, for the report dropdown count card ──
  const filteredProducts = useMemo(() => {
    let list = Array.isArray(products) ? products : [];
    if (categoryFilter !== 'all') {
      list = list.filter(p => String(p.categoryId) === String(categoryFilter));
    }
    return list;
  }, [products, categoryFilter]);

  const totalProducts = filteredProducts.length;
  const totalOrders = filteredOrders.length;
  const totalCustomers = (Array.isArray(customers) ? customers : []).length;
  const isLoading = productsLoading || ordersLoading || customersLoading;

  return (
    <div className={`${styles.dash} ${mounted ? styles.dashIn : ''}`}>
      <div className={styles.greeting}>
        <div>
          <h1 className={styles.greetTitle}>Reports</h1>
          <p className={styles.greetSub}>Pick a report, narrow it down, and view the data.</p>
        </div>
      </div>

      {/* <div className={styles.statsRow}>
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
                <p className={styles.scVal}>{customersLoading ? '—' : totalCustomers}</p>
              </div>
            </div>
          </div>
          <div className={styles.scCircle1} />
          <div className={styles.scCircle2} />
        </div>
      </div> */}

      {/* ── Filters ── */}
      <div className={styles.tableCard} style={{ padding: 20, marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Report</label>
          <select className="search-input" style={{ minWidth: 200 }} value={reportType} onChange={e => setReportType(e.target.value)}>
            {REPORT_TYPES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date Range</label>
          <select className="search-input" style={{ minWidth: 160 }} value={dateRange} onChange={e => setDateRange(e.target.value)}>
            {DATE_RANGES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>

        {dateRange === 'year' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Year</label>
            <select className="search-input" style={{ minWidth: 120 }} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
              {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}

        {dateRange === 'custom' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>From</label>
              <input type="date" className="search-input" style={{ minWidth: 150 }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To</label>
              <input type="date" className="search-input" style={{ minWidth: 150 }} value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
          </>
        )}

        {reportType === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Status</label>
            <select className="search-input" style={{ minWidth: 170 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              {Object.entries(ORDER_STATUS_LABEL).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>
        )}

        {(reportType === 'sales') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
            <select className="search-input" style={{ minWidth: 170 }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {(Array.isArray(categories) ? categories : []).map(c => (
                <option key={c.id} value={c.id}>{c.name || c.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Single table, driven by reportType ── */}
      {reportType === 'sales' && (
        <DataTable
          columns={['Product', 'Units Sold', 'Revenue']}
          initialRows={salesRows}
          loading={isLoading}
          renderRow={(row) => (
            <tr key={row.id}>
              <td style={{ fontWeight: 600 }}>{row.name}</td>
              <td><span className="km-count-badge">{row.units}</span></td>
              <td className="td-price">₹{row.revenue.toFixed(2)}</td>
            </tr>
          )}
        />
      )}

      {reportType === 'orders' && (
        <DataTable
          columns={['Order ID', 'Customer', 'Status', 'Total', 'Date']}
          initialRows={filteredOrders}
          loading={isLoading}
          renderRow={(o) => (
            <tr key={o.id}>
              <td className="td-id">#{o.referenceSlug || o.id}</td>
              <td>{o.User?.name || o.user?.name || '—'}</td>
              <td>{statusBadge(o.status)}</td>
              <td className="td-price">₹{Number(o.totalAmount || 0).toFixed(2)}</td>
              <td className="td-muted">
                {o.createdAt
                  ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'}
              </td>
            </tr>
          )}
        />
      )}

      {reportType === 'customers' && (
        <DataTable
          columns={['Customer', 'Email', 'Orders', 'Spend', 'Last Order']}
          initialRows={customerRows}
          loading={isLoading}
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
      )}
    </div>
  );
}