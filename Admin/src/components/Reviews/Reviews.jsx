import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../DataTable/DataTable';
import { fetchReviews, approveReview, rejectReview, removeReview } from '../../redux/services/reviewsService';
import { confirmDelete } from '../../utils/sweetalert';
import { hasPermission } from '../../utils/authHelper';

const pillClass = { Approved: 'pill-approved', Pending: 'pill-pending', Rejected: 'pill-rejected' };

function renderStars(rating) {
  const filled = Math.round(rating);
  return '★'.repeat(filled) + '☆'.repeat(5 - filled) + ` (${rating})`;
}

export default function Reviews() {
  const dispatch = useDispatch();
  const { items: rows, loading } = useSelector(state => state.reviews);

  useEffect(() => {
    dispatch(fetchReviews());
  }, [dispatch]);

  const handleApprove = async (id) => {
    try {
      await dispatch(approveReview(id));
    } catch (err) {
      console.error('Failed to approve review:', err);
    }
  };

  const handleReject = async (id) => {
    try {
      await dispatch(rejectReview(id));
    } catch (err) {
      console.error('Failed to reject review:', err);
    }
  };

  const handleDelete = async (id) => {
    confirmDelete({
      title: 'Delete Review?',
      message: 'Are you sure you want to delete this review? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await dispatch(removeReview(id));
        } catch (err) {
          console.error('Failed to delete review:', err);
        }
      },
    });
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
          columns={(() => {
            const cols = ['ID', 'Customer', 'Item', 'Feedback', 'Rating', 'Status'];
            if (hasPermission('reviews_edit') || hasPermission('reviews_delete')) cols.push('Actions');
            return cols;
          })()}
          initialRows={rows}
          renderRow={(row) => (
            <tr key={row.id}>
              <td style={{ fontWeight: 600, color: '#6B7280' }}>#{row.id}</td>
              <td style={{ fontWeight: 600 }}>{row.Customer?.name || row.guestName || 'Guest'}</td>
              <td style={{ fontSize: 12, color: '#374151' }}>
                {row.childCombo ? (
                  <>
                    <span style={{ fontWeight: 700, color: '#F15A24' }}>Combo</span>
                    <div>{row.childCombo.name}</div>
                  </>
                ) : row.product ? (
                  <>
                    <span style={{ fontWeight: 700, color: '#1A3A6B' }}>Product</span>
                    <div>{row.product.name}</div>
                  </>
                ) : '—'}
              </td>
              <td style={{ maxWidth: 300, color: '#374151', fontSize: 13 }}>{row.feedback}</td>
              <td style={{ color: '#F59E0B', fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' }}>{renderStars(row.rating)}</td>
              <td><span className={`status-pill ${pillClass[row.status]}`}>{row.status}</span></td>
              {(hasPermission('reviews_edit') || hasPermission('reviews_delete')) && (
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {hasPermission('reviews_edit') && row.status !== 'Approved' && (
                      <button className="action-btn btn-approve" onClick={() => handleApprove(row.id)}>Approve</button>
                    )}
                    {hasPermission('reviews_edit') && row.status !== 'Rejected' && (
                      <button onClick={() => handleReject(row.id)}
                        style={{ padding: '5px 10px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 6, color: '#EA580C', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Reject
                      </button>
                    )}
                    {hasPermission('reviews_delete') && (
                      <button className="action-btn btn-del" onClick={() => handleDelete(row.id)}>Delete</button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          )}
        />
      )}
    </div>
  );
}
