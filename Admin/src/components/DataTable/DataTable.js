import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import tableStyles from '../Dashboard/Dashboard.module.css';
import styles from './DataTable.module.css';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 500];

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

export default function DataTable({
  columns,
  initialRows = [],
  renderRow,
  loading = false,
  pageSize: defaultPageSize = DEFAULT_PAGE_SIZE,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  showPageSizeSelector = true,
}) {
  const [rows, setRows] = useState(Array.isArray(initialRows) ? initialRows : []);
  const [query, setQuery] = useState('');
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setRows(Array.isArray(initialRows) ? initialRows : []);
    setCurrentPage(1);
  }, [initialRows]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        Object.values(r).join(' ').toLowerCase().includes(query.toLowerCase())
      ),
    [rows, query]
  );

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const page = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginated = filtered.slice(startIndex, endIndex);

  const deleteRow = (id) => {
    toast(
      (t) => (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <strong>Are you sure?</strong>
          <span style={{ fontSize: 12, color: '#aaa' }}>This action cannot be undone.</span>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setRows((prev) => prev.filter((r) => r.id !== id));
              }}
              style={{ padding: '5px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 5, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
            >Delete</button>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{ padding: '5px 14px', background: '#374151', color: '#d1d5db', border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: 12 }}
            >Cancel</button>
          </div>
        </span>
      ),
      { duration: Infinity }
    );
  };

  const goToPage = (p) => {
    setCurrentPage(Math.max(1, Math.min(p, totalPages)));
  };

  const pageNumbers = getPageNumbers(page, totalPages);
  const showPagination = !loading && totalItems > 0;

  return (
    <div>
      <div className="section-header">
        <input
          className="search-input"
          placeholder="Search items..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {showPageSizeSelector && showPagination && (
          <label className={styles.pageSizeLabel}>
            Rows per page
            <select
              className={styles.pageSizeSelect}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className={tableStyles.tableCard}>
        <div style={{ overflowX: 'auto', overflowY: 'visible', WebkitOverflowScrolling: 'touch', borderRadius: '14px', border: '1.5px solid #d1d5db' }}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    {columns.map((_, j) => (
                      <td key={j}>
                        <div className={tableStyles.skeleton} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className={tableStyles.emptyRow}>
                    No items found.
                  </td>
                </tr>
              ) : (
                paginated.map((row, i) =>
                  renderRow(row, startIndex + i, deleteRow)
                )
              )}
            </tbody>
          </table>
        </div>

        {showPagination && (
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              Showing {startIndex + 1}–{endIndex} of {totalItems}
              {query ? ` (filtered from ${rows.length})` : ''}
            </span>
            <div className={styles.paginationControls}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                aria-label="Previous page"
              >
                Prev
              </button>
              <div className={styles.pageNumbers}>
                {pageNumbers.map((n, idx) =>
                  n === '…' ? (
                    <span key={`ellipsis-${idx}`} className={styles.ellipsis}>
                      …
                    </span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      className={`${styles.pageBtn} ${n === page ? styles.pageBtnActive : ''}`}
                      onClick={() => goToPage(n)}
                      aria-label={`Page ${n}`}
                      aria-current={n === page ? 'page' : undefined}
                    >
                      {n}
                    </button>
                  )
                )}
              </div>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
                aria-label="Next page"
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
