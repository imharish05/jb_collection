// InventorySettingsModal.jsx
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { saveInventorySettings } from "../../redux/services/notificationsService";

const FieldRow = ({ label, value, onChange, readOnly, hint }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
      {label}
    </label>
    <input
      type="number"
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      min={0}
      style={{
        width: "100%", padding: "9px 12px", borderRadius: 8,
        border: "1px solid #e5e7eb", fontSize: 14, fontWeight: 600,
        color: readOnly ? "#9ca3af" : "#111827",
        background: readOnly ? "#f9fafb" : "#fff",
        outline: "none", boxSizing: "border-box",
        cursor: readOnly ? "not-allowed" : "text",
      }}
    />
    {hint && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#6b7280" }}>{hint}</p>}
  </div>
);

export default function InventorySettingsModal({ onClose }) {
  const dispatch = useDispatch();
  const settings = useSelector(s => s.notifications.settings);

  const [high,   setHigh]   = useState(settings.highStockThreshold   ?? 51);
  const [medium, setMedium] = useState(settings.mediumStockThreshold  ?? 11);
  const [low,    setLow]    = useState(settings.lowStockThreshold     ?? 1);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  useEffect(() => {
    setHigh(settings.highStockThreshold   ?? 51);
    setMedium(settings.mediumStockThreshold ?? 11);
    setLow(settings.lowStockThreshold     ?? 1);
  }, [settings]);

  const validate = () => {
    if (parseInt(low) <= 0)               return "Low threshold must be greater than 0";
    if (parseInt(medium) <= parseInt(low))  return "Medium threshold must be greater than Low";
    if (parseInt(high) <= parseInt(medium)) return "High threshold must be greater than Medium";
    return "";
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setSaving(true);
    const ok = await dispatch(saveInventorySettings({
      highStockThreshold:   parseInt(high),
      mediumStockThreshold: parseInt(medium),
      lowStockThreshold:    parseInt(low),
    }));
    setSaving(false);
    if (ok) onClose();
  };

  const highN   = parseInt(high)   || 0;
  const mediumN = parseInt(medium) || 0;
  const lowN    = parseInt(low)    || 0;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 10000, padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 420,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px", borderBottom: "1px solid #f3f4f6",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827" }}>Inventory Alert Settings</h3>
              <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>Configure global stock thresholds</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Preview bands */}
        <div style={{ padding: "12px 22px 0", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { label: `High Stock`, hint: `≥ ${highN}`, dot: "#22c55e", bg: "#dcfce7", color: "#15803d" },
            { label: `Medium`,     hint: `${mediumN}–${highN - 1}`, dot: "#3b82f6", bg: "#dbeafe", color: "#1d4ed8" },
            { label: `Low`,        hint: `${lowN}–${mediumN - 1}`, dot: "#f97316", bg: "#ffedd5", color: "#c2410c" },
            { label: `Out`,        hint: `= 0`, dot: "#ef4444", bg: "#fee2e2", color: "#b91c1c" },
          ].map(b => (
            <span key={b.label} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: b.bg, color: b.color, fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: b.dot }} />
              {b.label}: {b.hint}
            </span>
          ))}
        </div>

        {/* Form */}
        <div style={{ padding: "16px 22px 0" }}>
          <FieldRow label="High Stock Threshold" value={high} onChange={e => setHigh(e.target.value)}
            hint={`Stock ≥ ${high} → High Stock`} />
          <FieldRow label="Medium Stock Threshold" value={medium} onChange={e => setMedium(e.target.value)}
            hint={`Stock ${medium} – ${highN - 1} → Medium Stock`} />
          <FieldRow label="Low Stock Threshold" value={low} onChange={e => setLow(e.target.value)}
            hint={`Stock ${low} – ${mediumN - 1} → Low Stock`} />
          <FieldRow label="Out Of Stock" value={0} readOnly hint="Stock = 0 → Out Of Stock" />

          {error && (
            <div style={{ background: "#fee2e2", color: "#b91c1c", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 500, marginBottom: 12 }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, padding: "12px 22px 20px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: "9px 20px", borderRadius: 8, border: "none",
            background: saving ? "#9ca3af" : "linear-gradient(135deg,#667eea,#764ba2)",
            color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {saving && <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />}
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
