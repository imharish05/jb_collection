// StockStatusLegend.jsx
import { STOCK_STATUS_CONFIG } from "./StockStatusBadge";

const ORDER = ["high", "medium", "low", "out_of_stock"];

export default function StockStatusLegend({ compact = false }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", flexWrap: "wrap",
      gap: compact ? "8px 12px" : "6px 16px",
    }}>
      {ORDER.map((key, i) => {
        const cfg = STOCK_STATUS_CONFIG[key];
        return (
          <span key={key} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 500, color: "#6b7280" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot }} />
            {cfg.label}
            {i < ORDER.length - 1 && !compact && (
              <span style={{ color: "#d1d5db", marginLeft: 4 }}>|</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
