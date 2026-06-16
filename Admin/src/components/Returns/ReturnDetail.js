import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../../api.js';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
const STATUS_FLOW = {
  refund: [
    'pending_review', 'approved', 'pickup_scheduled', 'picked_up',
    'inspection_completed', 'refund_initiated', 'refund_completed',
  ],
  replacement: [
    'pending_review', 'approved', 'pickup_scheduled', 'picked_up',
    'inspection_completed', 'replacement_shipped', 'replacement_delivered',
  ],
  cancel: ['pending_review', 'approved', 'cancelled'],
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

const STATUS_COLORS = {
  pending_review:        { bg: '#fef9c3', color: '#a16207' },
  approved:              { bg: '#dcfce7', color: '#15803d' },
  rejected:              { bg: '#fee2e2', color: '#b91c1c' },
  pickup_scheduled:      { bg: '#eff6ff', color: '#1d4ed8' },
  picked_up:             { bg: '#e0e7ff', color: '#3730a3' },
  inspection_completed:  { bg: '#f3e8ff', color: '#6b21a8' },
  refund_initiated:      { bg: '#ecfdf5', color: '#047857' },
  refund_completed:      { bg: '#dcfce7', color: '#166534' },
  replacement_shipped:   { bg: '#eff6ff', color: '#1d4ed8' },
  replacement_delivered: { bg: '#dcfce7', color: '#166534' },
  cancelled:             { bg: '#fee2e2', color: '#b91c1c' },
};

// ── Utility ──────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const FALLBACK = 'https://via.placeholder.com/80x80?text=IMG';

function Section({ title, children }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '20px 24px', marginBottom: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
      <h4 style={{ margin: '0 0 16px', color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>{title}</h4>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
      <span style={{ color: '#6b7280', fontSize: '13px', minWidth: '140px' }}>{label}</span>
      <span style={{ color: '#111827', fontSize: '13px', fontWeight: 600, textAlign: 'right', flex: 1 }}>{value || '—'}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ReturnDetail() {
  const { id } = useParams();
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [newStatus, setNewStatus]   = useState('');
  const [adminNote, setAdminNote]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mediaOpen, setMediaOpen]   = useState(null);   // lightbox URL

  const token = localStorage.getItem('adminToken');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/returns/admin/${id}`, { headers });
      setData(res.data);
    } catch {
      toast.error('Failed to load return details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const handleStatusUpdate = async () => {
    if (!newStatus) return toast.error('Select a status');
    setSubmitting(true);
    const tid = toast.loading('Updating…');
    try {
      await axios.patch(`/returns/admin/${id}/status`, { status: newStatus, adminNote }, { headers });
      toast.success('Status updated!', { id: tid });
      setAdminNote('');
      setNewStatus('');
      fetchDetail();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed', { id: tid });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTopColor: '#db1a5d', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!data) return <div style={{ color: '#ef4444', padding: '40px', textAlign: 'center', fontWeight: 600 }}>Return not found.</div>;

  const { returnRequest: r, refunds, reverseShipment, media } = data;
  const flow = STATUS_FLOW[r?.returnType] || STATUS_FLOW.refund;
  const currentIdx = flow.indexOf(r?.status);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '0 0 60px', fontFamily: 'Inter, sans-serif', maxWidth: '1100px' }}>

      {/* ── Back + header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Link to="/returns" style={{ color: '#4b5563', textDecoration: 'none', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          ← Back to Returns
        </Link>
        <span style={{ color: '#d1d5db' }}>|</span>
        <h2 style={{ margin: 0, color: '#111827', fontSize: '18px', fontWeight: 700 }}>
          Return #{r.id.substring(0, 8)}...
          <span style={{
            marginLeft: '12px', padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
            background: STATUS_COLORS[r.status]?.bg || '#f3f4f6',
            color: STATUS_COLORS[r.status]?.color || '#4b5563',
            fontWeight: 700,
          }}>
            {STATUS_LABELS[r.status] || r.status}
          </span>
        </h2>
        <span style={{
          marginLeft: 'auto', padding: '4px 14px', borderRadius: '20px', fontSize: '12px',
          background: r.returnType === 'refund' ? '#eff6ff' : '#f3e8ff',
          color:      r.returnType === 'refund' ? '#1d4ed8' : '#6b21a8',
          fontWeight: 700,
        }}>
          {r.returnType === 'refund' ? 'Return (Refund)' : 'Replacement'}
        </span>
      </div>

      {/* ── Stepper ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '20px 24px', marginBottom: '16px', overflowX: 'auto', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', minWidth: '600px' }}>
          {flow.map((step, idx) => {
            const done    = idx < currentIdx;
            const current = idx === currentIdx;
            
            let circleBg = '#f3f4f6';
            let circleBorder = '#d1d5db';
            let textColor = '#6b7280';
            
            if (done) {
              circleBg = '#dcfce7';
              circleBorder = '#22c55e';
              textColor = '#15803d';
            } else if (current) {
              const theme = STATUS_COLORS[step] || { bg: '#eff6ff', color: '#1d4ed8' };
              circleBg = theme.bg;
              circleBorder = theme.color;
              textColor = theme.color;
            }

            return (
              <div key={step} style={{ display: 'flex', alignItems: 'center', flex: idx < flow.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: circleBg,
                    border: `2px solid ${circleBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', color: textColor, fontWeight: 700,
                    boxShadow: current ? `0 0 10px ${circleBorder}44` : 'none',
                    transition: 'all .3s',
                  }}>
                    {done ? '✓' : idx + 1}
                  </div>
                  <span style={{ fontSize: '10px', color: textColor, fontWeight: current ? 700 : 500, textAlign: 'center', maxWidth: '80px', lineHeight: 1.3 }}>
                    {STATUS_LABELS[step]}
                  </span>
                </div>
                {idx < flow.length - 1 && (
                  <div style={{ flex: 1, height: '2px', background: done ? '#22c55e' : '#e5e7eb', margin: '0 4px', marginBottom: '22px', transition: 'background .3s' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '16px' }}>
        {/* ── Left column ── */}
        <div>
          {/* Request info */}
          <Section title="Request Details">
            <InfoRow label="Request ID"    value={`#${r.id}`} />
            <InfoRow label="Type"          value={r.returnType === 'refund' ? 'Return (Refund)' : 'Replacement'} />
            <InfoRow label="Reason"        value={r.reason ? r.reason.replace(/_/g, ' ') : ''} />
            <InfoRow label="Description"   value={r.comments || r.description} />
            <InfoRow label="Submitted"     value={fmt(r.createdAt)} />
            <InfoRow label="Last Updated"  value={fmt(r.updatedAt)} />
          </Section>

          {/* Order item */}
          <Section title="Order Item">
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <img
                src={r.orderItem?.image || FALLBACK}
                alt={r.orderItem?.productName}
                onError={e => { e.target.src = FALLBACK; }}
                style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover', background: '#f3f4f6', border: '1px solid #e5e7eb' }}
              />
              <div style={{ flex: 1 }}>
                <InfoRow label="Product"    value={r.orderItem?.productName} />
                <InfoRow label="Quantity"   value={r.orderItem?.quantity} />
                <InfoRow label="Price"      value={r.orderItem?.price ? `₹${r.orderItem.price}` : null} />
                <InfoRow label="Order ID"   value={r.orderItem?.orderId ? `ORD-${r.orderItem.orderId}` : null} />
              </div>
            </div>
          </Section>

          {/* Customer info */}
          <Section title="Customer">
            <InfoRow label="Name"     value={r.orderItem?.order?.user?.name} />
            <InfoRow label="Email"    value={r.orderItem?.order?.user?.email} />
            <InfoRow label="Phone"    value={r.orderItem?.order?.user?.phone} />
            <InfoRow label="Payment"  value={r.orderItem?.order?.paymentMethod} />
          </Section>

          {/* Reverse shipment */}
          {reverseShipment && (
            <Section title="Reverse Shipment">
              <InfoRow label="Shiprocket Order ID" value={reverseShipment.shiprocketOrderId} />
              <InfoRow label="AWB Code"            value={reverseShipment.awbCode} />
              <InfoRow label="Courier"             value={reverseShipment.courierName} />
              <InfoRow label="Status"              value={reverseShipment.status} />
              <InfoRow label="Tracking URL"
                value={reverseShipment.trackingUrl
                  ? <a href={reverseShipment.trackingUrl} target="_blank" rel="noreferrer" style={{ color: '#db1a5d', fontWeight: 600 }}>Track Shipment</a>
                  : null}
              />
              <InfoRow label="Created" value={fmt(reverseShipment.createdAt)} />
            </Section>
          )}

          {/* Refunds */}
          {refunds?.length > 0 && (
            <Section title="Refund Records">
              {refunds.map((rf, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 16px', marginBottom: '8px', background: '#f9fafb' }}>
                  <InfoRow label="Method"      value={rf.method} />
                  <InfoRow label="Amount"      value={rf.amount ? `₹${rf.amount}` : null} />
                  <InfoRow label="Status"      value={rf.status} />
                  <InfoRow label="Razorpay ID" value={rf.razorpayRefundId} />
                  <InfoRow label="Note"        value={rf.note} />
                  <InfoRow label="Initiated"   value={fmt(rf.createdAt)} />
                </div>
              ))}
            </Section>
          )}
        </div>

        {/* ── Right column ── */}
        <div>
          {/* Status update panel */}
          <Section title="Update Status">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                style={{
                  background: '#ffffff', border: '1px solid #d1d5db', color: '#111827',
                  borderRadius: '8px', padding: '10px 12px', fontSize: '13px', width: '100%',
                  outline: 'none', cursor: 'pointer',
                }}>
                <option value="">— Select next status —</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <textarea
                rows={3}
                placeholder="Admin note (optional, sent to customer email)…"
                value={adminNote} onChange={e => setAdminNote(e.target.value)}
                style={{
                  background: '#ffffff', border: '1px solid #d1d5db', color: '#111827',
                  borderRadius: '8px', padding: '10px 12px', fontSize: '13px', resize: 'vertical',
                  fontFamily: 'Inter, sans-serif', outline: 'none',
                }}
              />
              <button
                onClick={handleStatusUpdate} disabled={submitting || !newStatus}
                style={{
                  background: submitting || !newStatus ? '#e5e7eb' : '#db1a5d',
                  color: submitting || !newStatus ? '#9ca3af' : '#fff', border: 'none', borderRadius: '8px', padding: '11px',
                  fontWeight: 700, cursor: submitting || !newStatus ? 'not-allowed' : 'pointer',
                  fontSize: '14px', transition: 'background .2s',
                }}>
                {submitting ? 'Updating…' : 'Update Status'}
              </button>

              {/* Quick reject */}
              {r.status === 'pending_review' && (
                <button
                  onClick={async () => {
                    if (!window.confirm('Reject this return request?')) return;
                    setSubmitting(true);
                    const tid = toast.loading('Rejecting…');
                    try {
                      await axios.patch(`/returns/admin/${id}/status`, { status: 'rejected', adminNote }, { headers });
                      toast.success('Rejected', { id: tid });
                      fetchDetail();
                    } catch { toast.error('Failed', { id: tid }); }
                    finally { setSubmitting(false); }
                  }}
                  style={{
                    background: 'var(--danger-50)', color: 'var(--danger-600)', border: '1px solid var(--danger-border)',
                    borderRadius: '8px', padding: '10px', fontWeight: 700, cursor: 'pointer',
                    fontSize: '13px', transition: 'background .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--danger-50)'; }}
                >
                  ✕ Reject Request
                </button>
              )}
            </div>
          </Section>

          {/* Media */}
          {media?.length > 0 && (
            <Section title={`Evidence Media (${media.length})`}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {media.map((m, i) => (
                  <div key={i} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setMediaOpen(m.url || m.filePath)}>
                    {m.fileType?.startsWith('video') ? (
                      <div style={{
                        width: '100%', paddingBottom: '100%', background: '#f3f4f6', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                        border: '1px solid #e5e7eb',
                      }}>
                        <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '24px', color: '#4b5563' }}>▶</span>
                      </div>
                    ) : (
                      <img
                        src={m.url || m.filePath} alt=""
                        onError={e => { e.target.src = FALLBACK; }}
                        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'block' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Admin notes history */}
          {r.adminNotes?.length > 0 && (
            <Section title="Admin Notes">
              {r.adminNotes.map((n, i) => (
                <div key={i} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px', fontSize: '13px', color: '#374151' }}>
                  <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: '4px', fontWeight: 600 }}>{fmt(n.at)}</div>
                  {n.note}
                </div>
              ))}
            </Section>
          )}
        </div>
      </div>

      {/* ── Lightbox ── */}
      {mediaOpen && (
        <div onClick={() => setMediaOpen(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out',
        }}>
          <img src={mediaOpen} alt="evidence" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain' }} />
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
