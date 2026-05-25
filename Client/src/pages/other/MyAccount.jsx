import cogoToast from "cogo-toast";
import { Fragment, useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import { useDispatch, useSelector } from "react-redux";
import { updatePasswordService, updateProfileFunction } from "../../store/services/authService";
import { logoutAction } from "../../store/slices/authSlice";
import { setActiveAddress, clearAddresses } from "../../store/slices/addressSlice";
import {
  fetchAddresses,
  addAddressService,
  updateAddressService,
  deleteAddressService,
  setDefaultAddressService,
} from "../../store/services/addressService";
import { fetchOrders } from "../../store/services/orderService";
import { getImgUrl } from "../../helpers/imageUrl";

const FALLBACK_IMG = "/assets/img/logo.png";

const parseJson = (val) => {
  if (!val || typeof val !== "string") return val;
  try { return JSON.parse(val); } catch { return val; }
};

// Unwraps any level of JSON encoding until we get a real value
const deepParse = (val) => {
  let result = val;
  for (let i = 0; i < 5; i++) {
    if (typeof result !== "string") break;
    const next = parseJson(result);
    if (next === result) break; // no change, stop
    result = next;
  }
  return result;
};

const getOrderItemImage = (img) => {
  if (!img) return FALLBACK_IMG;
  const unwrapped = deepParse(img);
  // Could be array after unwrapping
  const raw = Array.isArray(unwrapped) ? unwrapped[0] : (typeof unwrapped === "string" ? unwrapped : null);
  if (!raw) return FALLBACK_IMG;
  // Already absolute URL — return as-is, no getImgUrl processing
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return getImgUrl(raw);
};

const ADDRESS_TYPES = ["Home", "Work", "Other"];

const EMPTY_FORM = {
  addressType: "Home",
  fullName: "",
  phone: "",
  pincode: "",
  street: "",
  apartment: "",
  city: "",
  state: "",
  country: "India",
  isDefault: false,
};

const labelStyle = {
  fontSize: 12, color: "#999", textTransform: "uppercase",
  letterSpacing: "0.4px", display: "block", marginBottom: 6,
};

const inp = {
  width: "100%", border: "1px solid #e0e0e0", borderRadius: 6,
  padding: "10px 12px", fontSize: 13, outline: "none",
  marginBottom: 14, color: "#333", background: "#fafafa",
};

const MyAccount = () => {
  const user = useSelector((state) => state.auth?.user);
  const { addresses, activeAddressId, loading: addrLoading } = useSelector((state) => state.address);
  const { orders, loading: ordersLoading } = useSelector((state) => state.order);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const tabFromUrl = new URLSearchParams(search).get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Address States
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [addrErrors, setAddrErrors] = useState({});

  // Profile States
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  // Password States
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (activeTab === "address" && user?.id) {
      dispatch(fetchAddresses());
    }
  }, [activeTab, user?.id, dispatch]);

  useEffect(() => {
    if (activeTab === "orders" && user?.id) {
      dispatch(fetchOrders());
    }
  }, [activeTab, user?.id, dispatch]);

  useEffect(() => { if (tabFromUrl) setActiveTab(tabFromUrl); }, [tabFromUrl]);

  useEffect(() => {
    if (user) setFormData({ name: user.name || "", email: user.email || "", phone: user.phone || "" });
  }, [user]);

  // ── Profile Validation & Actions ───────────────────────────────────────────
  const validateProfile = () => {
    let newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    const cleanPhone = formData.phone.toString().replace("+91 ", "").trim();
    if (!cleanPhone) {
      newErrors.phone = "Phone number is required";
    } else if (cleanPhone.length < 10) {
      newErrors.phone = "Phone number must be at least 10 digits";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handleUpdateProfile = async () => {
    if (validateProfile()) {
      const success = await updateProfileFunction(dispatch, {
        name: formData.name,
        phone: formData.phone.toString().replace("+91 ", ""),
      });
      if (success) setIsEditingProfile(false);
    }
  };

  // ── Password Validation & Actions ──────────────────────────────────────────
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handleUpdatePassword = async () => {
    let newErrors = {};
    if (!passwordData.currentPassword) newErrors.currentPassword = "Current password is required";
    if (passwordData.newPassword.length < 6) newErrors.newPassword = "Password must be at least 6 characters";
    if (passwordData.newPassword !== passwordData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Call the service
    const success = await updatePasswordService(passwordData);
    
    if (success) {
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setErrors({});
    }
  };

  // ── Common Helpers ─────────────────────────────────────────────────────────
  const handleLogout = () => {
    dispatch(clearAddresses());
    dispatch(logoutAction());
    cogoToast.success("Logged out successfully", { position: "top-center" });
    navigate(process.env.PUBLIC_URL + "/");
  };

  // Shared ErrorMsg — same style as SignUpLayer
  const ErrorMsg = ({ field, errObj = errors }) =>
    errObj[field] ? (
      <div className="text-danger mt-1 fw-medium" style={{ fontSize: "11px" }}>
        {errObj[field]}
      </div>
    ) : null;

  // ── Address form helpers ───────────────────────────────────────────────────
  const openAddForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setAddrErrors({});
    setShowForm(true);
  };

  const openEditForm = (addr) => {
    setEditingId(addr.id);
    setForm({
      addressType: addr.addressType || "Home",
      fullName: addr.fullName || "",
      phone: addr.phone || "",
      pincode: addr.pincode || "",
      street: addr.street || "",
      apartment: addr.apartment || "",
      city: addr.city || "",
      state: addr.state || "",
      country: addr.country || "India",
      isDefault: addr.isDefault || false,
    });
    setAddrErrors({});
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (addrErrors[name]) setAddrErrors((prev) => ({ ...prev, [name]: null }));
  };

  // ── Address Validation ─────────────────────────────────────────────────────
  const validateAddressForm = () => {
    const newErrors = {};
    if (!form.fullName?.trim()) newErrors.fullName = "Full name is required";
    if (!form.phone?.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (form.phone.length < 10) {
      newErrors.phone = "Phone number must be 10 digits";
    }
    if (!form.pincode?.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (form.pincode.length < 6) {
      newErrors.pincode = "Pincode must be 6 digits";
    }
    if (!form.street?.trim()) newErrors.street = "Street address is required";
    if (!form.city?.trim()) newErrors.city = "City is required";
    if (!form.state?.trim()) newErrors.state = "State is required";
    setAddrErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async () => {
    if (!validateAddressForm()) return;

    const ok = editingId
      ? await dispatch(updateAddressService(editingId, form))
      : await dispatch(addAddressService(form));

    if (ok) {
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      setAddrErrors({});
    }
  };

const handleDelete = (id) => {
  const { hide } = cogoToast.loading(
    <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: "240px", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
        <i className="fa fa-trash-o" style={{ color: "#d9534f", fontSize: 18 }}></i>
        <strong style={{ fontSize: 14, color: "#333" }}>Delete Address?</strong>
      </div>
      
      <p style={{ fontSize: 12, color: "#666", margin: 0 }}>
        This will permanently remove this address from your account.
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 6, justifyContent: "center" }}>
        <button
          onClick={() => hide()} // Correctly closes the toast on cancel
          style={{
            fontSize: 12, padding: "6px 12px", borderRadius: 6,
            border: "1px solid #e0e0e0", background: "#fff",
            color: "#777", cursor: "pointer", fontWeight: 500
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => {
            hide(); // This ensures the confirmation UI is destroyed immediately
            dispatch(deleteAddressService(id)); 
            // REMOVED: cogoToast.success here to prevent double toasts
          }}
          style={{
            fontSize: 12, padding: "6px 14px", borderRadius: 6,
            border: "none", background: "#db1a5d",
            color: "#fff", cursor: "pointer", fontWeight: 600
          }}
        >
          Delete
        </button>
      </div>
    </div>,
    { 
      position: "top-center", 
      hideAfter: 0, // This makes the toast permanent until hide() is called
      onClick: () => {} 
    }
  );
};

  const handleSetDefault = (id) => {
    dispatch(setDefaultAddressService(id));
  };

  const handleSelectActive = (id) => {
    dispatch(setActiveAddress(id));
  };


  const [showPasswords, setShowPasswords] = useState({
  current: false,
  new: false,
  confirm: false,
});

const toggleVisibility = (field) => {
  setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
};

  return (
    <Fragment>
      <SEO titleTemplate="My Account" />
      <LayoutOne headerTop="visible">
        <Breadcrumb pages={[{ label: "Home", path: "/" }, { label: "Account", path: pathname }]} />

        <div className="full-account-area pt-20 pb-20">
          <div className="container">
            <div className="row">

              {/* Sidebar */}
              <div className="col-lg-3">
                <div className="account-side-nav">
                  <div className="nav-header">
                    <div className="avatar-box">{user?.name ? user.name.charAt(0).toUpperCase() : "U"}</div>
                    <h5>{user?.name || "Guest User"}</h5>
                    <p>{user?.email || "No email provided"}</p>
                  </div>
                  <div className="nav-links">
                    {[
                      { id: "profile", icon: "fa-user", label: "Profile Info" },
                      { id: "orders", icon: "fa-shopping-basket", label: "My Orders" },
                      { id: "address", icon: "fa-map-marker", label: "Saved Addresses" },
                      { id: "password", icon: "fa-lock", label: "Security" },
                    ].map(({ id, icon, label }) => (
                      <button
                        key={id}
                        className={activeTab === id ? "active" : ""}
                        onClick={() => { setActiveTab(id); setIsEditingProfile(false); setShowForm(false); setErrors({}); setAddrErrors({}); }}
                      >
                        <i className={`fa ${icon}`}></i> {label}
                      </button>
                    ))}
                    <button className="logout-link" onClick={handleLogout}>
                      <i className="fa fa-sign-out"></i> Logout
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="col-lg-9">
                <div className="account-main-content">

                  {/* PROFILE TAB */}
                  {activeTab === "profile" && (
                    <div className="tab-card animate-fade-in">
                      <div className="tab-header-flex d-flex justify-content-between align-items-center">
                        <h3>Personal Information</h3>
                        {!isEditingProfile && (
                          <button className="add-new-pill" onClick={() => setIsEditingProfile(true)}>
                            <i className="fa fa-edit"></i> Edit Profile
                          </button>
                        )}
                      </div>
                      {!isEditingProfile ? (
                        <div className="profile-view-details mt-4">
                          <div className="row g-4">
                            <div className="col-md-12">
                              <label className="text-muted small d-block mb-1">USER NAME</label>
                              <p className="fw-bold fs-5">{user?.name}</p>
                            </div>
                            <div className="col-md-6">
                              <label className="text-muted small d-block mb-1">EMAIL ADDRESS</label>
                              <p className="fw-bold fs-5">{user?.email}</p>
                            </div>
                            <div className="col-md-6">
                              <label className="text-muted small d-block mb-1">PHONE NUMBER</label>
                              <p className="fw-bold fs-5">+91 {user?.phone}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="profile-edit-form animate-fade-in mt-4">
                          <div className="row g-3">
                            <div className="col-md-12">
                              <label>User Name</label>
                              <input 
                                type="text" 
                                name="name" 
                                className="full-input" 
                                value={formData.name} 
                                onChange={handleProfileChange}
                                style={errors.name ? { borderColor: "#db1a5d" } : {}}
                              />
                              <ErrorMsg field="name" />
                            </div>
                            <div className="col-md-6">
                              <label>Email Address (Read Only)</label>
                              <input type="email" className="full-input" value={user?.email} disabled style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }} />
                            </div>
                            <div className="col-md-6">
                              <label>Phone Number</label>
                              <input 
                                type="tel" 
                                name="phone" 
                                className="full-input" 
                                placeholder="10-digit number" 
                                value={formData.phone} 
                                onChange={handleProfileChange}
                                style={errors.phone ? { borderColor: "#db1a5d" } : {}}
                              />
                              <ErrorMsg field="phone" />
                            </div>
                            <div className="col-12 mt-20 d-flex gap-3 justify-content-center">
                              <button className="full-btn-dark" onClick={handleUpdateProfile}>Save Changes</button>
                              <button className="full-btn-light" onClick={() => { setIsEditingProfile(false); setErrors({}); }}>Cancel</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ORDERS TAB */}
                  {activeTab === "orders" && (
                    <div className="tab-card animate-fade-in">
                      <h3>Order History</h3>
                      <div className="order-list-container mt-4">
                        {ordersLoading && <p style={{ color: "#999", fontSize: 13 }}>Loading orders...</p>}
                        {!ordersLoading && orders.length === 0 && (
                          <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}>
                            <i className="fa fa-shopping-bag" style={{ fontSize: 40, marginBottom: 12, display: "block" }}></i>
                            <p>No orders yet. Start shopping!</p>
                          </div>
                        )}
                        {!ordersLoading && orders.length > 0 && orders.map((order) => (
                          <div className="order-main-card" key={order.id}>
                            <div className="order-card-header">
                              <div className="header-left">
                                <span className="order-label">Order</span>
                                <span className="order-number">#{order.id}</span>
                              </div>
                              <div className="header-right">
                                <span className={`status-pill ${order.status?.toLowerCase() || 'pending'}`}>{order.status || 'Pending'}</span>
                              </div>
                            </div>
                            <div className="order-card-body">
                              {Array.isArray(order.items) && order.items.map((item, i) => (
                                <div className="product-row" key={i}>
                                  <div className="product-img">
                                    <img src={getOrderItemImage(item.image)} alt={item.productName || "Product"} onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} />
                                  </div>
                                  <div className="product-details">
                                    <h6>{item.productName || "Product"}</h6>
                                    <p>Qty: {item.quantity}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="order-card-footer">
                              <div className="footer-left"><p>Placed on: <strong>{new Date(order.createdAt).toLocaleDateString()}</strong></p></div>
                              <div className="footer-right">
                                <span className="order-total-price">Total: ₹{order.totalAmount}</span>
                                <Link to={`/order-details/${order.id}`} className="btn-view-order">Details</Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ADDRESS TAB */}
                  {activeTab === "address" && (
                    <div className="tab-card animate-fade-in">
                      <div className="tab-header-flex d-flex justify-content-between align-items-center mb-3">
                        <h3 style={{ margin: 0 }}>Saved Addresses</h3>
                        {!showForm && (
                          <button className="add-new-pill" onClick={openAddForm}>
                            <i className="fa fa-plus"></i> Add New Address
                          </button>
                        )}
                      </div>

                      {!showForm && (
                        <>
                          {addrLoading && <p style={{ color: "#999", fontSize: 13 }}>Loading...</p>}
                          {!addrLoading && addresses.length === 0 && (
                            <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}>
                              <i className="fa fa-map-marker" style={{ fontSize: 40, marginBottom: 12, display: "block" }}></i>
                              <p>No saved addresses yet.</p>
                              
                            </div>
                          )}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginTop: 8 }}>
                            {addresses.map((addr) => {
                              const isActive = addr.id === activeAddressId;
                              const isDef = addr.isDefault;
                              return (
                                <div
                                  key={addr.id}
                                  onClick={() => handleSelectActive(addr.id)}
                                  style={{
                                    border: `2px solid ${isActive ? "#db1a5d" : "#e8e8e8"}`,
                                    borderRadius: 10,
                                    padding: "16px 18px",
                                    cursor: "pointer",
                                    background: isActive ? "#fdf0ff" : "#fff",
                                    transition: "all 0.2s",
                                    position: "relative",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, background: isActive ? "#db1a5d" : "#f0f0f0", color: isActive ? "#fff" : "#555", padding: "2px 10px", borderRadius: 20 }}>
                                      {addr.addressType || "Home"}
                                    </span>
                                    {isDef && (
                                      <span style={{ fontSize: 11, fontWeight: 600, background: "#e8f5e9", color: "#2e7d32", padding: "2px 10px", borderRadius: 20 }}>
                                        Default
                                      </span>
                                    )}
                                    {isActive && (
                                      <span style={{ marginLeft: "auto", color: "#db1a5d" }}>
                                        <i className="fa fa-check-circle"></i>
                                      </span>
                                    )}
                                  </div>
                                  <p style={{ fontWeight: 600, margin: "0 0 4px", fontSize: 14, color: "#222" }}>{addr.fullName}</p>
                                  <p style={{ margin: "0 0 2px", fontSize: 13, color: "#555", lineHeight: 1.5 }}>
                                    {addr.street}{addr.apartment ? `, ${addr.apartment}` : ""}
                                  </p>
                                  <p style={{ margin: "0 0 2px", fontSize: 13, color: "#555" }}>
                                    {addr.city}, {addr.state} - {addr.pincode}
                                  </p>
                                  <p style={{ margin: "0 0 10px", fontSize: 13, color: "#555" }}>{addr.country}</p>
                                  <p style={{ margin: 0, fontSize: 13, color: "#777" }}>
                                    <i className="fa fa-phone" style={{ marginRight: 5 }}></i>{addr.phone}
                                  </p>
                                  <div style={{ display: "flex", gap: 10, marginTop: 14, borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); openEditForm(addr); }}
                                      style={{ fontSize: 12, color: "#db1a5d", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}
                                    >
                                      <i className="fa fa-edit"></i> Edit
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDelete(addr.id); }}
                                      style={{ fontSize: 12, color: "#d9534f", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}
                                    >
                                      <i className="fa fa-trash"></i> Remove
                                    </button>
                                    {!isDef && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleSetDefault(addr.id); }}
                                        style={{ fontSize: 12, color: "#2e7d32", background: "none", border: "none", cursor: "pointer", padding: 0, marginLeft: "auto", fontWeight: 600 }}
                                      >
                                        <i className="fa fa-star-o"></i> Set Default
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}

                      {showForm && (
                        <div className="animate-fade-in" style={{ marginTop: 8 }}>
                          <h5 style={{ marginBottom: 20, fontWeight: 600, fontSize: 16 }}>
                            {editingId ? "Edit Address" : "Add New Address"}
                          </h5>
                          <div style={{ marginBottom: 16 }}>
                            <label style={{ ...labelStyle, marginBottom: 8 }}>Address Type</label>
                            <div style={{ display: "flex", gap: 10 }}>
                              {ADDRESS_TYPES.map((type) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => setForm((p) => ({ ...p, addressType: type }))}
                                  style={{
                                    padding: "7px 18px",
                                    borderRadius: 20,
                                    border: `1.5px solid ${form.addressType === type ? "#db1a5d" : "#e0e0e0"}`,
                                    background: form.addressType === type ? "#fdf0ff" : "#fff",
                                    color: form.addressType === type ? "#a020c0" : "#555",
                                    fontWeight: form.addressType === type ? 600 : 400,
                                    fontSize: 13,
                                    cursor: "pointer",
                                    transition: "all 0.15s",
                                  }}
                                >
                                  {type === "Home" ? "🏠" : type === "Work" ? "💼" : "📍"} {type}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="row g-3">
                            <div className="col-md-6">
                              <label style={labelStyle}>Full Name *</label>
                              <input
                                name="fullName"
                                style={{ ...inp, ...(addrErrors.fullName ? { borderColor: "#d9534f", marginBottom: 4 } : {}) }}
                                placeholder="Enter full name"
                                value={form.fullName}
                                onChange={handleFormChange}
                              />
                              <ErrorMsg field="fullName" errObj={addrErrors} />
                            </div>
                            <div className="col-md-6">
                              <label style={labelStyle}>Phone Number *</label>
                              <input
                                name="phone"
                                style={{ ...inp, ...(addrErrors.phone ? { borderColor: "#d9534f", marginBottom: 4 } : {}) }}
                                placeholder="10-digit mobile number"
                                value={form.phone}
                                maxLength={10}
                                onChange={(e) => { if (/^\d*$/.test(e.target.value)) handleFormChange(e); }}
                              />
                              <ErrorMsg field="phone" errObj={addrErrors} />
                            </div>
                            <div className="col-md-4">
                              <label style={labelStyle}>Pincode *</label>
                              <input
                                name="pincode"
                                style={{ ...inp, ...(addrErrors.pincode ? { borderColor: "#d9534f", marginBottom: 4 } : {}) }}
                                placeholder="6-digit pincode"
                                value={form.pincode}
                                maxLength={6}
                                onChange={(e) => { if (/^\d*$/.test(e.target.value)) handleFormChange(e); }}
                              />
                              <ErrorMsg field="pincode" errObj={addrErrors} />
                            </div>
                            <div className="col-md-4">
                              <label style={labelStyle}>City / Town *</label>
                              <input
                                name="city"
                                style={{ ...inp, ...(addrErrors.city ? { borderColor: "#d9534f", marginBottom: 4 } : {}) }}
                                placeholder="City"
                                value={form.city}
                                onChange={handleFormChange}
                              />
                              <ErrorMsg field="city" errObj={addrErrors} />
                            </div>
                            <div className="col-md-4">
                              <label style={labelStyle}>State *</label>
                              <input
                                name="state"
                                style={{ ...inp, ...(addrErrors.state ? { borderColor: "#d9534f", marginBottom: 4 } : {}) }}
                                placeholder="State"
                                value={form.state}
                                onChange={handleFormChange}
                              />
                              <ErrorMsg field="state" errObj={addrErrors} />
                            </div>
                            <div className="col-12">
                              <label style={labelStyle}>Street Address *</label>
                              <input
                                name="street"
                                style={{ ...inp, ...(addrErrors.street ? { borderColor: "#d9534f", marginBottom: 4 } : {}) }}
                                placeholder="House no., Building, Street name"
                                value={form.street}
                                onChange={handleFormChange}
                              />
                              <ErrorMsg field="street" errObj={addrErrors} />
                            </div>
                            <div className="col-12">
                              <label style={labelStyle}>Apartment / Floor / Landmark (Optional)</label>
                              <input name="apartment" style={inp} placeholder="Apartment, suite, unit, landmark etc." value={form.apartment} onChange={handleFormChange} />
                            </div>
                            <div className="col-md-6">
                              <label style={labelStyle}>Country</label>
                              <input name="country" style={inp} placeholder="Country" value={form.country} onChange={handleFormChange} />
                            </div>
                            <div className="col-md-6" style={{ display: "flex", alignItems: "center", paddingTop: 24 }}>
                              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "#444", userSelect: "none" }}>
                                <input
                                  type="checkbox"
                                  name="isDefault"
                                  checked={form.isDefault}
                                  onChange={handleFormChange}
                                  style={{ width: 16, height: 16, accentColor: "#db1a5d", cursor: "pointer" }}
                                />
                                Set as default address
                              </label>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                            <button
                              onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); setAddrErrors({}); }}
                              style={{ padding: "10px 24px", borderRadius: 6, border: "1.5px solid #e0e0e0", background: "#fff", color: "#555", fontSize: 13, cursor: "pointer", fontWeight: 500 }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleFormSubmit}
                              disabled={addrLoading}
                              style={{ padding: "10px 28px", borderRadius: 6, border: "none", background: "#db1a5d", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: addrLoading ? 0.7 : 1 }}
                            >
                              {addrLoading ? "Saving..." : editingId ? "Update Address" : "Save Address"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECURITY (PASSWORD) TAB */}
                  {activeTab === "password" && (
                    <div className="tab-card animate-fade-in">
                      <h3>Update Password</h3>
                      <div className="row g-3 mt-2">
                        
                        {/* Current Password */}
                        <div className="col-12">
                          <label>Current Password</label>
                          <div style={{ position: "relative" }}>
                            <input 
                              type={showPasswords.current ? "text" : "password"} 
                              name="currentPassword"
                              className="full-input" 
                              value={passwordData.currentPassword}
                              onChange={handlePasswordChange}
                              style={{
                                paddingRight: "40px", // space for icon
                                ...(errors.currentPassword ? { borderColor: "#d9534f" } : {})
                              }}
                            />
                            <i 
                              className={`fa ${showPasswords.current ? "fa-eye-slash" : "fa-eye"}`}
                              onClick={() => toggleVisibility("current")}
                              style={{
                                position: "absolute", right: "12px", top: "50%",
                                transform: "translateY(-50%)", cursor: "pointer", color: "#999"
                              }}
                            ></i>
                          </div>
                          <ErrorMsg field="currentPassword" />
                        </div>

                        {/* New Password */}
                        <div className="col-md-6">
                          <label>New Password</label>
                          <div style={{ position: "relative" }}>
                            <input 
                              type={showPasswords.new ? "text" : "password"} 
                              name="newPassword"
                              className="full-input" 
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              style={{
                                paddingRight: "40px",
                                ...(errors.newPassword ? { borderColor: "#d9534f" } : {})
                              }}
                            />
                            <i 
                              className={`fa ${showPasswords.new ? "fa-eye-slash" : "fa-eye"}`}
                              onClick={() => toggleVisibility("new")}
                              style={{
                                position: "absolute", right: "12px", top: "50%",
                                transform: "translateY(-50%)", cursor: "pointer", color: "#999"
                              }}
                            ></i>
                          </div>
                          <ErrorMsg field="newPassword" />
                        </div>

                        {/* Confirm Password */}
                        <div className="col-md-6">
                          <label>Confirm New Password</label>
                          <div style={{ position: "relative" }}>
                            <input 
                              type={showPasswords.confirm ? "text" : "password"} 
                              name="confirmPassword"
                              className="full-input" 
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              style={{
                                paddingRight: "40px",
                                ...(errors.confirmPassword ? { borderColor: "#d9534f" } : {})
                              }}
                            />
                            <i 
                              className={`fa ${showPasswords.confirm ? "fa-eye-slash" : "fa-eye"}`}
                              onClick={() => toggleVisibility("confirm")}
                              style={{
                                position: "absolute", right: "12px", top: "50%",
                                transform: "translateY(-50%)", cursor: "pointer", color: "#999"
                              }}
                            ></i>
                          </div>
                          <ErrorMsg field="confirmPassword" />
                        </div>

                        <div className="col-12 mt-3">
                          <button className="full-btn-dark" onClick={handleUpdatePassword}>
                            Update Password
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default MyAccount;