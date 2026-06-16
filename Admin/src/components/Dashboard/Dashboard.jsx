import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import styles from './Dashboard.module.css';
import { loadDashboard, loadChart } from '../../redux/services/dashboardService';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

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
  const { stats, recentProducts, totalStock, orderCounts, monthlyData, monthlySalesData, quarterlySalesData, loading, graphLoading, quarterlyLoading } = useSelector(state => state.dashboard);
  const [mounted, setMounted] = useState(false);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [salesView, setSalesView] = useState('monthly'); // 'monthly' | 'quarterly'
  const isFirstChartLoad = useRef(true);

  // ── Export Reports State ──
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(''); // 'sales' | 'product-sales' | 'best-sellers' | 'monthly-sales' | 'inventory'
  const [reportFormat, setReportFormat] = useState('xlsx'); // 'xlsx' | 'csv'
  const [dateRange, setDateRange] = useState('thisMonth'); // 'today' | 'last7' | 'last30' | 'thisMonth' | 'thisYear' | 'custom'
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [productFilter, setProductFilter] = useState('all'); // 'all' | product_id
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | status
  const [productsList, setProductsList] = useState([]);
  const [generating, setGenerating] = useState(false);
  const dropdownRef = useRef(null);

  const REPORT_NAMES = {
    'sales': 'Sales Report',
    'product-sales': 'Product Sales Report',
    'best-sellers': 'Best Selling Products',
    'monthly-sales': 'Monthly Sales Report',
    'inventory': 'Inventory Report'
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showExportModal && productsList.length === 0) {
      api.get('/products')
        .then(res => {
          if (Array.isArray(res.data)) {
            setProductsList(res.data);
          }
        })
        .catch(err => console.error('Failed to load products list for filter', err));
    }
  }, [showExportModal]);

  const handleExportSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);
    const toastId = toast.loading(`Generating ${REPORT_NAMES[selectedReport]}...`);

    try {
      const params = {
        format: reportFormat,
        dateRange,
        from: fromDate,
        to: toDate,
        productId: productFilter,
        orderStatus: statusFilter
      };

      const res = await api.get(`/dashboard/reports/${selectedReport}`, {
        params,
        responseType: 'blob'
      });

      const blob = new Blob([res.data], {
        type: reportFormat === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `${REPORT_NAMES[selectedReport].replace(/\s+/g, '_')}_${dateStr}.${reportFormat}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${REPORT_NAMES[selectedReport]} downloaded successfully!`, { id: toastId });
      setShowExportModal(false);
    } catch (err) {
      console.error('Export error:', err);
      toast.error(`Failed to generate ${REPORT_NAMES[selectedReport]}. Please try again.`, { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

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
        
        {/* Export Reports Dropdown */}
        <div className={styles.exportReportsWrap} ref={dropdownRef}>
          <button 
            className={styles.exportBtn} 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
          >
            Export Reports 
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3" 
              style={{ marginLeft: 8, transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }}
            >
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          
          {dropdownOpen && (
            <div className={styles.dropdownMenu}>
              <button type="button" className={styles.dropdownItem} onClick={() => { setSelectedReport('sales'); setShowExportModal(true); setDropdownOpen(false); }}>
                Sales Report
              </button>
              <button type="button" className={styles.dropdownItem} onClick={() => { setSelectedReport('product-sales'); setShowExportModal(true); setDropdownOpen(false); }}>
                Product Sales Report
              </button>
              <button type="button" className={styles.dropdownItem} onClick={() => { setSelectedReport('best-sellers'); setShowExportModal(true); setDropdownOpen(false); }}>
                Best Selling Products
              </button>
              <button type="button" className={styles.dropdownItem} onClick={() => { setSelectedReport('monthly-sales'); setShowExportModal(true); setDropdownOpen(false); }}>
                Monthly Sales Report
              </button>
              <button type="button" className={styles.dropdownItem} onClick={() => { setSelectedReport('inventory'); setShowExportModal(true); setDropdownOpen(false); }}>
                Inventory Report
              </button>
            </div>
          )}
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
            <div className={styles.yearSelectWrap}>
              <select className={styles.yearSelect} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <span className={styles.yearSelectIcon}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
          </div>
          {graphLoading ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13, fontWeight: 500 }}>
              Loading chart…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={22}>
                <CartesianGrid Dasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
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
            <p className={styles.cardSub}>
              {salesView === 'quarterly'
                ? `Quarterly revenue breakdown for ${selectedYear}`
                : `Monthly revenue trend for ${selectedYear}`}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* View toggle */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 3, gap: 2 }}>
              {['monthly', 'quarterly'].map(v => (
                <button
                  key={v}
                  onClick={() => setSalesView(v)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'capitalize',
                    background: salesView === v ? '#487fff' : 'transparent',
                    color: salesView === v ? '#fff' : '#9ca3af',
                    transition: 'all 0.18s ease',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
            {/* Year picker */}
            <div className={styles.yearSelectWrap}>
              <select className={styles.yearSelect} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <span className={styles.yearSelectIcon}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
          </div>
        </div>

        {salesView === 'monthly' ? (
          graphLoading ? (
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
          )
        ) : (
          /* ── Quarterly view ── */
          quarterlyLoading ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13, fontWeight: 500 }}>
              Loading quarterly data…
            </div>
          ) : (
            <>
              {/* Yearly summary banner */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, margin: '8px 0 18px',
                background: 'linear-gradient(135deg,rgba(69,179,105,0.12) 0%,rgba(72,127,255,0.12) 100%)',
                border: '1px solid rgba(69,179,105,0.2)', borderRadius: 10, padding: '10px 20px',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#45b369" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                </svg>
                <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>Yearly Total {selectedYear}:</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#45b369' }}>
                  ₹{Number(quarterlySalesData?.yearly || 0).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Quarter cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 20 }}>
                {(['Q1 (Jan–Mar)','Q2 (Apr–Jun)','Q3 (Jul–Sep)','Q4 (Oct–Dec)']).map((label, i) => {
                  const qData = quarterlySalesData?.quarters?.[i];
                  const amount = qData?.amount || 0;
                  const yearly = quarterlySalesData?.yearly || 1;
                  const pct = yearly > 0 ? Math.round((amount / yearly) * 100) : 0;
                  const colors = ['#487fff','#45b369','#ff9f29','#8252e9'];
                  const color = colors[i];
                  return (
                    <div key={label} style={{
                      background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}33`,
                      borderRadius: 12, padding: '16px 18px', position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '12px 12px 0 0' }} />
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        {label}
                      </p>
                      <p style={{ margin: '8px 0 4px', fontSize: 20, fontWeight: 700, color: '#fff' }}>
                        ₹{Number(amount).toLocaleString('en-IN')}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, minWidth: 30 }}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quarterly bar chart */}
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={quarterlySalesData?.quarters || []} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barSize={40}>
                  <defs>
                    {['#487fff','#45b369','#ff9f29','#8252e9'].map((c, i) => (
                      <linearGradient key={i} id={`qGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c} stopOpacity={1} />
                        <stop offset="100%" stopColor={c} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="q" tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => [`₹${Number(v || 0).toLocaleString('en-IN')}`, 'Revenue']}
                    labelStyle={{ color: '#9ca3af', fontSize: 11, fontWeight: 600 }}
                    contentStyle={{ background: '#1b2431', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff' }}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}
                    fill="url(#qGrad0)"
                    label={false}
                    shape={(props) => {
                      const { x, y, width, height, index } = props;
                      const gradIds = ['qGrad0','qGrad1','qGrad2','qGrad3'];
                      return <rect x={x} y={y} width={width} height={height} fill={`url(#${gradIds[index % 4]})`} rx={6} ry={6} />;
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </>
          )
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

      {/* Export Options Modal */}
      {showExportModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Export {REPORT_NAMES[selectedReport]}</h3>
              <button className={styles.modalCloseBtn} onClick={() => setShowExportModal(false)} aria-label="Close modal">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleExportSubmit}>
              <div className={styles.modalBody}>
                {/* Format Filter */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Export Format</label>
                  <select 
                    className={styles.formControl} 
                    value={reportFormat} 
                    onChange={e => setReportFormat(e.target.value)}
                  >
                    <option value="xlsx">Excel Workbook (.xlsx)</option>
                    <option value="csv">Comma Separated Values (.csv)</option>
                  </select>
                </div>

                {/* Date Range Filter (Not needed for Inventory Report) */}
                {selectedReport !== 'inventory' && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Date Range</label>
                    <select 
                      className={styles.formControl} 
                      value={dateRange} 
                      onChange={e => setDateRange(e.target.value)}
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="last7">Last 7 Days</option>
                      <option value="last30">Last 30 Days</option>
                      <option value="thisMonth">This Month</option>
                      <option value="thisYear">This Year</option>
                      <option value="custom">Custom Date Range</option>
                    </select>
                    
                    {dateRange === 'custom' && (
                      <div className={styles.dateRangeRow}>
                        <div>
                          <label className={styles.formLabel} style={{ fontSize: '11px', marginTop: '6px' }}>From</label>
                          <input 
                            type="date" 
                            className={styles.formControl} 
                            value={fromDate}
                            onChange={e => setFromDate(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className={styles.formLabel} style={{ fontSize: '11px', marginTop: '6px' }}>To</label>
                          <input 
                            type="date" 
                            className={styles.formControl} 
                            value={toDate}
                            onChange={e => setToDate(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Product Filter (For Sales, Product Sales, and Inventory Reports) */}
                {(selectedReport === 'sales' || selectedReport === 'product-sales' || selectedReport === 'inventory') && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Filter by Product</label>
                    <select 
                      className={styles.formControl} 
                      value={productFilter} 
                      onChange={e => setProductFilter(e.target.value)}
                    >
                      <option value="all">All Products</option>
                      {productsList.map(p => (
                        <option key={p.id} value={p.id}>{p.productName}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Order Status Filter (Specific to Sales Report) */}
                {selectedReport === 'sales' && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Order Status</label>
                    <select 
                      className={styles.formControl} 
                      value={statusFilter} 
                      onChange={e => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                )}
              </div>
              
              <div className={styles.modalFooter}>
                <button 
                  type="button" 
                  className={styles.btnSecondary} 
                  onClick={() => setShowExportModal(false)}
                  disabled={generating}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.btnPrimary}
                  disabled={generating}
                >
                  {generating && <span className={styles.spinner} />}
                  {generating ? 'Exporting...' : 'Export & Download'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}