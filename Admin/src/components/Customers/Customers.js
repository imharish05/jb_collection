import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../DataTable/DataTable';
import { fetchCustomers } from '../../redux/services/customersService';

export default function Customers({ showToast }) {
  const dispatch = useDispatch();
  const { items: rows, loading } = useSelector(state => state.customers);

  useEffect(() => {
    dispatch(fetchCustomers())
  }, []);

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Customer Directory</div>
      </div>
      {loading ? (
        <p className="km-loading">Loading customers...</p>
      ) : (
        <DataTable
          columns={['No.', 'Customer Name', 'Phone Number', 'Email Address']}
          initialRows={rows}
          renderRow={(row,i) => (
            <tr key={row.id}>
              <td className="td-id" style={{ width: '80px' }}>{i+1}</td>
              <td style={{ fontWeight: '600' }}>{row.name}</td>
              <td>{row.phone || '—'}</td>
              <td className="td-muted">{row.email || '—'}</td>
            </tr>
          )}
        />
      )}
    </div>
  );
}
