// Admin/src/components/Combos/NewCombos.js
import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchRootCombos, fetchRootComboById,
  createRootCombo, updateRootComboAction, deleteRootCombo,
  createChildCombo, updateChildCombo, deleteChildCombo,
  addChildProduct, removeChildProduct,
} from "../../redux/services/newComboService";
import { fetchProducts } from "../../redux/services/productsService";
import { confirmDelete } from "../../utils/sweetalert";

const IMG_URL = process.env.REACT_APP_IMG_URL || "";

function getImg(p) {
  if (!p) return null;
  if (p.startsWith("http")) return p;
  return `${IMG_URL}/uploads/${p.replace(/^\//, "").replace(/^uploads\//, "")}`;
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const KM = {
  orange: "#F15A24", orangeLight: "#FEF0EB", blue: "#1A3A6B",
  green: "#39B54A", border: "#E5E7EB", text: "#1A1A2E",
  muted: "#6B7280", bg: "#F9FAFB", teal: "#00B4D8",
};
const field = { display: "flex", flexDirection: "column", gap: 5 };
const lbl   = { fontSize: 11, fontWeight: 500, color: KM.muted, textTransform: "uppercase", letterSpacing: "0.05em" };
const inp   = {
  padding: "9px 12px", border: `1px solid ${KM.border}`, borderRadius: 8,
  fontSize: 13, color: KM.text, background: "#fff", fontFamily: "inherit",
  outline: "none", width: "100%", boxSizing: "border-box",
};

// ── Image Upload Widget ────────────────────────────────────────────────────────
function ImageUpload({ preview, onChange, onClear }) {
  const ref = useRef();
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <div
        onClick={() => ref.current.click()}
        style={{
          width: 80, height: 80, border: `2px dashed ${KM.teal}`, borderRadius: 10,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", cursor: "pointer", background: "#F0FAFE", flexShrink: 0,
        }}
      >
        <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={onChange} />
        <span style={{ fontSize: 20 }}>➕</span>
        <span style={{ fontSize: 10, color: KM.teal, fontWeight: 600, marginTop: 2 }}>Upload</span>
      </div>
      {preview && (
        <div style={{ position: "relative", width: 80, height: 80, borderRadius: 10, overflow: "hidden", border: `1px solid ${KM.border}` }}>
          <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <button type="button" onClick={onClear}
            style={{ position: "absolute", top: 4, right: 4, background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", fontSize: 10 }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ── Toggle Button (Fixed / Mix & Match) ───────────────────────────────────────
function TypeToggle({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 0, border: `1px solid ${KM.border}`, borderRadius: 8, overflow: "hidden" }}>
      {["fixed", "mix_match"].map(t => (
        <button key={t} type="button" onClick={() => onChange(t)}
          style={{
            flex: 1, padding: "9px 0", border: "none", cursor: "pointer", fontFamily: "inherit",
            fontSize: 12, fontWeight: 600, transition: "background 0.15s",
            background: value === t ? KM.orange : "#fff",
            color: value === t ? "#fff" : KM.muted,
          }}>
          {t === "fixed" ? "Fixed" : "Mix & Match"}
        </button>
      ))}
    </div>
  );
}

// ── Product + Variant Picker Row ───────────────────────────────────────────────
// Identical visual style to existing Combos page product selector
function ProductPickerRow({ allProducts, onAdd, label = "Included Products" }) {
  const [search, setSearch]     = useState("");
  const [selProd, setSelProd]   = useState(null);
  const [selVar,  setSelVar]    = useState("");
  const [qty,     setQty]       = useState(1);
  const [open,    setOpen]      = useState(false);
  const dropRef = useRef();

  const filtered = allProducts.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 40);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAdd = () => {
    if (!selProd) return;
    onAdd({
      productId: selProd.id,
      variantId: selVar || null,
      quantity: qty,
    });
    setSelProd(null); setSelVar(""); setQty(1); setSearch("");
  };

  const variants = selProd?.Variants || [];

  return (
    <div style={{ border: `1px solid ${KM.border}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ background: KM.bg, padding: "10px 14px", borderBottom: `1px solid ${KM.border}` }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: KM.text }}>{label}</span>
      </div>
      <div style={{ padding: "12px 14px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        {/* Product dropdown */}
        <div style={{ flex: "1 1 200px", position: "relative" }} ref={dropRef}>
          <label style={lbl}>Product</label>
          <input style={{ ...inp, marginTop: 5 }}
            placeholder="Search product…"
            value={selProd ? selProd.name : search}
            onFocus={() => setOpen(true)}
            onChange={e => { setSearch(e.target.value); setSelProd(null); setOpen(true); }}
          />
          {open && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 200,
              background: "#fff", border: `1px solid ${KM.border}`, borderRadius: 8,
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)", maxHeight: 200, overflowY: "auto", marginTop: 2,
            }}>
              {filtered.length === 0
                ? <div style={{ padding: 12, color: KM.muted, fontSize: 12 }}>No products found</div>
                : filtered.map(p => {
                    const img = Array.isArray(p.image) ? p.image[0] : p.image;
                    return (
                      <div key={p.id} onClick={() => { setSelProd(p); setSelVar(""); setOpen(false); setSearch(""); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                          cursor: "pointer", borderBottom: `1px solid ${KM.border}`,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = KM.bg}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        {img
                          ? <img src={getImg(img)} alt="" width={28} height={28} style={{ borderRadius: 4, objectFit: "cover" }} />
                          : <div style={{ width: 28, height: 28, borderRadius: 4, background: KM.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🎁</div>
                        }
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: KM.text }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: KM.muted }}>₹{p.price} · {p.Variants?.length || 0} variants</div>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          )}
        </div>

        {/* Variant dropdown — only shown after product selected */}
        {selProd && variants.length > 0 && (
          <div style={{ flex: "1 1 160px" }}>
            <label style={lbl}>Variant</label>
            <select style={{ ...inp, marginTop: 5 }} value={selVar} onChange={e => setSelVar(e.target.value)}>
              <option value="">Any / No variant</option>
              {variants.map(v => (
                <option key={v.id} value={v.id}>{v.variantName} — ₹{v.salesPrice}</option>
              ))}
            </select>
          </div>
        )}

        {/* Quantity */}
        <div style={{ flex: "0 0 80px" }}>
          <label style={lbl}>Qty</label>
          <input type="number" min={1} style={{ ...inp, marginTop: 5 }}
            value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
        </div>

        <button type="button" onClick={handleAdd}
          disabled={!selProd}
          style={{
            padding: "9px 18px", background: selProd ? KM.teal : "#d1d5db", color: "#fff",
            border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600,
            cursor: selProd ? "pointer" : "not-allowed", fontFamily: "inherit", flexShrink: 0,
          }}>
          + Add
        </button>
      </div>
    </div>
  );
}

// ── Product List (shows added products) ───────────────────────────────────────
function ProductList({ products, allProducts, onRemove }) {
  if (!products || products.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
      {products.map(cp => {
        const prod = cp.product || allProducts.find(p => p.id === cp.productId);
        const variant = cp.variant || prod?.Variants?.find(v => String(v.id) === String(cp.variantId));
        const img = Array.isArray(prod?.image) ? prod?.image[0] : prod?.image;
        const stock = variant ? variant.stock : prod?.stock ?? 0;
        const price = variant ? parseFloat(variant.salesPrice) : parseFloat(prod?.price || 0);

        return (
          <div key={cp.id}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
              background: "#fff", border: `1px solid ${KM.border}`, borderRadius: 8,
            }}>
            {img
              ? <img src={getImg(img)} alt="" width={36} height={36} style={{ borderRadius: 6, objectFit: "cover", border: `1px solid ${KM.border}`, flexShrink: 0 }} />
              : <div style={{ width: 36, height: 36, borderRadius: 6, background: KM.bg, border: `1px solid ${KM.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🎁</div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: KM.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {prod?.name || cp.productId}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 3 }}>
                {variant && (
                  <span style={{ fontSize: 10, background: "#EFF6FF", color: KM.blue, borderRadius: 4, padding: "1px 6px", border: `1px solid #c7d4f0`, fontWeight: 600 }}>
                    {variant.variantName}
                  </span>
                )}
                <span style={{ fontSize: 10, background: stock > 0 ? "#ecfdf5" : "#fef2f2", color: stock > 0 ? KM.green : "#dc2626", borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>
                  {stock > 0 ? `${stock} in stock` : "Out of stock"}
                </span>
                <span style={{ fontSize: 10, color: KM.muted }}>Qty: {cp.quantity}</span>
                <span style={{ fontSize: 10, color: KM.muted }}>₹{price.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <button type="button" onClick={() => onRemove(cp.id)}
              style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, flexShrink: 0, padding: 4 }}>✕</button>
          </div>
        );
      })}
    </div>
  );
}

// ── Child Combo Form ───────────────────────────────────────────────────────────
function ChildComboForm({ rootComboId, initial, allProducts, onSave, onCancel, showToast }) {
  const dispatch = useDispatch();
  const isEdit   = !!initial;

  const [form, setForm]         = useState({
    name:          initial?.name || "",
    type:          initial?.type || "fixed",
    description:   initial?.description || "",
    originalPrice: initial?.originalPrice || "",
    comboPrice:    initial?.comboPrice || "",
    minQty:        initial?.minQty || "",
    maxQty:        initial?.maxQty || "",
    allowDuplicates: initial?.allowDuplicates || false,
    isActive:      initial?.isActive !== false,
  });
  const [imgFile,    setImgFile]    = useState(null);
  const [imgPreview, setImgPreview] = useState(initial?.image ? getImg(initial.image) : null);
  const [saving,     setSaving]     = useState(false);

  // Pending products added before save (only for new child)
  const [pendingProducts, setPendingProducts] = useState([]);

  const f = (key) => (val) => setForm(p => ({ ...p, [key]: val }));

  const pct = form.originalPrice && form.comboPrice
    ? Math.round((1 - parseFloat(form.comboPrice) / parseFloat(form.originalPrice)) * 100)
    : 0;

  const handleImgChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const tid = showToast.loading(isEdit ? "Updating…" : "Creating…");
    try {
      const fd = new FormData();
      if (!isEdit) fd.append("rootComboId", rootComboId);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imgFile) fd.append("image", imgFile);

      let savedChild;
      if (isEdit) {
        savedChild = await dispatch(updateChildCombo({ id: initial.id, formData: fd }));
      } else {
        savedChild = await dispatch(createChildCombo(fd));
      }

      // Add any pending products (only possible on create path)
      for (const p of pendingProducts) {
        await dispatch(addChildProduct({ childId: savedChild.id, data: p }));
      }

      showToast.success(isEdit ? "Child combo updated" : "Child combo created", tid);
      onSave(savedChild);
    } catch (err) {
      showToast.error(err?.response?.data?.message || "Failed", tid);
    }
    setSaving(false);
  };

  // For existing children: add product directly via API
  const handleAddProduct = async (data) => {
    if (isEdit) {
      const tid = showToast.loading("Adding product…");
      try {
        await dispatch(addChildProduct({ childId: initial.id, data: { ...data, isEligible: form.type === "mix_match" } }));
        showToast.success("Product added", tid);
      } catch (err) {
        showToast.error("Failed to add product", tid);
      }
    } else {
      // Queue for after save
      setPendingProducts(prev => [...prev, { ...data, isEligible: form.type === "mix_match" }]);
    }
  };

  const handleRemoveProduct = async (cpId) => {
    if (isEdit) {
      const tid = showToast.loading("Removing…");
      try {
        await dispatch(removeChildProduct({ childId: initial.id, pid: cpId }));
        showToast.success("Removed", tid);
      } catch (err) {
        showToast.error("Failed", tid);
      }
    } else {
      setPendingProducts(prev => prev.filter(p => p._tempId !== cpId));
    }
  };

  const currentProducts = isEdit ? (initial?.comboProducts || []) : pendingProducts;

  return (
    <div style={{ background: KM.bg, border: `1px solid ${KM.border}`, borderRadius: 10, padding: "16px 18px", marginTop: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: KM.blue, marginBottom: 12 }}>
        {isEdit ? `Edit: ${initial.name}` : "New Child Combo"}
      </div>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>

        {/* Name */}
        <div style={{ ...field, gridColumn: "span 2" }}>
          <label style={lbl}>Name *</label>
          <input style={inp} required value={form.name} onChange={e => f("name")(e.target.value)} placeholder="e.g. Birthday Fixed Set" />
        </div>

        {/* Type toggle */}
        <div style={field}>
          <label style={lbl}>Type *</label>
          <TypeToggle value={form.type} onChange={f("type")} />
        </div>

        {/* Status */}
        <div style={field}>
          <label style={lbl}>Status</label>
          <select style={inp} value={form.isActive} onChange={e => f("isActive")(e.target.value === "true")}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Description */}
        <div style={{ ...field, gridColumn: "span 2" }}>
          <label style={lbl}>Description</label>
          <textarea style={{ ...inp, minHeight: 60, resize: "vertical" }} value={form.description} onChange={e => f("description")(e.target.value)} placeholder="Brief description of what's in this combo…" />
        </div>

        {/* Prices */}
        <div style={field}>
          <label style={lbl}>Original Price (₹)</label>
          <input type="number" min="0" style={inp} value={form.originalPrice} onChange={e => f("originalPrice")(e.target.value)} placeholder="0" />
        </div>
        <div style={field}>
          <label style={lbl}>Combo Price (₹) *</label>
          <div style={{ position: "relative" }}>
            <input type="number" min="0" required style={{ ...inp, paddingRight: pct > 0 ? 72 : 12 }} value={form.comboPrice} onChange={e => f("comboPrice")(e.target.value)} placeholder="0" />
            {pct > 0 && (
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, fontWeight: 700, color: KM.green, background: "#ecfdf5", padding: "2px 7px", borderRadius: 4 }}>
                Save {pct}%
              </span>
            )}
          </div>
        </div>

        {/* Mix & Match extras */}
        {form.type === "mix_match" && (
          <>
            <div style={field}>
              <label style={lbl}>Min Qty</label>
              <input type="number" min="1" style={inp} value={form.minQty} onChange={e => f("minQty")(e.target.value)} placeholder="e.g. 2" />
            </div>
            <div style={field}>
              <label style={lbl}>Max Qty</label>
              <input type="number" min="1" style={inp} value={form.maxQty} onChange={e => f("maxQty")(e.target.value)} placeholder="e.g. 5" />
            </div>
            <div style={{ ...field, gridColumn: "span 2" }}>
              <label style={lbl}>Allow Duplicates</label>
              <div style={{ display: "flex", gap: 0, border: `1px solid ${KM.border}`, borderRadius: 8, overflow: "hidden", width: "fit-content" }}>
                {[["true", "Yes"], ["false", "No"]].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => f("allowDuplicates")(val === "true")}
                    style={{ padding: "8px 20px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, background: String(form.allowDuplicates) === val ? KM.orange : "#fff", color: String(form.allowDuplicates) === val ? "#fff" : KM.muted }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Image */}
        <div style={{ ...field, gridColumn: "span 2" }}>
          <label style={lbl}>Image</label>
          <ImageUpload preview={imgPreview} onChange={handleImgChange} onClear={() => { setImgFile(null); setImgPreview(null); }} />
        </div>

        {/* Product Picker */}
        <div style={{ gridColumn: "span 2" }}>
          <ProductPickerRow
            allProducts={allProducts}
            label={form.type === "mix_match" ? "Eligible Pool" : "Included Products"}
            onAdd={handleAddProduct}
          />
          <ProductList
            products={currentProducts}
            allProducts={allProducts}
            onRemove={handleRemoveProduct}
          />
        </div>

        {/* Actions */}
        <div style={{ gridColumn: "span 2", display: "flex", gap: 10 }}>
          <button type="submit" disabled={saving}
            style={{ flex: 1, padding: 10, background: KM.orange, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : isEdit ? "Update Child Combo" : "Save Child Combo"}
          </button>
          <button type="button" onClick={onCancel}
            style={{ padding: "10px 18px", background: "#fff", color: KM.muted, border: `1px solid ${KM.border}`, borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Root Combo Form ────────────────────────────────────────────────────────────
function RootComboForm({ initial, onSave, onCancel, showToast }) {
  const dispatch = useDispatch();
  const isEdit   = !!initial;

  const [name,       setName]       = useState(initial?.name || "");
  const [isActive,   setIsActive]   = useState(initial?.isActive !== false);
  const [imgFile,    setImgFile]    = useState(null);
  const [imgPreview, setImgPreview] = useState(initial?.image ? getImg(initial.image) : null);
  const [saving,     setSaving]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const tid = showToast.loading(isEdit ? "Updating…" : "Creating root combo…");
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("isActive", isActive);
      if (imgFile) fd.append("image", imgFile);

      let result;
      if (isEdit) {
        result = await dispatch(updateRootComboAction({ id: initial.id, formData: fd }));
      } else {
        result = await dispatch(createRootCombo(fd));
      }
      showToast.success(isEdit ? "Root combo updated" : "Root combo created!", tid);
      onSave(result);
    } catch (err) {
      showToast.error(err?.response?.data?.message || "Failed", tid);
    }
    setSaving(false);
  };

  return (
    <div style={{ background: "#fff", border: `1px solid ${KM.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
      {/* Header */}
      <div style={{ background: KM.blue, padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, background: "rgba(255,255,255,0.15)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16 }}>🎁</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{isEdit ? "Edit Root Combo" : "New Root Combo"}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Top-level combo group shown in the shop sidebar</div>
        </div>
      </div>
      <div style={{ padding: "18px 20px" }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <div style={{ ...field, gridColumn: "span 2" }}>
            <label style={lbl}>Combo Name *</label>
            <input style={inp} required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Birthday Combos" />
          </div>
          <div style={field}>
            <label style={lbl}>Status</label>
            <select style={inp} value={isActive} onChange={e => setIsActive(e.target.value === "true")}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div style={field}>
            <label style={lbl}>Sidebar Image</label>
            <ImageUpload
              preview={imgPreview}
              onChange={e => { const f = e.target.files?.[0]; if (f) { setImgFile(f); setImgPreview(URL.createObjectURL(f)); } }}
              onClear={() => { setImgFile(null); setImgPreview(null); }}
            />
          </div>
          <div style={{ gridColumn: "span 2", display: "flex", gap: 10 }}>
            <button type="submit" disabled={saving}
              style={{ flex: 1, padding: 10, background: KM.orange, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : isEdit ? "Update Root Combo" : "Save Root Combo"}
            </button>
            {onCancel && (
              <button type="button" onClick={onCancel}
                style={{ padding: "10px 18px", background: "#fff", color: KM.muted, border: `1px solid ${KM.border}`, borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Root Combo Detail (expanded view with children) ────────────────────────────
function RootComboDetail({ rootId, allProducts, showToast, onBack }) {
  const dispatch = useDispatch();
  const { currentRoot, loading } = useSelector(s => s.newCombos);
  const [showChildForm, setShowChildForm] = useState(false);
  const [editingChild,  setEditingChild]  = useState(null);
  const [editingRoot,   setEditingRoot]   = useState(false);

  useEffect(() => {
    dispatch(fetchRootComboById(rootId));
  }, [rootId]);

  if (loading || !currentRoot) {
    return <div style={{ padding: 40, textAlign: "center", color: KM.muted }}>Loading…</div>;
  }

  const handleDeleteChild = (child) => {
    confirmDelete({
      title: `Delete "${child.name}"?`,
      message: "This will remove the child combo and all its products.",
      onConfirm: async () => {
        const tid = showToast.loading("Deleting…");
        try {
          await dispatch(deleteChildCombo(child.id));
          showToast.success("Deleted", tid);
        } catch {
          showToast.error("Failed to delete", tid);
        }
      },
    });
  };

  return (
    <div>
      {/* Back + header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: "none", border: `1px solid ${KM.border}`, borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, color: KM.muted, fontFamily: "inherit" }}>
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: KM.text }}>{currentRoot.name}</div>
          <div style={{ fontSize: 12, color: KM.muted }}>{currentRoot.children?.length || 0} child combo{currentRoot.children?.length !== 1 ? "s" : ""}</div>
        </div>
        <button onClick={() => setEditingRoot(r => !r)}
          style={{ padding: "7px 14px", background: "#fff", border: `1px solid ${KM.border}`, borderRadius: 8, fontSize: 12, cursor: "pointer", color: KM.blue, fontWeight: 600, fontFamily: "inherit" }}>
          ✏️ Edit Root
        </button>
        <button onClick={() => { setShowChildForm(true); setEditingChild(null); }}
          style={{ padding: "7px 14px", background: KM.orange, border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer", color: "#fff", fontWeight: 600, fontFamily: "inherit" }}>
          + Add Child Combo
        </button>
      </div>

      {editingRoot && (
        <RootComboForm
          initial={currentRoot}
          showToast={showToast}
          onSave={() => { setEditingRoot(false); dispatch(fetchRootComboById(rootId)); }}
          onCancel={() => setEditingRoot(false)}
        />
      )}

      {showChildForm && !editingChild && (
        <ChildComboForm
          rootComboId={currentRoot.id}
          allProducts={allProducts}
          showToast={showToast}
          onSave={() => { setShowChildForm(false); dispatch(fetchRootComboById(rootId)); }}
          onCancel={() => setShowChildForm(false)}
        />
      )}

      {/* Children list */}
      {(!currentRoot.children || currentRoot.children.length === 0) && !showChildForm ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: KM.muted, fontSize: 13 }}>
          No child combos yet. Click "Add Child Combo" to start.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(currentRoot.children || []).map(child => (
            <div key={child.id}>
              <div style={{
                background: "#fff", border: `1px solid ${KM.border}`, borderRadius: 10,
                overflow: "hidden",
              }}>
                {/* Child header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${KM.border}` }}>
                  {child.image && (
                    <img src={getImg(child.image)} alt="" width={44} height={44} style={{ borderRadius: 8, objectFit: "cover", border: `1px solid ${KM.border}`, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: KM.text }}>{child.name}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 3 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: child.type === "fixed" ? "#EFF6FF" : "#fefce8", color: child.type === "fixed" ? KM.blue : "#b45309" }}>
                        {child.type === "fixed" ? "Fixed" : "Mix & Match"}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: child.isActive ? "#ecfdf5" : "#fef2f2", color: child.isActive ? KM.green : "#dc2626" }}>
                        {child.isActive ? "Active" : "Inactive"}
                      </span>
                      {child.originalPrice && (
                        <span style={{ fontSize: 10, color: KM.muted }}>MRP: ₹{parseFloat(child.originalPrice).toLocaleString("en-IN")}</span>
                      )}
                      <span style={{ fontSize: 10, fontWeight: 700, color: KM.orange }}>₹{parseFloat(child.comboPrice).toLocaleString("en-IN")}</span>
                      {child.type === "mix_match" && child.minQty && (
                        <span style={{ fontSize: 10, color: KM.muted }}>Pick {child.minQty}{child.maxQty ? `–${child.maxQty}` : "+"}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="action-btn btn-edit" onClick={() => setEditingChild(c => c?.id === child.id ? null : child)}>Edit</button>
                    <button className="action-btn btn-del"  onClick={() => handleDeleteChild(child)}>Delete</button>
                  </div>
                </div>

                {/* Products preview */}
                {child.comboProducts && child.comboProducts.length > 0 && (
                  <div style={{ padding: "10px 16px" }}>
                    <div style={{ fontSize: 11, color: KM.muted, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {child.type === "mix_match" ? "Eligible Pool" : "Included Products"}
                      <span style={{ marginLeft: 8, background: KM.teal, color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{child.comboProducts.length}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {child.comboProducts.map(cp => {
                        const prod = cp.product || allProducts.find(p => p.id === cp.productId);
                        const img  = Array.isArray(prod?.image) ? prod?.image[0] : prod?.image;
                        return (
                          <div key={cp.id} style={{ display: "flex", alignItems: "center", gap: 6, background: KM.bg, border: `1px solid ${KM.border}`, borderRadius: 6, padding: "4px 8px" }}>
                            {img && <img src={getImg(img)} alt="" width={20} height={20} style={{ borderRadius: 3, objectFit: "cover" }} />}
                            <span style={{ fontSize: 11, color: KM.text, fontWeight: 500 }}>{prod?.name || cp.productId}</span>
                            {cp.quantity > 1 && <span style={{ fontSize: 10, color: KM.muted }}>×{cp.quantity}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Edit form inline */}
              {editingChild?.id === child.id && (
                <ChildComboForm
                  rootComboId={currentRoot.id}
                  initial={child}
                  allProducts={allProducts}
                  showToast={showToast}
                  onSave={() => { setEditingChild(null); dispatch(fetchRootComboById(rootId)); }}
                  onCancel={() => setEditingChild(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main NewCombos page ────────────────────────────────────────────────────────
export default function NewCombos({ showToast }) {
  const dispatch = useDispatch();
  const { rootCombos, loading } = useSelector(s => s.newCombos || { rootCombos: [], loading: false });
  const { items: allProducts }  = useSelector(s => s.products || { items: [] });

  const [showRootForm,   setShowRootForm]   = useState(false);
  const [selectedRootId, setSelectedRootId] = useState(null);

  useEffect(() => {
    dispatch(fetchRootCombos());
    dispatch(fetchProducts());
  }, []);

  const handleDeleteRoot = (root) => {
    confirmDelete({
      title: `Delete "${root.name}"?`,
      message: "This will delete the root combo and ALL child combos inside it.",
      onConfirm: async () => {
        const tid = showToast.loading("Deleting…");
        try {
          await dispatch(deleteRootCombo(root.id));
          showToast.success("Deleted", tid);
          if (selectedRootId === root.id) setSelectedRootId(null);
        } catch {
          showToast.error("Failed to delete", tid);
        }
      },
    });
  };

  if (selectedRootId) {
    return (
      <RootComboDetail
        rootId={selectedRootId}
        allProducts={allProducts}
        showToast={showToast}
        onBack={() => { setSelectedRootId(null); dispatch(fetchRootCombos()); }}
      />
    );
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div className="section-title">Combo Manager</div>
        <button className="action-btn btn-edit" onClick={() => setShowRootForm(f => !f)}>
          {showRootForm ? "Close" : "+ Add Combo"}
        </button>
      </div>

      {showRootForm && (
        <RootComboForm
          showToast={showToast}
          onSave={(root) => { setShowRootForm(false); setSelectedRootId(root.id); }}
          onCancel={() => setShowRootForm(false)}
        />
      )}

      {loading ? (
        <p style={{ padding: 20, color: KM.muted }}>Loading combos…</p>
      ) : rootCombos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: KM.muted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: KM.text, marginBottom: 6 }}>No combos yet</div>
          <div style={{ fontSize: 13 }}>Click "+ Add Combo" to create your first root combo.</div>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}>
          {rootCombos.map(root => (
            <div key={root.id}
              style={{
                background: "#fff", border: `1px solid ${KM.border}`, borderRadius: 12,
                overflow: "hidden", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(241,90,36,0.12)"; e.currentTarget.style.borderColor = KM.orange; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = KM.border; }}
            >
              {/* Image */}
              <div style={{ position: "relative", height: 140, background: KM.bg, overflow: "hidden" }}
                onClick={() => setSelectedRootId(root.id)}>
                {root.image
                  ? <img src={getImg(root.image)} alt={root.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 48 }}>🎁</div>
                }
                <span style={{
                  position: "absolute", top: 8, right: 8, fontSize: 10, fontWeight: 700,
                  padding: "2px 8px", borderRadius: 4,
                  background: root.isActive ? "#ecfdf5" : "#fef2f2",
                  color: root.isActive ? KM.green : "#dc2626",
                }}>
                  {root.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Content */}
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: KM.text, marginBottom: 4 }}
                  onClick={() => setSelectedRootId(root.id)}>
                  {root.name}
                </div>
                <div style={{ fontSize: 11, color: KM.muted }}>
                  Click to manage child combos
                </div>
              </div>

              {/* Actions */}
              <div style={{ padding: "10px 14px", borderTop: `1px solid ${KM.border}`, display: "flex", gap: 8 }}>
                <button className="action-btn btn-edit" style={{ flex: 1 }}
                  onClick={() => setSelectedRootId(root.id)}>
                  Manage
                </button>
                <button className="action-btn btn-del"
                  onClick={e => { e.stopPropagation(); handleDeleteRoot(root); }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
