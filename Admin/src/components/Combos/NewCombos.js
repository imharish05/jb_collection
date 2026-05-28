// Admin/src/components/Combos/NewCombos.js
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "../DataTable/DataTable";
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

// ── Image Upload Widget ────────────────────────────────────────────────────────
function ImageUpload({ preview, onChange, onClear }) {
  const ref = useRef();
  return (
    <div className="upload-grid-wrapper">
      <div
        className={`drop-zone-area ${preview ? "active-file" : ""}`}
        onClick={() => ref.current.click()}
      >
        <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={onChange} />
        <div className="drop-zone-info">
          <div className="upload-icon text-center">{preview ? "✅" : "📸"}</div>
          <p className="upload-text">{preview ? <b>Image selected</b> : <>Click to <b>browse</b></>}</p>
        </div>
      </div>
      {preview && (
        <div className="preview-tile fade-in">
          <img src={preview} alt="preview" />
          <button type="button" className="preview-remove" onClick={onClear}>✕</button>
        </div>
      )}
    </div>
  );
}

// ── Toggle Button (Fixed / Mix & Match) ───────────────────────────────────────
function TypeToggle({ value, onChange }) {
  return (
    <div style={{ display: "flex", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
      {["fixed", "mix_match"].map(t => (
        <button key={t} type="button" onClick={() => onChange(t)}
          style={{
            flex: 1, padding: "9px 0", border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 600, transition: "background 0.15s",
            background: value === t ? "var(--brand)" : "#fff",
            color: value === t ? "#fff" : "var(--neutral-500)",
          }}>
          {t === "fixed" ? "Fixed" : "Mix & Match"}
        </button>
      ))}
    </div>
  );
}

// ── Product + Variant Picker Row ───────────────────────────────────────────────
function ProductPickerRow({ allProducts, onAdd, label = "Included Products" }) {
  const [search, setSearch]   = useState("");
  const [selProd, setSelProd] = useState(null);
  const [selVar,  setSelVar]  = useState("");
  const [qty,     setQty]     = useState(1);
  const [open,    setOpen]    = useState(false);
  const dropRef = useRef();

  const filtered = (allProducts || []).filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 40);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAdd = () => {
    if (!selProd) return;
    onAdd({ productId: selProd.id, variantId: selVar || null, quantity: qty });
    setSelProd(null); setSelVar(""); setQty(1); setSearch("");
  };

  const variants = selProd?.Variants || [];

  return (
    <div style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
      <div style={{ background: "var(--neutral-50)", padding: "10px 14px", borderBottom: "1px solid var(--border-color)" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--neutral-800)" }}>{label}</span>
      </div>
      <div style={{ padding: "12px 14px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        {/* Product search */}
        <div style={{ flex: "1 1 200px", position: "relative" }} ref={dropRef}>
          <label className="km-label" style={{ display: "block", marginBottom: 5 }}>Product</label>
          <input
            className="km-input"
            placeholder="Search product…"
            value={selProd ? selProd.name : search}
            onFocus={() => setOpen(true)}
            onChange={e => { setSearch(e.target.value); setSelProd(null); setOpen(true); }}
          />
          {open && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 200,
              background: "#fff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)", maxHeight: 220, overflowY: "auto", marginTop: 2,
            }}>
              {filtered.length === 0
                ? <div style={{ padding: 12, color: "var(--neutral-400)", fontSize: 12 }}>No products found</div>
                : filtered.map(p => {
                    const img = Array.isArray(p.image) ? p.image[0] : p.image;
                    return (
                      <div key={p.id}
                        onClick={() => { setSelProd(p); setSelVar(""); setOpen(false); setSearch(""); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid var(--border-color)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--neutral-50)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        {img
                          ? <img src={getImg(img)} alt="" width={28} height={28} style={{ borderRadius: 4, objectFit: "cover" }} />
                          : <div style={{ width: 28, height: 28, borderRadius: 4, background: "var(--neutral-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🎁</div>
                        }
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--neutral-800)" }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: "var(--neutral-400)" }}>₹{p.price} · {p.Variants?.length || 0} variants</div>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          )}
        </div>

        {/* Variant select — only after product selected */}
        {selProd && variants.length > 0 && (
          <div style={{ flex: "1 1 160px" }}>
            <label className="km-label" style={{ display: "block", marginBottom: 5 }}>Variant</label>
            <select className="km-input" value={selVar} onChange={e => setSelVar(e.target.value)}>
              <option value="">Any / No variant</option>
              {variants.map(v => (
                <option key={v.id} value={v.id}>{v.variantName} — ₹{v.salesPrice}</option>
              ))}
            </select>
          </div>
        )}

        {/* Qty */}
        <div style={{ flex: "0 0 80px" }}>
          <label className="km-label" style={{ display: "block", marginBottom: 5 }}>Qty</label>
          <input type="number" min={1} className="km-input"
            value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
        </div>

        <button type="button" onClick={handleAdd} disabled={!selProd}
          className="action-btn btn-edit"
          style={{ alignSelf: "flex-end", opacity: selProd ? 1 : 0.5, cursor: selProd ? "pointer" : "not-allowed" }}>
          + Add
        </button>
      </div>
    </div>
  );
}

// ── Product List ───────────────────────────────────────────────────────────────
function ProductList({ products, allProducts, onRemove }) {
  if (!products || products.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
      {products.map(cp => {
        const prod = cp.product || (allProducts || []).find(p => p.id === cp.productId);
        const variant = cp.variant || prod?.Variants?.find(v => String(v.id) === String(cp.variantId));
        const img = Array.isArray(prod?.image) ? prod?.image[0] : prod?.image;
        const stock = variant ? variant.stock : prod?.stock ?? 0;
        const price = variant ? parseFloat(variant.salesPrice) : parseFloat(prod?.price || 0);
        return (
          <div key={cp.id} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
            background: "#fff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)",
          }}>
            {img
              ? <img src={getImg(img)} alt="" width={36} height={36} style={{ borderRadius: 6, objectFit: "cover", border: "1px solid var(--border-color)", flexShrink: 0 }} />
              : <div style={{ width: 36, height: 36, borderRadius: 6, background: "var(--neutral-100)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🎁</div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-800)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {prod?.name || cp.productId}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 3 }}>
                {variant && (
                  <span style={{ fontSize: 10, background: "var(--info-50)", color: "var(--info-main)", borderRadius: 4, padding: "1px 6px", border: "1px solid var(--info-border)", fontWeight: 600 }}>
                    {variant.variantName}
                  </span>
                )}
                <span style={{ fontSize: 10, background: stock > 0 ? "var(--success-50)" : "var(--danger-50)", color: stock > 0 ? "var(--success-main)" : "var(--danger-main)", borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>
                  {stock > 0 ? `${stock} in stock` : "Out of stock"}
                </span>
                <span style={{ fontSize: 10, color: "var(--neutral-400)" }}>Qty: {cp.quantity}</span>
                <span style={{ fontSize: 10, color: "var(--neutral-400)" }}>₹{price.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <button type="button" onClick={() => onRemove(cp.id)}
              style={{ background: "none", border: "none", color: "var(--danger-500)", cursor: "pointer", fontSize: 16, flexShrink: 0, padding: 4 }}>✕</button>
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

  const [form, setForm] = useState({
    name:           initial?.name || "",
    type:           initial?.type || "fixed",
    description:    initial?.description || "",
    originalPrice:  initial?.originalPrice || "",
    comboPrice:     initial?.comboPrice || "",
    minQty:         initial?.minQty || "",
    maxQty:         initial?.maxQty || "",
    allowDuplicates: initial?.allowDuplicates || false,
    isActive:       initial?.isActive !== false,
  });
  const [imgFile,    setImgFile]    = useState(null);
  const [imgPreview, setImgPreview] = useState(initial?.image ? getImg(initial.image) : null);
  const [saving,     setSaving]     = useState(false);
  const [pendingProducts, setPendingProducts] = useState([]);

  const f = (key) => (val) => setForm(p => ({ ...p, [key]: val }));

  const pct = form.originalPrice && form.comboPrice
    ? Math.round((1 - parseFloat(form.comboPrice) / parseFloat(form.originalPrice)) * 100)
    : 0;

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

  const handleAddProduct = async (data) => {
    if (isEdit) {
      const tid = showToast.loading("Adding product…");
      try {
        await dispatch(addChildProduct({ childId: initial.id, data: { ...data, isEligible: form.type === "mix_match" } }));
        showToast.success("Product added", tid);
      } catch {
        showToast.error("Failed to add product", tid);
      }
    } else {
      setPendingProducts(prev => [...prev, { ...data, isEligible: form.type === "mix_match", _tempId: Date.now() }]);
    }
  };

  const handleRemoveProduct = async (cpId) => {
    if (isEdit) {
      const tid = showToast.loading("Removing…");
      try {
        await dispatch(removeChildProduct({ childId: initial.id, pid: cpId }));
        showToast.success("Removed", tid);
      } catch {
        showToast.error("Failed", tid);
      }
    } else {
      setPendingProducts(prev => prev.filter(p => p._tempId !== cpId));
    }
  };

  const currentProducts = isEdit ? (initial?.comboProducts || []) : pendingProducts;

  return (
    <div className="km-form-card fade-in" style={{ marginTop: 12 }}>
      <div className="km-form-header">
        <div className="km-form-header-icon">{isEdit ? "✎" : "+"}</div>
        <div>
          <div className="km-form-header-title">{isEdit ? `Edit: ${initial.name}` : "New Child Combo"}</div>
          <div className="km-form-header-sub">Configure this child combo</div>
        </div>
      </div>
      <div className="km-form-body">
        <form className="km-form-grid" onSubmit={handleSubmit}>

          <div className="km-field km-field-full">
            <label className="km-label">Name *</label>
            <input className="km-input" required value={form.name}
              onChange={e => f("name")(e.target.value)} placeholder="e.g. Birthday Fixed Set" />
          </div>

          <div className="km-field">
            <label className="km-label">Type *</label>
            <TypeToggle value={form.type} onChange={f("type")} />
          </div>

          <div className="km-field">
            <label className="km-label">Status</label>
            <select className="km-input" value={form.isActive} onChange={e => f("isActive")(e.target.value === "true")}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="km-field km-field-full">
            <label className="km-label">Description</label>
            <textarea className="km-input" style={{ minHeight: 60, resize: "vertical" }}
              value={form.description} onChange={e => f("description")(e.target.value)}
              placeholder="Brief description…" />
          </div>

          <div className="km-field">
            <label className="km-label">Original Price (₹)</label>
            <input type="number" min="0" className="km-input"
              value={form.originalPrice} onChange={e => f("originalPrice")(e.target.value)} placeholder="0" />
          </div>

          <div className="km-field">
            <label className="km-label">Combo Price (₹) *</label>
            <div style={{ position: "relative" }}>
              <input type="number" min="0" required className="km-input"
                style={{ paddingRight: pct > 0 ? 72 : 12 }}
                value={form.comboPrice} onChange={e => f("comboPrice")(e.target.value)} placeholder="0" />
              {pct > 0 && (
                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, fontWeight: 700, color: "var(--success-main)", background: "var(--success-50)", padding: "2px 7px", borderRadius: 4 }}>
                  Save {pct}%
                </span>
              )}
            </div>
          </div>

          {form.type === "mix_match" && (
            <>
              <div className="km-field">
                <label className="km-label">Min Qty</label>
                <input type="number" min="1" className="km-input"
                  value={form.minQty} onChange={e => f("minQty")(e.target.value)} placeholder="e.g. 2" />
              </div>
              <div className="km-field">
                <label className="km-label">Max Qty</label>
                <input type="number" min="1" className="km-input"
                  value={form.maxQty} onChange={e => f("maxQty")(e.target.value)} placeholder="e.g. 5" />
              </div>
              <div className="km-field km-field-full">
                <label className="km-label">Allow Duplicates</label>
                <div style={{ display: "flex", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", overflow: "hidden", width: "fit-content" }}>
                  {[["true", "Yes"], ["false", "No"]].map(([val, lbl]) => (
                    <button key={val} type="button" onClick={() => f("allowDuplicates")(val === "true")}
                      style={{ padding: "8px 20px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: String(form.allowDuplicates) === val ? "var(--brand)" : "#fff", color: String(form.allowDuplicates) === val ? "#fff" : "var(--neutral-500)" }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="km-field km-field-full">
            <label className="km-label">Image</label>
            <ImageUpload
              preview={imgPreview}
              onChange={e => { const file = e.target.files?.[0]; if (file) { setImgFile(file); setImgPreview(URL.createObjectURL(file)); } }}
              onClear={() => { setImgFile(null); setImgPreview(null); }}
            />
          </div>

          <div className="km-field km-field-full">
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

          <div className="km-form-actions" style={{ display: "flex" }}>
            <button type="submit" disabled={saving} className="km-btn-submit" style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : isEdit ? "Update Child Combo" : "Save Child Combo"}
            </button>
            <button type="button" onClick={onCancel} className="km-btn-cancel">Cancel</button>
          </div>
        </form>
      </div>
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
    <div className="km-form-card fade-in">
      <div className="km-form-header">
        <div className="km-form-header-icon">{isEdit ? "✎" : "🎁"}</div>
        <div>
          <div className="km-form-header-title">{isEdit ? "Edit Root Combo" : "Add New Root Combo"}</div>
          <div className="km-form-header-sub">Top-level combo group shown in the shop sidebar</div>
        </div>
      </div>
      <div className="km-form-body">
        <form className="km-form-grid" onSubmit={handleSubmit}>
          <div className="km-field km-field-full">
            <label className="km-label">Combo Name *</label>
            <input className="km-input" required value={name}
              onChange={e => setName(e.target.value)} placeholder="e.g. Birthday Combos" />
          </div>

          <div className="km-field">
            <label className="km-label">Status</label>
            <select className="km-input" value={isActive} onChange={e => setIsActive(e.target.value === "true")}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="km-field">
            <label className="km-label">Sidebar Image</label>
            <ImageUpload
              preview={imgPreview}
              onChange={e => { const file = e.target.files?.[0]; if (file) { setImgFile(file); setImgPreview(URL.createObjectURL(file)); } }}
              onClear={() => { setImgFile(null); setImgPreview(null); }}
            />
          </div>

          <div className="km-form-actions" style={{ display: "flex" }}>
            <button type="submit" disabled={saving} className="km-btn-submit" style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : isEdit ? "Update Root Combo" : "Save Root Combo"}
            </button>
            {onCancel && (
              <button type="button" onClick={onCancel} className="km-btn-cancel">Cancel</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Root Combo Detail / Manage Page ───────────────────────────────────────────
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
    return <p className="km-loading">Loading…</p>;
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
          dispatch(fetchRootComboById(rootId));
        } catch {
          showToast.error("Failed to delete", tid);
        }
      },
    });
  };

  return (
    <div className="categories-container">
      {/* Header */}
      <div className="section-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} className="action-btn btn-edit" style={{ background: "#fff", color: "var(--neutral-600)" }}>
            ← Back
          </button>
          <div className="section-title">{currentRoot.name}</div>
          <span style={{ fontSize: 12, color: "var(--neutral-400)" }}>
            {currentRoot.children?.length || 0} child combo{currentRoot.children?.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="action-btn btn-edit"
            onClick={() => { setEditingRoot(r => !r); setShowChildForm(false); setEditingChild(null); }}>
            {editingRoot ? "Close Edit" : "✏️ Edit Root"}
          </button>
          <button className="action-btn btn-edit"
            onClick={() => { setShowChildForm(f => !f); setEditingRoot(false); setEditingChild(null); }}>
            {showChildForm ? "Close" : "+ Add Child Combo"}
          </button>
        </div>
      </div>

      {/* Edit root form */}
      {editingRoot && (
        <RootComboForm
          initial={currentRoot}
          showToast={showToast}
          onSave={() => { setEditingRoot(false); dispatch(fetchRootComboById(rootId)); }}
          onCancel={() => setEditingRoot(false)}
        />
      )}

      {/* Add child form */}
      {showChildForm && !editingChild && (
        <ChildComboForm
          rootComboId={currentRoot.id}
          allProducts={allProducts}
          showToast={showToast}
          onSave={() => { setShowChildForm(false); dispatch(fetchRootComboById(rootId)); }}
          onCancel={() => setShowChildForm(false)}
        />
      )}

      {/* Children table */}
      {(!currentRoot.children || currentRoot.children.length === 0) && !showChildForm ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--neutral-400)", fontSize: 13 }}>
          No child combos yet. Click "+ Add Child Combo" to start.
        </div>
      ) : (
        <DataTable
          columns={["No.", "Image", "Name", "Type", "Price", "Status", "Actions"]}
          initialRows={currentRoot.children || []}
          renderRow={(child, i) => (
            <>
            <tr key={child.id}>
              <td className="td-id">{i + 1}</td>
              <td>
                <div className="img-thumb">
                  {child.image
                    ? <img src={getImg(child.image)} alt={child.name} width={40} height={40} style={{ borderRadius: 8, objectFit: "cover" }} />
                    : "🎁"
                  }
                </div>
              </td>
              <td><strong>{child.name}</strong></td>
              <td>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                  background: child.type === "fixed" ? "var(--info-50)" : "var(--warning-50)",
                  color: child.type === "fixed" ? "var(--info-main)" : "var(--warning-600)",
                }}>
                  {child.type === "fixed" ? "Fixed" : "Mix & Match"}
                </span>
              </td>
              <td>₹{parseFloat(child.comboPrice || 0).toLocaleString("en-IN")}</td>
              <td>
                <span className={`status-pill ${child.isActive ? "pill-active" : "pill-inactive"}`}>
                  {child.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="action-btn btn-edit"
                    onClick={() => { setEditingChild(c => c?.id === child.id ? null : child); setShowChildForm(false); }}>
                    Edit
                  </button>
                  <button className="action-btn btn-del" onClick={() => handleDeleteChild(child)}>Delete</button>
                </div>
              </td>
            </tr>
            {editingChild?.id === child.id && (
              <tr key={`edit-${child.id}`}>
                <td colSpan={7} style={{ padding: "0 8px 12px" }}>
                  <ChildComboForm
                    rootComboId={currentRoot.id}
                    initial={child}
                    allProducts={allProducts}
                    showToast={showToast}
                    onSave={() => { setEditingChild(null); dispatch(fetchRootComboById(rootId)); }}
                    onCancel={() => setEditingChild(null)}
                  />
                </td>
              </tr>
            )}
            </>
          )}
        />
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
    <div className="categories-container">
      {/* Page header */}
      <div className="section-header">
        <div className="section-title">Combo Manager</div>
        <button className="action-btn btn-edit" onClick={() => setShowRootForm(f => !f)}>
          {showRootForm ? "Close" : "+ Add Root Combo"}
        </button>
      </div>

      {/* Add root form */}
      {showRootForm && (
        <RootComboForm
          showToast={showToast}
          onSave={(root) => {
            setShowRootForm(false);
            dispatch(fetchRootCombos());
          }}
          onCancel={() => setShowRootForm(false)}
        />
      )}

      {/* Table */}
      {loading ? (
        <p className="km-loading">Loading combos…</p>
      ) : (
        <DataTable
          columns={["No.", "Image", "Name", "Child Combos", "Status", "Actions"]}
          initialRows={rootCombos}
          renderRow={(root, i) => (
            <tr key={root.id}>
              <td className="td-id">{i + 1}</td>
              <td>
                <div className="img-thumb">
                  {root.image
                    ? <img src={getImg(root.image)} alt={root.name} width={40} height={40} style={{ borderRadius: 8, objectFit: "cover" }}
                        onError={e => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23eee'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='8' fill='%23999'%3ENo Img%3C/text%3E%3C/svg%3E"; }} />
                    : "🎁"
                  }
                </div>
              </td>
              <td><strong>{root.name}</strong></td>
              <td>
                <span style={{ background: "var(--info-50)", color: "var(--info-main)", borderRadius: 4, padding: "2px 8px", fontSize: 12, fontWeight: 600 }}>
                  {root.children?.length || root.childCount || 0}
                </span>
              </td>
              <td>
                <span className={`status-pill ${root.isActive ? "pill-active" : "pill-inactive"}`}>
                  {root.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="action-btn btn-edit" onClick={() => setSelectedRootId(root.id)}>Manage</button>
                  <button className="action-btn btn-del" onClick={() => handleDeleteRoot(root)}>Delete</button>
                </div>
              </td>
            </tr>
          )}
        />
      )}

      <style>{`
        .km-form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .km-field { display: flex; flex-direction: column; gap: 5px; }
        .km-field-full { grid-column: span 2; }

        .upload-grid-wrapper {
          display: flex;
          gap: 16px;
          margin-top: 8px;
          align-items: flex-start;
        }
        .drop-zone-area {
          flex: 1;
          height: 110px;
          border: 2px dashed rgba(0,0,0,0.1);
          background: rgba(0,0,0,0.02);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .drop-zone-area.active-file {
          border-color: var(--success-main);
          background: rgba(69,179,105,0.05);
        }
        .upload-text { font-size: 13px; color: #666; margin: 0; }
        .upload-icon { text-align: center; }
        .preview-tile {
          width: 110px; height: 110px;
          border-radius: 12px; overflow: hidden; position: relative;
          border: 2px solid var(--primary-600); flex-shrink: 0;
        }
        .preview-tile img { width: 100%; height: 100%; object-fit: cover; }
        .preview-remove {
          position: absolute; top: 5px; right: 5px;
          width: 20px; height: 20px; border-radius: 50%;
          background: rgba(0,0,0,0.7); color: white; border: none; cursor: pointer;
        }
        .km-form-actions {
          grid-column: span 2;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 10px;
          padding-top: 20px;
          border-top: 1px solid rgba(0,0,0,0.05);
        }
        .km-btn-submit {
          padding: 10px 24px; background: var(--primary-600); color: white;
          border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
        }
        .km-btn-cancel {
          padding: 10px 24px; background: #f1f1f1; color: #333;
          border: 1px solid #ddd; border-radius: 8px; font-weight: 600; cursor: pointer;
        }
        .km-btn-submit:hover, .km-btn-cancel:hover { opacity: 0.8; }
        .fade-in { animation: kmFadeIn 0.3s ease-out; }
        @keyframes kmFadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}