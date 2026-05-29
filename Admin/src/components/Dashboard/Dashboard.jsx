import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import styles from './Dashboard.module.css';
import { loadDashboard, loadChart } from '../../redux/services/dashboardService';

function stockColor(s) { return s > 200 ? '#45b369' : s > 50 ? '#ff9f29' : '#ef4444'; }
function stockLabel(s) { return s > 200 ? 'In Stock' : s > 50 ? 'Low' : 'Out'; }

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1b2431', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
      <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#fff' }}>
        {payload[0].value} <span style={{ fontSize: 12, color: '#9ca3af' }}>orders</span>
      </p>
    </div>
  );
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 2022 }, (_, i) => CURRENT_YEAR - i);

export default function Dashboard() {
  const dispatch = useDispatch();
  const { stats, recentProducts, totalStock, orderCounts, monthlyData, monthlySalesData, loading, graphLoading } = useSelector(state => state.dashboard);
  const [mounted, setMounted] = useState(false);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const isFirstChartLoad = useRef(true);

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  useEffect(() => {
    loadDashboard(dispatch);
  }, []);

  useEffect(() => {
    if (isFirstChartLoad.current) {
      isFirstChartLoad.current = false;
      return;
    }
    loadChart(dispatch, selectedYear);
  }, [selectedYear]);

  const STAT_CARDS = [
    { label: 'Total Products', value: stats.totalProducts, bg: 'linear-gradient(135deg,#487fff 0%,#486cea 100%)', icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m8 4v10" /></svg>) },
    { label: 'Total Customers', value: stats.totalCustomers, bg: 'linear-gradient(135deg,#ea8b0c 0%,#d97b08 100%)', icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>) },
    { label: 'Stock Items', value: totalStock, bg: 'linear-gradient(135deg,#45b369 0%,#2a8a22 100%)', icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2M8 7V5a2 2 0 0 0-4 0v2" /></svg>) },
  ];

  const ORDER_ROWS = [
    { label: 'New Orders',       count: orderCounts.new,       color: '#487fff', bg: '#e4f1ff' },
    { label: 'Confirmed',        count: orderCounts.confirmed,  color: '#45b369', bg: '#daf0e1' },
    { label: 'Shipped',          count: orderCounts.shipped,    color: '#ff9f29', bg: '#fff9e2' },
    { label: 'Out for Delivery', count: orderCounts.delivery,   color: '#8252e9', bg: '#f0e1ff' },
    { label: 'Delivered',        count: orderCounts.delivered,  color: '#45b369', bg: '#daf0e1' },
    { label: 'Cancelled',        count: orderCounts.cancelled,  color: '#ef4444', bg: '#fef2f2' },
  ];

  return (
    <div className={`${styles.dash} ${mounted ? styles.dashIn : ''}`}>
      <div className={styles.greeting}>
        <div>
          <h1 className={styles.greetTitle}>Good to see you, Admin 👋</h1>
          <p className={styles.greetSub}>Here's what's happening with your store today.</p>
        </div>
      </div>

      <div className={styles.statsRow}>
        {STAT_CARDS.map((s, i) => (
          <div key={s.label} className={styles.statCard} style={{ '--bg': s.bg, '--delay': `${i * 80}ms` }}>
            <div className={styles.scTop}>
              <div className={styles.scMeta}>
                <div className={styles.scIcon}>{s.icon}</div>
                <div>
                  <p className={styles.scLabel}>{s.label}</p>
                  <p className={styles.scVal}>{loading && s.label !== 'Stock Items' ? '—' : s.value}</p>
                </div>
              </div>
            </div>
            <div className={styles.scCircle1} />
            <div className={styles.scCircle2} />
          </div>
        ))}
      </div>

      <div className={styles.midRow}>
        <div className={styles.chartCard}>
          <div className={styles.cardHdr}>
            <div>
              <h3 className={styles.cardTitle}>Monthly Orders</h3>
              <p className={styles.cardSub}>Order volume across {selectedYear}</p>
            </div>
            <select className={styles.yearSelect} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
              {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {graphLoading ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13, fontWeight: 500 }}>
              Loading chart…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(72,127,255,0.06)', radius: 6 }} />
                <Bar dataKey="sales" fill="url(#barGrad)" radius={[6, 6, 0, 0]}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#487fff" stopOpacity={1} />
                      <stop offset="100%" stopColor="#486cea" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={styles.ordersPanel}>
          <div className={styles.cardHdr}>
            <div>
              <h3 className={styles.cardTitle}>Order Status</h3>
              <p className={styles.cardSub}>Live counts by stage</p>
            </div>
          </div>
          <div className={styles.orderGrid}>
            {ORDER_ROWS.map(o => (
              <div key={o.label} className={styles.orderChip} style={{ '--oc': o.color, '--obg': o.bg }}>
                <span className={styles.orderDot} />
                <span className={styles.orderLabel}>{o.label}</span>
                <span className={styles.orderCount}>{o.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.chartCard} style={{ marginTop: 20 , marginBottom : 20}}>
        <div className={styles.cardHdr}>
          <div>
            <h3 className={styles.cardTitle}>Sales Overview</h3>
            <p className={styles.cardSub}>Monthly revenue trend for {selectedYear}</p>
          </div>
        </div>
        {graphLoading ? (
          <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13, fontWeight: 500 }}>
            Loading sales chart…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlySalesData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#45b369" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#45b369" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => [`₹${Number(v || 0).toLocaleString('en-IN')}`, 'Revenue']}
                labelStyle={{ color: '#9ca3af', fontSize: 11, fontWeight: 600 }}
                contentStyle={{ background: '#1b2431', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff' }}
              />
              <Area type="monotone" dataKey="amount" stroke="#45b369" strokeWidth={3} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.cardHdr}>
          <div>
            <h3 className={styles.cardTitle}>Recent Products</h3>
            <p className={styles.cardSub}>Latest additions to the store</p>
          </div>
          <div className={styles.legend}>
            {[['#45b369', 'In Stock'], ['#ff9f29', 'Low Stock'], ['#ef4444', 'Out']].map(([c, l]) => (
              <span key={l} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: c }} />{l}
              </span>
            ))}
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>{['No.', 'Product Name', 'Category', 'MRP', 'Sale Price', 'Stock', 'Status'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map(i => <tr key={i}>{[1, 2, 3, 4, 5, 6, 7].map(j => <td key={j}><div className={styles.skeleton} /></td>)}</tr>)
              ) : recentProducts.length === 0 ? (
                <tr><td colSpan={7} className={styles.emptyRow}>No products yet</td></tr>
              ) : (
                recentProducts.map((p, i) => {
                  const ts = p.Variants?.reduce((a, v) => a + (Number(v.stock) || 0), 0) ?? 0;
                  const fv = p.Variants?.[0];
                  const mrp = fv?.mrp ?? p.mrp ?? 0;
                  const sale = fv?.salesPrice ?? p.salesPrice ?? 0;
                  const sc = stockColor(ts);
                  return (
                    <tr key={p.id} className={styles.tRow}>
                      <td className={styles.tdIdx}>{i + 1}</td>
                      <td className={styles.tdName}>{p.productName}</td>
                      <td><span className={styles.catPill}>{p.Category?.name || '—'}</span></td>
                      <td className={styles.tdMrp}>₹{mrp}</td>
                      <td className={styles.tdSale}>₹{sale}</td>
                      <td className={styles.tdStock}><span className={styles.stockNum} style={{ '--sc': sc }}>{ts}</span></td>
                      <td><span className={styles.statusBadge} style={{ '--sc': sc, '--sbg': sc + '22' }}>{stockLabel(ts)}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}