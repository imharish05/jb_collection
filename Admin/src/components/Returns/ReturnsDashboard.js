import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../api.js';
import toast from 'react-hot-toast';

// ── helpers ──────────────────────────────────────────────────────────────────
const TYPE_LABELS  = { refund: 'Return (Refund)', replacement: 'Replacement' };
const STATUS_COLORS = {
  pending_review:        { bg: '#fef9c3', color: '#a16207' }, // light yellow
  approved:              { bg: '#dcfce7', color: '#15803d' }, // light green
  rejected:              { bg: '#fee2e2', color: '#b91c1c' }, // light red
  pickup_scheduled:      { bg: '#eff6ff', color: '#1d4ed8' }, // light blue
  picked_up:             { bg: '#e0e7ff', color: '#3730a3' }, // light indigo
  inspection_completed:  { bg: '#f3e8ff', color: '#6b21a8' }, // light purple
  refund_initiated:      { bg: '#ecfdf5', color: '#047857' }, // light emerald
  refund_completed:      { bg: '#dcfce7', color: '#166534' }, // light dark green
  replacement_shipped:   { bg: '#eff6ff', color: '#1d4ed8' },
  replacement_delivered: { bg: '#dcfce7', color: '#166534' },
  cancelled:             { bg: '#fee2e2', color: '#b91c1c' },
};
const STATUS_LABELS = {
  pending_review:        'Pending Review',
  approved:              'Approved',
  rejected:              'Rejected',
  pickup_scheduled:      'Pickup Scheduled',
  picked_up:             'Picked Up',
  inspection_completed:  'Inspection Completed',
  refund_initiated:      'Refund Initiated',
  refund_completed:      'Refund Completed',
  replacement_shipped:   'Replacement Shipped',
  replacement_delivered: 'Replacement Delivered',
  cancelled:             'Cancelled',
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: '#f3f4f6', color: '#4b5563' };
  return (
    <span style={{
      background: s.bg, color: s.color, padding: '4px 10px',
      borderRadius: '20px', fontSize: '11px', fontWeight: 700,
      letterSpacing: '0.4px', whiteSpace: 'nowrap',
    }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

const TABS = [
  { key: 'all',         label: 'All Requests' },
  { key: 'refund',      label: 'Returns (Refund)' },
  { key: 'replacement', label: 'Replacements' },
];

export default function ReturnsDashboard({ showToast }) {
  const [returns, setReturns]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [stats, setStats]             = useState({});
  const PER_PAGE = 15;

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PER_PAGE });
      if (activeTab !== 'all') params.append('type', activeTab);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());

      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`/returns/admin/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReturns(res.data.returns || []);
      setTotalPages(Math.ceil((res.data.total || 0) / PER_PAGE));
      setStats(res.data.stats || {});
    } catch {
      toast.error('Failed to load returns');
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, statusFilter, search]);

  useEffect(() => { fetchReturns(); }, [fetchReturns]);
  useEffect(() => { setPage(1); }, [activeTab, statusFilter, search]);

  const handleQuickStatus = async (id, newStatus) => {
    const tid = toast.loading('Updating…');
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`/returns/admin/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Status updated', { id: tid });
      fetchReturns();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed', { id: tid });
    }
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '0 0 40px', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '20px', marginBottom: '24px' }}>
        {[
          { label: 'Pending Review',   val: stats.pending_review      || 0, color: '#eab308' },
          { label: 'Approved',         val: stats.approved            || 0, color: '#22c55e' },
          { label: 'Refund Completed', val: stats.refund_completed    || 0, color: '#16a34a' },
          { label: 'Rejected',         val: stats.rejected            || 0, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#ffffff', borderRadius: '14px', padding: '18px 20px',
            border: '1px solid #e5e7eb',
            borderLeft: `4px solid ${s.color}`, boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#111827' }}>{s.val}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs & Filters ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{
                padding: '8px 18px', borderRadius: '8px', border: activeTab === t.key ? 'none' : '1px solid #d1d5db', cursor: 'pointer',
                fontWeight: 600, fontSize: '13px', transition: 'all .2s',
                background: activeTab === t.key ? '#db1a5d' : '#ffffff',
                color: activeTab === t.key ? '#fff' : '#4b5563',
              }}
            >{t.label}</button>
          ))}
        </div>
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <input
            placeholder="Search by order ID / customer…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              background: '#ffffff', border: '1px solid #d1d5db', color: '#111827',
              borderRadius: '8px', padding: '8px 14px', fontSize: '13px', width: '230px',
              outline: 'none',
            }}
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{
              background: '#ffffff', border: '1px solid #d1d5db', color: '#111827',
              borderRadius: '8px', padding: '8px 12px', fontSize: '13px',
              outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button onClick={fetchReturns}
            style={{
              background: '#db1a5d', color: '#fff', border: 'none', borderRadius: '8px',
              padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '13px',
            }}
          >Refresh</button>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1.5px solid #d1d5db', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f1f5ff', borderBottom: '2px solid #d1d5db' }}>
              {['ID','Order','Customer','Type','Reason','Status','Requested','Actions'].map(h => (
                <th key={h} style={{ padding: '13px 16px', fontWeight: 700, fontSize: '11px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                <div style={{ display: 'inline-block', width: '36px', height: '36px', border: '3px solid #e5e7eb', borderTopColor: '#db1a5d', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </td></tr>
            ) : returns.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '60px', color: '#6b7280', fontSize: '14px' }}>No records found</td></tr>
            ) : returns.map((r, idx) => (
              <tr key={r.id}
                style={{
                  borderBottom: '1px solid #e5e7eb',
                  background: 'transparent',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => {
                  Array.from(e.currentTarget.children).forEach(td => td.style.background = '#f5f8ff');
                }}
                onMouseLeave={e => {
                  Array.from(e.currentTarget.children).forEach(td => td.style.background = 'transparent');
                }}
              >
                <td style={{ padding: '12px 16px', color: '#6b7280', fontFamily: 'monospace', fontWeight: 600, borderLeft: idx > 0 ? 'none' : undefined }}>#{r.id.substring(0, 8)}...</td>
                <td style={{ padding: '12px 16px', color: '#111827', fontWeight: 700, borderLeft: '1px solid #e5e7eb' }}>
                  {r.orderItem?.order?.id ? `ORD-${r.orderItem.order.id.substring(0, 8)}` : '—'}
                </td>
                <td style={{ padding: '12px 16px', color: '#374151', borderLeft: '1px solid #e5e7eb' }}>
                  <div style={{ fontWeight: 600 }}>{r.orderItem?.order?.user?.name || '—'}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>{r.orderItem?.order?.user?.email || ''}</div>
                </td>
                <td style={{ padding: '12px 16px', borderLeft: '1px solid #e5e7eb' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                    background: r.returnType === 'refund' ? '#eff6ff' : '#f3e8ff',
                    color:      r.returnType === 'refund' ? '#1d4ed8' : '#6b21a8',
                  }}>
                    {TYPE_LABELS[r.returnType] || r.returnType}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderLeft: '1px solid #e5e7eb' }} title={r.reason}>
                  {r.reason ? r.reason.replace(/_/g, ' ') : '—'}
                </td>
                <td style={{ padding: '12px 16px', borderLeft: '1px solid #e5e7eb' }}><StatusBadge status={r.status} /></td>
                <td style={{ padding: '12px 16px', color: '#6b7280', whiteSpace: 'nowrap', borderLeft: '1px solid #e5e7eb' }}>
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </td>
                <td style={{ padding: '12px 16px', borderLeft: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Link to={`/returns/${r.id}`}
                      style={{
                        background: 'var(--primary-50)', color: 'var(--primary-700)', border: '1px solid var(--primary-100)', padding: '5px 12px',
                        borderRadius: '6px', fontSize: '11px', fontWeight: 600, textDecoration: 'none',
                        whiteSpace: 'nowrap', display: 'inline-block', textAlign: 'center', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-100)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-50)'; }}
                    >View</Link>
                    {r.status === 'pending_review' && (
                      <>
                        <button onClick={() => handleQuickStatus(r.id, 'approved')}
                          style={{ background: 'var(--success-50)', color: 'var(--success-600)', border: '1px solid var(--success-border)', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#dcfce7'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--success-50)'; }}
                        >
                          ✓ Approve
                        </button>
                        <button onClick={() => handleQuickStatus(r.id, 'rejected')}
                          style={{ background: 'var(--danger-50)', color: 'var(--danger-600)', border: '1px solid var(--danger-border)', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--danger-50)'; }}
                        >
                          ✕ Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            style={{ background: '#ffffff', border: '1px solid #d1d5db', color: '#4b5563', padding: '8px 16px', borderRadius: '8px', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1, fontWeight: 600 }}>
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              style={{
                background: page === p ? '#db1a5d' : '#ffffff', color: page === p ? '#fff' : '#4b5563',
                border: page === p ? 'none' : '1px solid #d1d5db', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                fontWeight: 700,
              }}>
              {p}
            </button>
          ))}
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            style={{ background: '#ffffff', border: '1px solid #d1d5db', color: '#4b5563', padding: '8px 16px', borderRadius: '8px', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, fontWeight: 600 }}>
            Next →
          </button>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
