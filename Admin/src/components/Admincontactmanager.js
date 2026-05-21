import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from './DataTable/DataTable';
import toast from 'react-hot-toast';
import { fetchContacts, removeContact } from '../redux/services/contactsService';

const KM = { orange: '#F15A24', blue: '#1A3A6B', teal: '#00B4D8', text: '#1A1A2E', muted: '#6B7280', border: '#E5E7EB' };
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function AdminContacts() {
  const dispatch = useDispatch();
  const { items: contacts, loading, error } = useSelector(state => state.contacts);

  useEffect(() => { dispatch(fetchContacts()); }, []);

  const deleteContact = async (id) => {
    if (!window.confirm('Delete this contact request permanently?')) return;
    try {
      await dispatch(removeContact(id))
      toast.success('Contact deleted');
    } catch {
      toast.error('Failed to delete contact');
    }
  };

  if (loading) return <p style={{ padding: 20, color: KM.muted }}>Loading contacts...</p>;
  if (error) return <p style={{ padding: 20, color: '#ef4444' }}>{error}</p>;

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Contact Requests</div>
        <span className="km-count-badge">{contacts.length}</span>
      </div>
      {contacts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: KM.muted }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📬</div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>No contact requests yet</div>
        </div>
      ) : (
        <DataTable
          columns={['#ID', 'Name', 'Email', 'Phone', 'Message', 'Date', 'Actions']}
          initialRows={contacts}
          renderRow={(c) => (
            <tr key={c.id}>
              <td className="td-id">#{c.id}</td>
              <td style={{ fontWeight: 600 }}>{c.name}</td>
              <td className="td-muted">{c.email}</td>
              <td>{c.phone || '—'}</td>
              <td style={{ maxWidth: 260, fontSize: 13, color: '#374151' }}>{c.message}</td>
              <td className="td-muted">{fmtDate(c.createdAt)}</td>
              <td>
                <button className="action-btn btn-del" onClick={() => deleteContact(c.id)}>Delete</button>
              </td>
            </tr>
          )}
        />
      )}
    </div>
  );
}
