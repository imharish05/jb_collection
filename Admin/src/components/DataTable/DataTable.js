import { useState, useEffect } from 'react';
import styles from '../Dashboard/Dashboard.module.css';

export default function DataTable({ columns, initialRows = [], renderRow, loading = false }) {
  const [rows, setRows] = useState(Array.isArray(initialRows) ? initialRows : []);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setRows(Array.isArray(initialRows) ? initialRows : []);
  }, [initialRows]);

  const filtered = rows.filter((r) =>
    Object.values(r).join(' ').toLowerCase().includes(query.toLowerCase())
  );

  const deleteRow = (id) => {
    if (window.confirm('Are you sure?')) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div>
      {/* Search Section using global classes from your CSS */}
      <div className="section-header">
        <input
          className="search-input"
          placeholder="Search items..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Table Wrapper matching Dashboard.module.css */}
      
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              /* 1. Loading State: Matches Dashboard skeleton logic */
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  {columns.map((_, j) => (
                    <td key={j}>
                      <div className={styles.skeleton} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              /* 2. Empty State: Matches styles.emptyRow from Dashboard */
              <tr>
                <td colSpan={columns.length} className={styles.emptyRow}>
                  No items found.
                </td>
              </tr>
            ) : (
              /* 3. Data State: Uses the provided renderRow function */
              filtered.map((row, i) => renderRow(row, i, deleteRow))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}