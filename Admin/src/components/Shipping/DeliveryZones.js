import { useEffect, useMemo, useState } from "react";
import DataTable from "../DataTable/DataTable";
import {
  createDeliveryZone,
  deleteDeliveryZone,
  getDeliveryZones,
  importZonePincodes,
  updateDeliveryZone,
  checkServiceability,
} from "../../redux/services/shippingService";

const emptyZone = {
  name: "",
  priority: 100,
  countries: "India",
  states: "",
  cities: "",
  shippingCharge: 0,
  freeShippingAbove: "",
  codAvailable: true,
  estimatedDays: "2-4",
};

const splitCsv = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);

export default function DeliveryZones({ showToast }) {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyZone);
  const [editingId, setEditingId] = useState(null);
  const [pinsText, setPinsText] = useState("");
  const [svcPin, setSvcPin] = useState("");
  const [svcResult, setSvcResult] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getDeliveryZones();
      setZones(Array.isArray(data) ? data : []);
    } catch {
      showToast.error("Failed to load delivery zones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      priority: Number(form.priority) || 100,
      countries: splitCsv(form.countries),
      states: splitCsv(form.states),
      cities: splitCsv(form.cities),
      shippingCharge: Number(form.shippingCharge) || 0,
      freeShippingAbove: form.freeShippingAbove === "" ? null : Number(form.freeShippingAbove),
      codAvailable: !!form.codAvailable,
      estimatedDays: form.estimatedDays || null,
    };
    const t = showToast.loading(editingId ? "Updating zone..." : "Creating zone...");
    try {
      if (editingId) await updateDeliveryZone(editingId, payload);
      else await createDeliveryZone(payload);
      showToast.success(editingId ? "Zone updated" : "Zone created", t);
      setEditingId(null);
      setForm(emptyZone);
      await load();
    } catch (err) {
      showToast.error(err?.response?.data?.message || "Failed to save zone", t);
    }
  };

  const onEdit = (z) => {
    setEditingId(z.id);
    setForm({
      name: z.name || "",
      priority: z.priority ?? 100,
      countries: (z.countries || []).join(", "),
      states: (z.states || []).join(", "),
      cities: (z.cities || []).join(", "),
      shippingCharge: z.shippingCharge ?? 0,
      freeShippingAbove: z.freeShippingAbove ?? "",
      codAvailable: !!z.codAvailable,
      estimatedDays: z.estimatedDays || "",
    });
  };

  const onDelete = async (id) => {
    const t = showToast.loading("Deleting zone...");
    try {
      await deleteDeliveryZone(id);
      showToast.success("Zone deleted", t);
      await load();
    } catch (err) {
      showToast.error(err?.response?.data?.message || "Failed to delete zone", t);
    }
  };

  const onImportPins = async () => {
    if (!editingId) return showToast.error("Select/Edit a zone first");
    const raw = pinsText.trim();
    if (!raw) return showToast.error("Enter pincodes");
    const t = showToast.loading("Importing pincodes...");
    try {
      const r = await importZonePincodes(editingId, raw);
      showToast.success(`Imported ${r.imported} pincodes`, t);
      setPinsText("");
      await load();
    } catch (err) {
      showToast.error(err?.response?.data?.message || "Import failed", t);
    }
  };

  const pinCounts = useMemo(() => Object.fromEntries(zones.map((z) => [z.id, z.pincodes?.length || 0])), [zones]);

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Delivery Zones</div>
      </div>

      <div className="km-form-card">
        <div className="km-form-header">
          <div className="km-form-header-icon">📍</div>
          <div>
            <div className="km-form-header-title">{editingId ? "Edit Zone" : "Create Zone"}</div>
            <div className="km-form-header-sub">Priority-based zone matching with pincode import.</div>
          </div>
        </div>
        <div className="km-form-body">
          <form onSubmit={onSubmit} className="km-form-grid">
            <div className="km-field"><label className="km-label">Zone Name</label><input className="km-input" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="km-field"><label className="km-label">Priority (lower is stronger)</label><input className="km-input" type="number" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} /></div>
            <div className="km-field"><label className="km-label">Countries (CSV)</label><input className="km-input" value={form.countries} onChange={(e) => setForm((p) => ({ ...p, countries: e.target.value }))} /></div>
            <div className="km-field"><label className="km-label">States (CSV)</label><input className="km-input" value={form.states} onChange={(e) => setForm((p) => ({ ...p, states: e.target.value }))} /></div>
            <div className="km-field"><label className="km-label">Cities (CSV)</label><input className="km-input" value={form.cities} onChange={(e) => setForm((p) => ({ ...p, cities: e.target.value }))} /></div>
            <div className="km-field"><label className="km-label">Estimated Days</label><input className="km-input" value={form.estimatedDays} onChange={(e) => setForm((p) => ({ ...p, estimatedDays: e.target.value }))} /></div>
            <div className="km-field"><label className="km-label">Shipping Charge</label><input className="km-input" type="number" value={form.shippingCharge} onChange={(e) => setForm((p) => ({ ...p, shippingCharge: e.target.value }))} /></div>
            <div className="km-field"><label className="km-label">Free Shipping Above</label><input className="km-input" type="number" value={form.freeShippingAbove} onChange={(e) => setForm((p) => ({ ...p, freeShippingAbove: e.target.value }))} /></div>
            <div className="km-field">
              <label className="km-label">COD</label>
              <select className="km-select" value={form.codAvailable ? "yes" : "no"} onChange={(e) => setForm((p) => ({ ...p, codAvailable: e.target.value === "yes" }))}>
                <option value="yes">Available</option>
                <option value="no">Disabled</option>
              </select>
            </div>
            <button className="km-btn-submit" type="submit">{editingId ? "Update Zone" : "Create Zone"}</button>
          </form>

          <div style={{ marginTop: 16 }}>
            <label className="km-label">Bulk Import Pincodes for selected zone</label>
            <textarea className="km-input" style={{ minHeight: 90 }} value={pinsText} onChange={(e) => setPinsText(e.target.value)} placeholder="625001, 625002 or newline separated" />
            <button className="km-btn-submit" type="button" style={{ marginTop: 10 }} onClick={onImportPins}>Import Pincodes</button>
          </div>
        </div>
      </div>

      <DataTable
        loading={loading}
        columns={["Name", "Priority", "Shipping", "Free Above", "COD", "ETA", "Pincodes", "Actions"]}
        initialRows={zones}
        renderRow={(z) => (
          <tr key={z.id}>
            <td style={{ fontWeight: 600 }}>{z.name}</td>
            <td>{z.priority}</td>
            <td>₹{Number(z.shippingCharge || 0).toFixed(2)}</td>
            <td>{z.freeShippingAbove != null ? `₹${z.freeShippingAbove}` : "—"}</td>
            <td>{z.codAvailable ? "Yes" : "No"}</td>
            <td>{z.estimatedDays || "—"}</td>
            <td>{pinCounts[z.id] || 0}</td>
            <td>
              <button className="action-btn btn-edit" onClick={() => onEdit(z)}>Edit</button>
              <button className="action-btn btn-del" onClick={() => onDelete(z.id)}>Delete</button>
            </td>
          </tr>
        )}
      />

      <div className="km-form-card" style={{ marginTop: 16 }}>
        <div className="km-form-header"><div className="km-form-header-icon">🧪</div><div><div className="km-form-header-title">Serviceability Test</div></div></div>
        <div className="km-form-body" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input className="km-input" style={{ maxWidth: 220 }} placeholder="Enter pincode" value={svcPin} onChange={(e) => setSvcPin(e.target.value)} />
          <button className="action-btn btn-edit" onClick={async () => {
            try { setSvcResult(await checkServiceability({ pincode: svcPin, orderValue: 1000, weight: 1 })); }
            catch (e) { showToast.error(e?.response?.data?.message || "Serviceability check failed"); }
          }}>Check</button>
          {svcResult && <div style={{ fontSize: 13, color: "#4b5563" }}>{svcResult.serviceable ? `Serviceable via ${svcResult.zone?.name || "zone"} · ₹${svcResult.shippingCharge} · COD ${svcResult.codAvailable ? "Yes" : "No"}` : "Not serviceable"}</div>}
        </div>
      </div>
    </div>
  );
}

