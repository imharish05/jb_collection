// StockStatusBadge.jsx
// Usage: <StockStatusBadge status="high" stock={75} settings={...} />
// status: "high" | "medium" | "low" | "out_of_stock"
// If status not passed, it's derived from stock + settings thresholds.

export const STOCK_STATUS_CONFIG = {
  high:        { label: "High Stock",   dot: "#22c55e", bg: "#dcfce7", color: "#15803d" },
  medium:      { label: "Medium Stock", dot: "#3b82f6", bg: "#dbeafe", color: "#1d4ed8" },
  low:         { label: "Low Stock",    dot: "#f97316", bg: "#ffedd5", color: "#c2410c" },
  out_of_stock:{ label: "Out Of Stock", dot: "#ef4444", bg: "#fee2e2", color: "#b91c1c" },
};

export function deriveStatus(stock, settings = {}) {
  const qty = parseInt(stock) || 0;
  const { highStockThreshold = 51, mediumStockThreshold = 11, lowStockThreshold = 1 } = settings;
  if (qty === 0) return "out_of_stock";
  if (qty >= highStockThreshold) return "high";
  if (qty >= mediumStockThreshold) return "medium";
  return "low";
}

export default function StockStatusBadge({ status, stock, settings, size = "sm" }) {
  const resolvedStatus = status || deriveStatus(stock, settings);
  const cfg = STOCK_STATUS_CONFIG[resolvedStatus] || STOCK_STATUS_CONFIG.out_of_stock;
  const dotSize = size === "sm" ? 8 : 10;
  const fontSize = size === "sm" ? 11 : 12;

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: cfg.bg, color: cfg.color,
      padding: size === "sm" ? "3px 8px" : "4px 10px",
      borderRadius: 20, fontSize, fontWeight: 600,
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: dotSize, height: dotSize, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}
