import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPaymentTransactions } from '../../redux/services/paymentsService';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import styles from '../Dashboard/Dashboard.module.css';
import dtStyles from '../DataTable/DataTable.module.css';

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

const PAYMENT_STATUS_LABEL = {
  paid: 'Paid',
  failed: 'Failed',
  partial: 'Partial COD',
  refunded: 'Refunded',
  pending: 'Pending',
};

const STATUS_COLORS = {
  paid:     { color: '#16a34a', bg: '#dcfce7' },
  failed:   { color: '#dc2626', bg: '#fee2e2' },
  partial:  { color: '#d97706', bg: '#fef3c7' },
  refunded: { color: '#6b7280', bg: '#f3f4f6' },
  pending:  { color: '#2563eb', bg: '#dbeafe' },
};

function getPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…');
    result.push(sorted[i]);
  }
  return result;
}

function statusBadge(status, paymentType, codCollected) {
  if (paymentType === 'PARTIAL_COD') {
    if (codCollected || status === 'paid') {
      return (
        <span style={{
          fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#dcfce7',
          padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap',
        }}>
          Paid (COD Collected)
        </span>
      );
    } else {
      return (
        <span style={{
          fontSize: 11, fontWeight: 700, color: '#d97706', background: '#fef3c7',
          padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap',
        }}>
          Partial COD (Pending)
        </span>
      );
    }
  }

  const c = STATUS_COLORS[status] || { color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, color: c.color, background: c.bg,
      padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap',
    }}>
      {PAYMENT_STATUS_LABEL[status] || status}
    </span>
  );
}

export default function Payments() {
  const dispatch = useDispatch();
  const { transactions, total, page, limit, totalPages, stats, loading } = useSelector(s => s.payments);

  const [mounted, setMounted] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [downloadFormat, setDownloadFormat] = useState('xlsx');
  const [downloading, setDownloading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingReasons, setEditingReasons] = useState({});

  useEffect(() => { setMounted(true); }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch transactions on dependency change
  useEffect(() => {
    const backendDateRange = 
      dateRange === '7d' ? 'last7' :
      dateRange === '30d' ? 'last30' :
      dateRange === 'month' ? 'thisMonth' :
      dateRange === 'year' ? 'thisYear' :
      dateRange;

    // Reset pagination to page 1 if page-size or filters change, except when current page changes directly
    dispatch(fetchPaymentTransactions({
      status: statusFilter,
      dateRange: backendDateRange,
      from: dateRange === 'custom' ? fromDate : undefined,
      to: dateRange === 'custom' ? toDate : undefined,
      search: debouncedSearch,
      page: currentPage,
      limit: pageSize,
    }));
  }, [dispatch, statusFilter, dateRange, fromDate, toDate, debouncedSearch, currentPage, pageSize, refreshKey]);

  // Handle filter changes (resets current page to 1)
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (e) => {
    setDateRange(e.target.value);
    setCurrentPage(1);
  };

  const handleDownloadReport = async () => {
    if (downloading) return;
    setDownloading(true);

    const toastId = toast.loading(`Generating and downloading ${downloadFormat.toUpperCase()} report...`);
    try {
      const backendDateRange = 
        dateRange === '7d' ? 'last7' :
        dateRange === '30d' ? 'last30' :
        dateRange === 'month' ? 'thisMonth' :
        dateRange === 'year' ? 'thisYear' :
        dateRange;

      const res = await api.get('/reports/payments', {
        params: {
          format: downloadFormat,
          status: statusFilter,
          dateRange: backendDateRange,
          from: dateRange === 'custom' ? fromDate : undefined,
          to: dateRange === 'custom' ? toDate : undefined,
          search: debouncedSearch,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `Payments_Report_${dateStr}.${downloadFormat}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Payments report downloaded successfully!`, { id: toastId });
    } catch (err) {
      console.error('Download error:', err);
      toast.error(`Failed to generate payments report.`, { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  const handleCodStatusChange = async (row, newStatus) => {
    if (newStatus === 'failed') {
      setEditingReasons(prev => ({
        ...prev,
        [row.orderId]: row.paymentFailureReason || ''
      }));
      return;
    }

    let nextCodCollected = false;
    let nextPaymentStatus = 'pending';
    if (row.paymentType === 'PARTIAL_COD') {
      nextPaymentStatus = 'partial';
    }

    if (newStatus === 'success') {
      nextCodCollected = true;
      nextPaymentStatus = 'paid';
    }

    const toastId = toast.loading('Updating COD status...');
    try {
      await api.patch(`/orders/${row.orderId}/status`, {
        codCollected: nextCodCollected,
        paymentStatus: nextPaymentStatus,
        paymentFailureReason: null
      });

      toast.success('COD status updated!', { id: toastId });
      setEditingReasons(prev => {
        const copy = { ...prev };
        delete copy[row.orderId];
        return copy;
      });
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to update COD status:', err);
      toast.error(err.response?.data?.message || 'Failed to update COD status', { id: toastId });
    }
  };

  const handleSaveFailureReason = async (row) => {
    const reason = editingReasons[row.orderId];
    if (!reason || !reason.trim()) {
      toast.error('Please enter a failure reason');
      return;
    }

    const toastId = toast.loading('Saving failure reason...');
    try {
      await api.patch(`/orders/${row.orderId}/status`, {
        codCollected: false,
        paymentStatus: 'failed',
        paymentFailureReason: reason.trim()
      });

      toast.success('Failure reason saved successfully!', { id: toastId });
      setEditingReasons(prev => {
        const copy = { ...prev };
        delete copy[row.orderId];
        return copy;
      });
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to save failure reason:', err);
      toast.error(err.response?.data?.message || 'Failed to save failure reason', { id: toastId });
    }
  };

  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, total);
  const pageNumbers = getPageNumbers(page, totalPages);
  const showPagination = !loading && total > 0;

  return (
    <div className={`${styles.dash} ${mounted ? styles.dashIn : ''}`}>
      <div className={styles.greeting}>
        <div>
          <h1 className={styles.greetTitle}>Payments & Transactions</h1>
          <p className={styles.greetSub}>Monitor online payment tracking, analyze transaction statuses, and export reports.</p>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className={styles.statsRow}>
        <div className={styles.statCard} style={{ '--bg': 'linear-gradient(135deg,#45b369 0%,#2a8a22 100%)' }}>
          <div className={styles.scTop}>
            <div className={styles.scMeta}>
              <div>
                <p className={styles.scLabel}>Total Successful</p>
                <p className={styles.scVal}>
                  ₹{(stats?.totalSuccessfulAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 8, opacity: 0.9 }}>
                    ({stats?.totalSuccessfulCount || 0} paid)
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className={styles.scCircle1} />
          <div className={styles.scCircle2} />
        </div>
        
        <div className={styles.statCard} style={{ '--bg': 'linear-gradient(135deg,#dc2626 0%,#b91c1c 100%)' }}>
          <div className={styles.scTop}>
            <div className={styles.scMeta}>
              <div>
                <p className={styles.scLabel}>Total Failed</p>
                <p className={styles.scVal}>{stats?.totalFailedCount || 0} attempts</p>
              </div>
            </div>
          </div>
          <div className={styles.scCircle1} />
          <div className={styles.scCircle2} />
        </div>

        <div className={styles.statCard} style={{ '--bg': 'linear-gradient(135deg,#487fff 0%,#486cea 100%)' }}>
          <div className={styles.scTop}>
            <div className={styles.scMeta}>
              <div>
                <p className={styles.scLabel}>Success Rate</p>
                <p className={styles.scVal}>{(stats?.successRate || 0).toFixed(1)}%</p>
              </div>
            </div>
          </div>
          <div className={styles.scCircle1} />
          <div className={styles.scCircle2} />
        </div>
      </div>

      {/* ── Filters ── */}
      <div className={styles.tableCard} style={{ padding: 20, marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Search</label>
          <input
            type="text"
            className="search-input"
            style={{ minWidth: 220 }}
            placeholder="Order ID / Email / Razorpay ID"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
          <select className="search-input" style={{ minWidth: 150 }} value={statusFilter} onChange={handleStatusChange}>
            <option value="all">All Statuses</option>
            {Object.entries(PAYMENT_STATUS_LABEL).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date Range</label>
          <select className="search-input" style={{ minWidth: 150 }} value={dateRange} onChange={handleDateRangeChange}>
            {DATE_RANGES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>

        {dateRange === 'year' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Year</label>
            <select className="search-input" style={{ minWidth: 100 }} value={selectedYear} onChange={e => { setSelectedYear(Number(e.target.value)); setCurrentPage(1); }}>
              {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}

        {dateRange === 'custom' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>From</label>
              <input type="date" className="search-input" style={{ minWidth: 140 }} value={fromDate} onChange={e => { setFromDate(e.target.value); setCurrentPage(1); }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To</label>
              <input type="date" className="search-input" style={{ minWidth: 140 }} value={toDate} onChange={e => { setToDate(e.target.value); setCurrentPage(1); }} />
            </div>
          </>
        )}

        {/* ── Export Controls ── */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <select 
            className="search-input" 
            style={{ width: 90 }} 
            value={downloadFormat} 
            onChange={e => setDownloadFormat(e.target.value)}
          >
            <option value="xlsx">XLSX</option>
            <option value="csv">CSV</option>
          </select>
          <button 
            type="button" 
            className="add-btn" 
            style={{ background: '#2563eb', padding: '10px 18px', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
            onClick={handleDownloadReport}
            disabled={downloading}
          >
            {downloading ? 'Downloading...' : 'Download Report'}
          </button>
        </div>
      </div>

      {/* ── Server-Side Table ── */}
      <div className={styles.tableCard}>
        {showPagination && (
          <div className={dtStyles.pageSizeLabel} style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 20px 0', fontSize: 13, gap: 10, alignItems: 'center' }}>
            <span>Rows per page</span>
            <select
              className={dtStyles.pageSizeSelect}
              value={limit}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: 20, borderRadius: '14px', border: '1.5px solid #d1d5db' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Razorpay Paid</th>
                <th>Due on Delivery</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Date</th>
                <th>Failure Reason</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((j) => (
                      <td key={j}><div className={styles.skeleton} /></td>
                    ))}
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className={styles.emptyRow}>No payment transactions found.</td>
                </tr>
              ) : (
                transactions.map((row) => {
                  const isPrepaid = row.paymentType === 'PREPAID' || row.paymentMethod !== 'partial_cod';
                  const razorpayPaid = row.advancePaid > 0 ? row.advancePaid : (isPrepaid && row.paymentStatus === 'paid' ? row.amount : 0);
                  const codDue = row.codAmount > 0 ? row.codAmount : (!isPrepaid ? row.amount - razorpayPaid : 0);

                  return (
                    <tr key={row.orderId}>
                      <td className="td-id" style={{ fontWeight: 600 }}>#{row.orderId.slice(0, 8)}...</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{row.customerName}</div>
                        <div className="td-muted" style={{ fontSize: 11 }}>{row.customerEmail}</div>
                      </td>
                      <td className="td-price" style={{ fontWeight: 700 }}>₹{row.amount.toFixed(2)}</td>
                      <td className="td-price" style={{ fontWeight: 600, color: '#16a34a' }}>₹{razorpayPaid.toFixed(2)}</td>
                      <td className="td-price" style={{ fontWeight: 600 }}>
                        {row.paymentType === 'PARTIAL_COD' || row.paymentType === 'FULL_COD' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', minWidth: '130px' }}>
                            <div style={{ fontWeight: 700 }}>₹{codDue.toFixed(2)}</div>
                            
                            {(() => {
                              const currentStatus =
                                row.paymentStatus === 'failed' ? 'failed' :
                                (row.codCollected || row.paymentStatus === 'paid') ? 'success' : 'pending';

                              const selectStyle = {
                                padding: '4px 6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                width: '100%',
                                maxWidth: '130px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                outline: 'none',
                                fontFamily: 'inherit',
                                transition: 'all 0.15s ease',
                                backgroundColor:
                                  currentStatus === 'success' ? '#dcfce7' :
                                  currentStatus === 'failed' ? '#fee2e2' : '#fef3c7',
                                color:
                                  currentStatus === 'success' ? '#16a34a' :
                                  currentStatus === 'failed' ? '#dc2626' : '#d97706',
                                border:
                                  currentStatus === 'success' ? '1.5px solid #86efac' :
                                  currentStatus === 'failed' ? '1.5px solid #fca5a5' : '1.5px solid #fde047',
                              };

                              return (
                                <>
                                  <select
                                    value={currentStatus}
                                    onChange={(e) => handleCodStatusChange(row, e.target.value)}
                                    style={selectStyle}
                                  >
                                    <option value="pending" style={{ backgroundColor: '#fff', color: '#d97706' }}>Pending</option>
                                    <option value="success" style={{ backgroundColor: '#fff', color: '#16a34a' }}>Collected</option>
                                    <option value="failed" style={{ backgroundColor: '#fff', color: '#dc2626' }}>Failed</option>
                                  </select>

                                  {(currentStatus === 'failed' || editingReasons[row.orderId] !== undefined) && (
                                    <div style={{ display: 'flex', gap: 4, width: '100%', alignItems: 'center' }}>
                                      <input
                                        type="text"
                                        placeholder="Reason..."
                                        value={editingReasons[row.orderId] !== undefined ? editingReasons[row.orderId] : (row.paymentFailureReason || '')}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setEditingReasons(prev => ({
                                            ...prev,
                                            [row.orderId]: val
                                          }));
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleSaveFailureReason(row);
                                          }
                                        }}
                                        style={{
                                          padding: '4px 6px',
                                          borderRadius: '4px',
                                          border: '1px solid #fca5a5',
                                          fontSize: '10px',
                                          backgroundColor: '#fff',
                                          color: '#374151',
                                          flex: 1,
                                          minWidth: '80px',
                                          fontFamily: 'inherit'
                                        }}
                                      />
                                      <button
                                        onClick={() => handleSaveFailureReason(row)}
                                        style={{
                                          padding: '4px 6px',
                                          borderRadius: '4px',
                                          border: 'none',
                                          backgroundColor: '#dc2626',
                                          color: '#fff',
                                          fontSize: '10px',
                                          cursor: 'pointer',
                                          fontWeight: '700',
                                          fontFamily: 'inherit'
                                        }}
                                      >
                                        Save
                                      </button>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ textTransform: 'uppercase', fontSize: 12, fontWeight: 600 }}>{row.paymentMethod}</td>
                      <td>{statusBadge(row.paymentStatus, row.paymentType, row.codCollected)}</td>
                      <td className="td-muted" style={{ fontSize: 12 }}>
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td style={{ color: '#ef4444', fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.paymentFailureReason || ''}>
                        {row.paymentFailureReason || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Server-Side Pagination Footer ── */}
        {showPagination && (
          <div className={dtStyles.pagination} style={{ margin: '0 20px 20px' }}>
            <span className={dtStyles.paginationInfo}>
              Showing {startIndex + 1}–{endIndex} of {total}
            </span>
            <div className={dtStyles.paginationControls}>
              <button
                type="button"
                className={dtStyles.pageBtn}
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Prev
              </button>
              <div className={dtStyles.pageNumbers}>
                {pageNumbers.map((n, idx) =>
                  n === '…' ? (
                    <span key={`ellipsis-${idx}`} className={dtStyles.ellipsis}>…</span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      className={`${dtStyles.pageBtn} ${n === currentPage ? dtStyles.pageBtnActive : ''}`}
                      onClick={() => setCurrentPage(n)}
                      disabled={loading}
                    >
                      {n}
                    </button>
                  )
                )}
              </div>
              <button
                type="button"
                className={dtStyles.pageBtn}
                disabled={currentPage >= totalPages || loading}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
