import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../DataTable/DataTable';
import { fetchReviews, approveReview, rejectReview, removeReview } from '../../redux/services/reviewsService';

const pillClass = { Approved: 'pill-approved', Pending: 'pill-pending', Rejected: 'pill-rejected' };

function renderStars(rating) {
  const filled = Math.round(rating);
  return '★'.repeat(filled) + '☆'.repeat(5 - filled) + ` (${rating})`;
}

export default function Reviews({ showToast }) {
  const dispatch = useDispatch();
  const { items: rows, loading } = useSelector(state => state.reviews);

  useEffect(() => {
    const id = showToast.loading('Loading reviews…', { id: 'reviews-load' });
    dispatch(fetchReviews())
      .then(() => showToast.success('Reviews loaded', id))
      .catch((err) => showToast.error(err?.response?.data?.message || err?.message || 'Failed to load reviews', id));
  }, []);

  const handleApprove = async (id) => {
    const toastId = showToast.loading('Approving review…');
    try {
      await dispatch(approveReview(id));
      showToast.success('✅ Review approved!', toastId);
    } catch (err) { showToast.error(err?.response?.data?.message || err?.message || 'Failed to approve', toastId); }
  };

  const handleReject = async (id) => {
    const toastId = showToast.loading('Rejecting review…');
    try {
      await dispatch(rejectReview(id));
      showToast.success('Review rejected.', toastId);
    } catch (err) { showToast.error(err?.response?.data?.message || err?.message || 'Failed to reject', toastId); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    const toastId = showToast.loading('Deleting review…');
    try {
      await dispatch(removeReview(id));
      showToast.success('🗑️ Review deleted', toastId);
    } catch (err) { showToast.error(err?.response?.data?.message || err?.message || 'Failed to delete', toastId); }
  };

  return (
    <div>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="section-title">Customer Reviews</div>
      </div>
      {loading ? (
        <p style={{ padding: 20, color: '#6B7280' }}>Loading reviews...</p>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>No reviews yet</div>
        </div>
      ) : (
        <DataTable
          columns={['ID', 'Customer', 'Feedback', 'Rating', 'Status', 'Actions']}
          initialRows={rows}
          renderRow={(row) => (
            <tr key={row.id}>
              <td style={{ fontWeight: 600, color: '#6B7280' }}>#{row.id}</td>
              <td style={{ fontWeight: 600 }}>{row.Customer?.name || row.guestName || 'Guest'}</td>
              <td style={{ maxWidth: 300, color: '#374151', fontSize: 13 }}>{row.feedback}</td>
              <td style={{ color: '#F59E0B', fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' }}>{renderStars(row.rating)}</td>
              <td><span className={`status-pill ${pillClass[row.status]}`}>{row.status}</span></td>
              <td>
                <div style={{ display: 'flex', gap: 6 }}>
                  {row.status !== 'Approved' && (
                    <button className="action-btn btn-approve" onClick={() => handleApprove(row.id)}>Approve</button>
                  )}
                  {row.status !== 'Rejected' && (
                    <button onClick={() => handleReject(row.id)}
                      style={{ padding: '5px 10px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 6, color: '#EA580C', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Reject
                    </button>
                  )}
                  <button className="action-btn btn-del" onClick={() => handleDelete(row.id)}>Delete</button>
                </div>
              </td>
            </tr>
          )}
        />
      )}
    </div>
  );
}
