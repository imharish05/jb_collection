// NotificationDropdown.jsx
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchNotifications,
  doMarkAllRead,
  doClearAll,
  fetchInventorySummary,
  fetchInventorySettings,
} from "../../redux/services/notificationsService";
import { markItemRead } from "../../redux/slices/notificationsSlice";
import { STOCK_STATUS_CONFIG } from "./StockStatusBadge";
import InventorySettingsModal from "./InventorySettingsModal";

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const TYPE_ICONS = {
  order:        { icon: "🛒", color: "#3b82f6" },
  stock_high:   { icon: "🟢", color: "#22c55e" },
  stock_medium: { icon: "🔵", color: "#3b82f6" },
  stock_low:    { icon: "🟠", color: "#f97316" },
  stock_out:    { icon: "🔴", color: "#ef4444" },
};

const SUMMARY_ROWS = [
  { key: "high",        label: "High Stock",   dot: "#22c55e" },
  { key: "medium",      label: "Medium Stock", dot: "#3b82f6" },
  { key: "low",         label: "Low Stock",    dot: "#f97316" },
  { key: "out_of_stock",label: "Out Of Stock", dot: "#ef4444" },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function NotificationDropdown({ onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, unreadCount, loading, summary, summaryLoading } =
    useSelector(s => s.notifications);
  const [showSettings, setShowSettings] = useState(false);
  const [limit, setLimit] = useState(20);
  const ref = useRef(null);

  // Handle notification click - redirect based on type
  const handleNotificationClick = (notification) => {
    // Mark as read
    dispatch(markItemRead(notification.id));

    // Redirect based on notification type
    if (notification.type === "order") {
      navigate("/orders_pending");
    } else if (
      notification.type === "stock_high" ||
      notification.type === "stock_medium" ||
      notification.type === "stock_low" ||
      notification.type === "stock_out"
    ) {
      navigate("/stock");
    }

    // Close the notification dropdown
    onClose();
  };

  // Load on mount — fetch 20 so the full unread list is visible
  useEffect(() => {
    dispatch(fetchNotifications(20, true));
    dispatch(fetchInventorySummary());
    dispatch(fetchInventorySettings());
    return () => {
      // Reset limit back to 5 when dropdown closes
      dispatch(fetchNotifications(5));
    };
  }, []);

  const handleLoadMore = () => {
    const newLimit = limit + 20;
    setLimit(newLimit);
    dispatch(fetchNotifications(newLimit, true));
  };

  // Close on outside click — but not when the settings modal is open
  useEffect(() => {
    const handler = (e) => {
      if (showSettings) return;
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, showSettings]);

  const handleMarkAllRead = () => dispatch(doMarkAllRead());
  const handleClearAll = () => dispatch(doClearAll());

  const badgeStr = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <>
      <div ref={ref} style={{
        position: "absolute", top: "calc(100% + 10px)", right: 0,
        width: 380, maxHeight: 600, background: "#fff",
        borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        border: "1px solid #f0f0f0", zIndex: 9999, overflow: "hidden",
        display: "flex", flexDirection: "column",
        fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
      }}>
        {/* ── Header ── */}
        <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🔔</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{
                  background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700,
                  padding: "2px 7px", borderRadius: 20, lineHeight: 1.4,
                }}>
                  {badgeStr}
                </span>
              )}
            </div>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 2 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ overflowY: "auto", flex: 1 }}>

          {/* Inventory Summary */}
          {/* <div style={{ padding: "12px 18px", borderBottom: "1px solid #f3f4f6" }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Inventory Summary
            </p>
            {summaryLoading ? (
              <div style={{ fontSize: 12, color: "#9ca3af" }}>Loading…</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
                {SUMMARY_ROWS.map(row => (
                  <div key={row.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: row.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginLeft: "auto" }}>
                      {summary[row.key] ?? 0}
                    </span>
                  </div>
                ))}
                <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 6, paddingTop: 4, borderTop: "1px solid #f3f4f6", marginTop: 2 }}>
                  <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Total Variants</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginLeft: "auto" }}>{summary.total ?? 0}</span>
                </div>
              </div>
            )}
          </div> */}

          {/* Notifications List */}
          <div style={{ padding: "12px 18px 0" }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Recent Alerts
            </p>

            {loading ? (
              <div style={{ padding: "16px 0", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Loading…</div>
            ) : items.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#374151" }}>No notifications available</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>You're all caught up.</p>
              </div>
            ) : (
              items.map(n => {
                const { icon, color } = TYPE_ICONS[n.type] || { icon: "📣", color: "#6b7280" };
                const lines = n.message.split("\n");
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      display: "flex", gap: 10, padding: "10px 0",
                      borderBottom: "1px solid #f9fafb", position: "relative",
                      cursor: "pointer", transition: "background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {/* Unread dot */}
                    {!n.isRead && (
                      <span style={{
                        position: "absolute", right: 0, top: 12,
                        width: 7, height: 7, borderRadius: "50%", background: "#ef4444",
                      }} />
                    )}
                    {/* Icon */}
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: color + "18", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16,
                    }}>
                      {icon}
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#111827" }}>{n.title}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280", lineHeight: 1.5, wordBreak: "break-word" }}>
                        {lines[0]}
                      </p>
                      {lines[1] && (
                        <p style={{ margin: "1px 0 0", fontSize: 11, color: "#9ca3af" }}>{lines[1]}</p>
                      )}
                      <p style={{ margin: "4px 0 0", fontSize: 10, color: "#d1d5db", fontWeight: 500 }}>
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ borderTop: "1px solid #f3f4f6", padding: "10px 18px", flexShrink: 0, display: "flex", flexDirection: "column", gap: 6 }}>

          {/* Load More — show when fetched items might be less than total unread */}
          {items.length >= limit && (
            <button
              onClick={(e) => { e.stopPropagation(); handleLoadMore(); }}
              disabled={loading}
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 8,
                border: "1px solid #e5e7eb", background: "#f9fafb",
                color: "#374151", fontSize: 12, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Loading…" : `Load More (${items.length} shown)`}
            </button>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Inventory Alert Settings
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={handleMarkAllRead}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Mark All Read
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleClearAll(); }}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #fca5a5", background: "#fff", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Clear Read
            </button>
          </div>
        </div>
      </div>

      {showSettings && <InventorySettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}