import { useEffect, useState } from "react";
import { getShippingSettings, updateShippingSettings } from "../../redux/services/shippingService";

const initialState = {
  provider: "shiprocket",
  shiprocketEmail: "",
  shiprocketToken: "",
  autoCreateShipment: true,
  autoAssignCourier: true,
  autoGenerateAwb: true,
  defaultWeight: 0.5,
  defaultDimensions: { length: 10, breadth: 10, height: 10 },
  defaultPickupLocation: "",
};

export default function ShippingSettings({ showToast }) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getShippingSettings();
        setForm((p) => ({ ...p, ...data }));
      } catch {
        showToast.error("Failed to load shipping settings");
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const id = showToast.loading("Saving shipping settings...");
    try {
      const payload = { ...form, defaultWeight: Number(form.defaultWeight) || 0.5 };
      const data = await updateShippingSettings(payload);
      setForm((p) => ({ ...p, ...data, shiprocketToken: "" }));
      showToast.success("Shipping settings saved", id);
    } catch (err) {
      showToast.error(err?.response?.data?.message || "Failed to save shipping settings", id);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="km-loading">Loading shipping settings...</p>;

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Shipping Settings</div>
      </div>

      <form className="km-form-card" onSubmit={onSave}>
        <div className="km-form-header">
          <div className="km-form-header-icon">🚚</div>
          <div>
            <div className="km-form-header-title">Shiprocket Configuration</div>
            <div className="km-form-header-sub">Provider credentials and automation flags.</div>
          </div>
        </div>

        <div className="km-form-body">
          <div className="km-form-grid">
            <div className="km-field">
              <label className="km-label">Provider</label>
              <input className="km-input" value="shiprocket" disabled />
            </div>
            <div className="km-field">
              <label className="km-label">Shiprocket Email</label>
              <input className="km-input" value={form.shiprocketEmail || ""} onChange={(e) => setForm((p) => ({ ...p, shiprocketEmail: e.target.value }))} />
            </div>
            <div className="km-field">
              <label className="km-label">Shiprocket Token / Password</label>
              <input className="km-input" type="password" value={form.shiprocketToken || ""} onChange={(e) => setForm((p) => ({ ...p, shiprocketToken: e.target.value }))} placeholder={form.hasShiprocketToken ? "Token saved. Enter to replace" : "Enter token"} />
            </div>
            <div className="km-field">
              <label className="km-label">Default Pickup Location</label>
              <input className="km-input" value={form.defaultPickupLocation || ""} onChange={(e) => setForm((p) => ({ ...p, defaultPickupLocation: e.target.value }))} />
            </div>
            <div className="km-field">
              <label className="km-label">Default Weight (kg)</label>
              <input className="km-input" type="number" min="0" step="0.01" value={form.defaultWeight} onChange={(e) => setForm((p) => ({ ...p, defaultWeight: e.target.value }))} />
            </div>
            <div className="km-field">
              <label className="km-label">Default Dimensions (cm)</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                <input className="km-input" type="number" min="1" value={form.defaultDimensions?.length || 10} onChange={(e) => setForm((p) => ({ ...p, defaultDimensions: { ...p.defaultDimensions, length: Number(e.target.value) || 1 } }))} placeholder="L" />
                <input className="km-input" type="number" min="1" value={form.defaultDimensions?.breadth || 10} onChange={(e) => setForm((p) => ({ ...p, defaultDimensions: { ...p.defaultDimensions, breadth: Number(e.target.value) || 1 } }))} placeholder="B" />
                <input className="km-input" type="number" min="1" value={form.defaultDimensions?.height || 10} onChange={(e) => setForm((p) => ({ ...p, defaultDimensions: { ...p.defaultDimensions, height: Number(e.target.value) || 1 } }))} placeholder="H" />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
            <label><input type="checkbox" checked={!!form.autoCreateShipment} onChange={(e) => setForm((p) => ({ ...p, autoCreateShipment: e.target.checked }))} /> Auto create shipment</label>
            <label><input type="checkbox" checked={!!form.autoAssignCourier} onChange={(e) => setForm((p) => ({ ...p, autoAssignCourier: e.target.checked }))} /> Auto assign courier</label>
            <label><input type="checkbox" checked={!!form.autoGenerateAwb} onChange={(e) => setForm((p) => ({ ...p, autoGenerateAwb: e.target.checked }))} /> Auto generate AWB</label>
          </div>

          <button className="km-btn-submit" type="submit" disabled={saving} style={{ marginTop: 18 }}>
            {saving ? "Saving..." : "Save Shipping Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

