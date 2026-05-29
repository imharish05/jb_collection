import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../DataTable/DataTable';
import { fetchProducts } from '../../redux/services/productsService';
import { editVariant } from '../../redux/services/variantsService';

const pillClass = { Active: 'pill-active', Inactive: 'pill-inactive' };
const KM = { orange: '#F15A24', orangeLight: '#FEF0EB', blue: '#1A3A6B', green: '#39B54A', teal: '#00B4D8', border: '#E5E7EB', text: '#1A1A2E', muted: '#6B7280', bg: '#F9FAFB' };

function safeAttrs(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseVariantName(name) {
  if (!name || name === 'Default') return [];
  return name
    .split('·')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const [key, ...rest] = part.split(':');
      return rest.length
        ? { key: key.trim(), value: rest.join(':').trim() }
        : { key: 'Variant', value: part };
    })
    .filter(item => item.key && item.value);
}

function variantParts(row) {
  const attrs = safeAttrs(row.attributes)
    .map(attr => ({ key: attr.key, value: attr.value === 'Custom' ? attr.customValue : attr.value }))
    .filter(attr => attr.key && attr.value);

  return attrs.length ? attrs : parseVariantName(row.variantName);
}

function VariantChips({ row, chipStyle = {}, labelStyle = {}, slashStyle = {} }) {
  const parts = variantParts(row);
  if (!parts.length) return <span style={{ color: KM.muted, fontSize: 12 }}>Default variant</span>;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 720 }}>
      {parts.map((part, index) => (
        <span
          key={`${part.key}-${part.value}-${index}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 9px',
            borderRadius: 999,
            background: part.key === 'Custom Note' ? '#fff7ed' : '#f8fafc',
            border: `1px solid ${part.key === 'Custom Note' ? '#fed7aa' : KM.border}`,
            color: KM.text,
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1.2,
            ...chipStyle,
          }}
        >
          <span style={{ color: part.key === 'Custom Note' ? KM.orange : KM.blue, fontWeight: 700, ...labelStyle }}>
            {part.key}
          </span>
          <span style={{ color: KM.muted, fontWeight: 500, ...slashStyle }}>/</span>
          <span>{part.value}</span>
        </span>
      ))}
    </div>
  );
}

function variantTitle(row) {
  const parts = variantParts(row);
  return parts.length
    ? parts.map(part => `${part.key}: ${part.value}`).join(' / ')
    : (row.variantName || row.unit || 'Default variant');
}

// ── Stock Adjust Modal ──────────────────────────────────────────────────────
function StockModal({ variant, onClose, onDone, showToast }) {
  const dispatch = useDispatch();
  const [mode, setMode] = useState('add');
  const [qty, setQty] = useState('');
  const [busy, setBusy] = useState(false);

  const currentStock = variant.stock ?? 0;
  const parsed = parseInt(qty) || 0;
  const preview = mode === 'add' ? currentStock + parsed : currentStock - parsed;
  const invalid = mode === 'reduce' && parsed > currentStock;

  const handleSave = async () => {
    if (!parsed || parsed <= 0) { showToast.error('Enter a valid quantity'); return; }
    if (invalid) { showToast.error('Cannot reduce more than current stock'); return; }
    setBusy(true);
    const toastId = showToast.loading(mode === 'add' ? 'Adding stock…' : 'Reducing stock…');
    try {
      await dispatch(editVariant({ id: variant.id, data: { stock: preview } }));
      showToast.success(mode === 'add' ? ` Added ${parsed} units` : `Reduced ${parsed} units`, toastId);
      onDone(variant.id, preview);
      onClose();
    } catch (err) {
      showToast.error(err?.response?.data?.message || err?.message || 'Update failed', toastId);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 'min(520px, 100%)', overflow: 'hidden', boxShadow: '0 24px 70px rgba(15,23,42,0.28)' }}>
        <div style={{ background: KM.blue, padding: '18px 22px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>Adjust Stock</div>
            <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, marginTop: 6, fontWeight: 600 }}>
              {variant.productName || `Product #${variant.productId}`} —{' '}
            </div>
            <div style={{ marginTop: 10 }}>
              <VariantChips
                row={variant}
                chipStyle={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff' }}
                labelStyle={{ color: '#bfdbfe' }}
                slashStyle={{ color: 'rgba(255,255,255,0.45)' }}
              />
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            <div style={{ flex: 1, background: KM.bg, borderRadius: 8, padding: '10px 14px', textAlign: 'center', border: `1px solid ${KM.border}` }}>
              <div style={{ fontSize: 11, color: KM.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Current Stock</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: KM.text }}>{currentStock}</div>
            </div>
            <div style={{ flex: 1, background: invalid ? '#fff5f5' : '#f0fdf4', borderRadius: 8, padding: '10px 14px', textAlign: 'center', border: `1px solid ${invalid ? '#fecaca' : '#bbf7d0'}` }}>
              <div style={{ fontSize: 11, color: KM.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>After Update</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: invalid ? '#dc2626' : KM.green }}>{parsed ? preview : '—'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['add', 'reduce'].map(m => (
              <button key={m} onClick={() => { setMode(m); setQty(''); }}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: `1.5px solid ${mode === m ? (m === 'add' ? KM.green : KM.orange) : KM.border}`, background: mode === m ? (m === 'add' ? '#f0fdf4' : KM.orangeLight) : '#fff', color: mode === m ? (m === 'add' ? KM.green : KM.orange) : KM.muted, fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all .15s' }}>
                {m === 'add' ? '＋ Add Stock' : '－ Reduce Stock'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: KM.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quantity to {mode === 'add' ? 'Add' : 'Reduce'}
            </label>
            <input
              style={{ padding: '9px 12px', border: `1px solid ${invalid ? '#fca5a5' : KM.border}`, borderRadius: 8, fontSize: 16, fontWeight: 600, color: KM.text, background: '#fff', fontFamily: 'inherit', outline: 'none' }}
              type="number" min="1" placeholder="0" value={qty} onChange={e => setQty(e.target.value)} />
            {invalid && <span style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>Cannot reduce more than current stock ({currentStock})</span>}
          </div>
          <button onClick={handleSave} disabled={busy || !parsed || parsed <= 0 || invalid}
            style={{ width: '100%', marginTop: 16, padding: 12, background: mode === 'add' ? KM.green : KM.orange, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: (busy || !parsed || invalid) ? 0.6 : 1 }}>
            {busy ? 'Saving…' : mode === 'add' ? `Add ${parsed || 0} Units` : `Reduce ${parsed || 0} Units`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function Stock({ showToast }) {
  const dispatch = useDispatch();
  const { items: products, loading } = useSelector(state => state.products);
  const [stockModal, setStockModal] = useState(null);
  // Flatten products → variant rows locally (no separate stock slice needed)
  const [rows, setRows] = useState([]);

  useEffect(() => {
    dispatch(fetchProducts())
  }, []);

  // Rebuild flat rows whenever products change
  useEffect(() => {
    const stockRows = [];
    products.forEach(product => {
      (product.Variants || []).forEach(variant => {
        stockRows.push({
          id: variant.id,
          productId: product.id,
          productName : product.name,
          variantName: variant.variantName,
          attributes: variant.attributes,
          stock: Number(variant.stock) || 0,
          soldQuantity: variant.soldQuantity || 0,
          status: Number(variant.stock) > 0 ? 'Active' : 'Inactive',
          
        });
      });
    });
    setRows(stockRows);
  }, [products]);

  const handleStockUpdated = (variantId, newStock) => {
    setRows(prev => prev.map(r =>
      r.id === variantId
        ? { ...r, stock: newStock, status: newStock > 0 ? 'Active' : 'Inactive' }
        : r
    ));
  };

  return (
    <div>
      {stockModal && (
        <StockModal
          variant={stockModal}
          onClose={() => setStockModal(null)}
          onDone={handleStockUpdated}
          showToast={showToast}
        />
      )}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="section-title">Stock Management</div>
      </div>
      {loading ? (
        <p className="km-loading">Loading...</p>
      ) : (
        <DataTable
          columns={['No.', 'Product', 'Variant', 'Stock', 'Status', 'Actions']}
          initialRows={rows}
          renderRow={(row,i) => {
            const lowStock = row.stock <= 5;
            return (
              <tr key={row.id}>
                <td style={{ fontWeight: 600, color: KM.muted }}>{i+1}</td>
                <td style={{ fontWeight: 600 }}>{row.productName || `ID: ${row.productId}`}</td>
                <td>
                  <VariantChips row={row} />
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, color: row.stock === 0 ? '#dc2626' : lowStock ? '#ea580c' : KM.text }}>
                      {row.stock}
                    </span>
                    {row.stock === 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: 20, whiteSpace: 'nowrap' }}>Out of Stock</span>
                    )}
                    {row.stock > 0 && lowStock && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: '#fff7ed', color: '#ea580c', padding: '2px 6px', borderRadius: 20, whiteSpace: 'nowrap' }}>Low</span>
                    )}
                  </div>
                </td>
                <td><span className={`status-pill ${pillClass[row.status] || 'pill-inactive'}`}>{row.status}</span></td>
                <td>
                  <button onClick={() => setStockModal(row)}
                    style={{ padding: '5px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, color: KM.green, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    ± Stock
                  </button>
                </td>
              </tr>
            );
          }}
        />
      )}
    </div>
  );
}
