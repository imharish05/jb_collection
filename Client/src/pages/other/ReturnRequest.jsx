import { Fragment, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import api from "../../api/axios";
import { submitReturnRequest } from "../../store/services/returnService";
import cogoToast from "cogo-toast";
import { getImgUrl } from "../../helpers/imageUrl";
import { isColourKey, isHexColor } from "../../helpers/product";
import "./ReturnRequest.css";

const FALLBACK_IMG = "/assets/img/logo.png";

// Strip old variant suffix from productName (e.g. "Gifts (Colour: #000000)" → "Gifts")
const cleanProductName = (name) => {
  if (!name) return "Product";
  const idx = name.indexOf(" (");
  return idx !== -1 ? name.slice(0, idx).trim() : name;
};

const parseJson = (val) => {
  if (!val || typeof val !== "string") return val;
  try { return JSON.parse(val); } catch { return val; }
};

const deepParse = (val) => {
  let result = val;
  for (let i = 0; i < 5; i++) {
    if (typeof result !== "string") break;
    const next = parseJson(result);
    if (next === result) break;
    result = next;
  }
  return result;
};

const getOrderItemImage = (img) => {
  if (!img) return FALLBACK_IMG;
  const unwrapped = deepParse(img);
  const raw = Array.isArray(unwrapped) ? unwrapped[0] : (typeof unwrapped === "string" ? unwrapped : null);
  if (!raw) return FALLBACK_IMG;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return getImgUrl(raw);
};

const getOrderVariantAttrs = (item) => {
  if (Array.isArray(item?.variantAttributes) && item.variantAttributes.length > 0) {
    return item.variantAttributes.filter((attr) => attr?.key && attr?.value && attr.key !== "Custom Note");
  }

  if (!item?.selectedVariantName) return [];

  const parts = String(item.selectedVariantName)
    .split(/(?:\s*·\s*|\s*\/\s*)/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.reduce((acc, part) => {
    const idx = part.indexOf(":");
    if (idx === -1) return acc;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key && value) acc.push({ key, value });
    return acc;
  }, []);
};

const renderOrderVariantChips = (item) => {
  const attrs = getOrderVariantAttrs(item);
  if (!attrs.length) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
      {attrs.map((attr, idx) => {
        const key = attr.key;
        const value = attr.value;
        const isColour = isColourKey(key);
        const showSwatch = isColour && isHexColor(value);

        return (
          <span
            key={`${key}-${value}-${idx}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "#f7f7f7",
              border: "1px solid #eee",
              borderRadius: "999px",
              padding: "2px 6px",
            }}
          >
            <span style={{ fontSize: 11, color: "#888" }}>{key}:</span>
            {showSwatch ? (
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  border: "1px solid #dcdcdc",
                  backgroundColor: value,
                  display: "inline-block",
                  flexShrink: 0,
                }}
                title={value}
              />
            ) : (
              <span style={{ fontSize: 11, color: "#444" }}>{value}</span>
            )}
          </span>
        );
      })}
    </div>
  );
};

const ReturnRequest = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth?.user);

  // Parse query params
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get("orderId");
  const itemId = searchParams.get("itemId");

  const [order, setOrder] = useState(null);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [returnType, setReturnType] = useState(searchParams.get("type") || "refund");
  const [reason, setReason] = useState("");
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [comments, setComments] = useState("");
  
  // File uploads
  const [videoFile, setVideoFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!orderId || !itemId) {
      cogoToast.error("Missing Order ID or Item ID params", { position: "top-center" });
      navigate("/my-account?tab=orders");
      return;
    }

    setLoading(true);
    api.get(`/orders/${orderId}`)
      .then((res) => {
        const orderData = res.data;
        setOrder(orderData);
        const matchedItem = orderData?.items?.find((i) => i.id === itemId);
        if (!matchedItem) {
          cogoToast.error("Item not found in this order", { position: "top-center" });
          navigate("/my-account?tab=orders");
          return;
        }
        setItem(matchedItem);
        setReturnQuantity(Math.max(1, Number(matchedItem.quantity) || 1));
      })
      .catch((err) => {
        console.error(err);
        cogoToast.error("Failed to fetch order details", { position: "top-center" });
        navigate("/my-account?tab=orders");
      })
      .finally(() => setLoading(false));
  }, [orderId, itemId, navigate]);

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      cogoToast.error("Video file size exceeds 50MB limit", { position: "top-center" });
      return;
    }
    setVideoFile(file);
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Total count check
    if (imageFiles.length + files.length > 10) {
      cogoToast.error("You can upload a maximum of 10 images", { position: "top-center" });
      return;
    }

    const validFiles = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        cogoToast.error(`Image ${file.name} exceeds 5MB limit`, { position: "top-center" });
      } else {
        validFiles.push(file);
      }
    }

    setImageFiles((prev) => [...prev, ...validFiles]);
  };

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setVideoFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason) {
      cogoToast.error("Please select a reason for the return", { position: "top-center" });
      return;
    }

    const maxAllowedQty = Math.max(1, Number(item?.quantity) || 1);
    const safeQty = Math.max(1, Math.min(maxAllowedQty, Number(returnQuantity) || 1));

    if (safeQty !== Number(returnQuantity)) {
      setReturnQuantity(safeQty);
    }

    if (!videoFile && imageFiles.length === 0) {
      cogoToast.error("Please upload at least one proof (unboxing video or images)", { position: "top-center" });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("orderItemId", itemId);
      formData.append("returnType", returnType);
      formData.append("reason", reason);
      formData.append("return_quantity", safeQty);
      formData.append("comments", comments);

      if (videoFile) {
        formData.append("video", videoFile);
      }
      
      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      const res = await dispatch(submitReturnRequest(formData));
      if (res && res.id) {
        navigate(`/return-tracking/${res.referenceSlug || res.id}`);
      } else {
        navigate("/my-account?tab=orders");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Fragment>
        <SEO titleTemplate="Return Request" />
        <LayoutOne headerTop="visible">
          <div className="pt-100 pb-100 text-center">
            <p>Loading details...</p>
          </div>
        </LayoutOne>
      </Fragment>
    );
  }

  const maxReturnQty = Math.max(1, Number(item?.quantity) || 1);
  const itemVariantChips = renderOrderVariantChips(item);

  return (
    <Fragment>
      <SEO titleTemplate="Return Request" />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Home", path: "/" },
            { label: "Return Request", path: location.pathname },
          ]}
        />
        <div className="rr-page">
          <div className="rr-container">
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="rr-card">

                  <div className="rr-card-header">
                    <h2 className="rr-card-title">Request Return / Replacement</h2>
                    <p className="rr-card-subtitle">
                      Submit your return or replacement request. Our review team will process it within 24 hours.
                    </p>
                  </div>

                  {item && (
                    <div className="rr-item-summary">
                      <img
                        src={getOrderItemImage(item.image)}
                        alt={cleanProductName(item.productName)}
                        className="rr-item-img"
                        onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }}
                      />
                      <div className="rr-item-body">
                        <span className="rr-item-badge">Item Summary</span>
                        <h6 className="rr-item-name">{cleanProductName(item.productName)}</h6>
                        <div className="rr-item-variant">
                          {itemVariantChips || (
                            <p style={{ margin: 0 }}>
                              Variant: <strong>{item.selectedVariantName || "Default"}</strong>
                            </p>
                          )}
                        </div>
                        <p className="rr-item-meta">
                          Quantity: {maxReturnQty} · Price: ₹{parseFloat(item.salesPrice || item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    {/* Request Type Selection Cards */}
                    <div className="rr-field">
                      <label className="rr-section-label">
                        Select Request Type
                      </label>
                      <div className="rr-type-grid">

                        <div
                          onClick={() => setReturnType("refund")}
                          className={`rr-type-card ${returnType === "refund" ? "active" : ""}`}
                        >
                          <input
                            type="radio"
                            name="returnType"
                            value="refund"
                            checked={returnType === "refund"}
                            onChange={() => setReturnType("refund")}
                            className="rr-type-radio"
                          />
                          <div>
                            <strong className="rr-type-label">Refund to Source</strong>
                            <span className="rr-type-desc">Money returned back to your original payment method.</span>
                          </div>
                        </div>

                        <div
                          onClick={() => setReturnType("replacement")}
                          className={`rr-type-card ${returnType === "replacement" ? "active" : ""}`}
                        >
                          <input
                            type="radio"
                            name="returnType"
                            value="replacement"
                            checked={returnType === "replacement"}
                            onChange={() => setReturnType("replacement")}
                            className="rr-type-radio"
                          />
                          <div>
                            <strong className="rr-type-label">Replacement Item</strong>
                            <span className="rr-type-desc">Receive a fresh item of the exact same specifications.</span>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Dropdown reason */}
                    <div className="rr-field">
                      <label className="rr-field-label">
                        Reason for Return
                      </label>
                      <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="rr-select"
                        required
                      >
                        <option value="">-- Choose Reason --</option>
                        <option value="damaged_product">Product Received Damaged</option>
                        <option value="defective_product">Product Received Defective</option>
                        <option value="wrong_product">Incorrect Product Received</option>
                        <option value="different_from_description">Product Different From Website Description</option>
                        <option value="shipping_damage">Damaged in Transit / Shipping Damage</option>
                        <option value="other">Other Reason</option>
                      </select>
                    </div>

                    {/* Quantity row */}
                    <div className="rr-field">
                      <label className="rr-field-label">
                        Return Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={maxReturnQty}
                        value={returnQuantity}
                        onChange={(e) => {
                          const parsed = parseInt(e.target.value, 10);
                          const next = Number.isNaN(parsed)
                            ? 1
                            : Math.max(1, Math.min(maxReturnQty, parsed));
                          setReturnQuantity(next);
                        }}
                        className="rr-input rr-input--narrow"
                        required
                      />
                    </div>

                    {/* Comments description */}
                    <div className="rr-field">
                      <label className="rr-field-label">
                        Comments / Explanations
                      </label>
                      <textarea
                        placeholder="Provide details about the issue..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        rows="4"
                        className="rr-textarea"
                      />
                    </div>

                    {/* File uploads section */}
                    <div className="rr-upload-section">
                      <label className="rr-upload-header">
                        Proof of Issue (At least one is required)
                      </label>
                      <p className="rr-upload-hint">
                        Please upload box opening unboxing video OR clear supporting images. Max video: 50MB (MP4/MOV). Max images: 5MB each, up to 10 photos.
                      </p>

                      <div className="rr-upload-grid">
                        <div>
                          <div
                            className={`rr-upload-zone ${videoFile ? "has-file" : ""}`}
                            onClick={() => document.getElementById("video-input").click()}
                          >
                            <i className="fa fa-video-camera rr-upload-icon"></i>
                            <p className="rr-upload-label">
                              {videoFile ? videoFile.name : "Upload Unboxing Video"}
                            </p>
                            <span className="rr-upload-size">{videoFile ? `${(videoFile.size / (1024 * 1024)).toFixed(1)} MB` : "Required if no images"}</span>
                          </div>
                          <input
                            type="file"
                            id="video-input"
                            accept="video/mp4,video/quicktime"
                            onChange={handleVideoChange}
                            className="rr-upload-input"
                          />
                          {videoFile && (
                            <button
                              type="button"
                              onClick={removeVideo}
                              className="rr-remove-file-btn"
                            >
                              <i className="fa fa-trash"></i> Remove Video
                            </button>
                          )}
                        </div>

                        <div>
                          <div
                            className="rr-upload-zone"
                            onClick={() => document.getElementById("images-input").click()}
                          >
                            <i className="fa fa-camera rr-upload-icon"></i>
                            <p className="rr-upload-label">
                              Upload Images ({imageFiles.length})
                            </p>
                            <span className="rr-upload-size">Required if no video</span>
                          </div>
                          <input
                            type="file"
                            id="images-input"
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImagesChange}
                            className="rr-upload-input"
                          />
                        </div>
                      </div>

                      {imageFiles.length > 0 && (
                        <div className="rr-proof-preview">
                          {imageFiles.map((file, idx) => (
                            <div className="rr-proof-item" key={idx}>
                              <img src={URL.createObjectURL(file)} alt="preview" />
                              <button type="button" onClick={() => removeImage(idx)} className="rr-proof-remove">
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Verified Customer box */}
                    <div className="rr-field">
                      <label className="rr-field-label">
                        Customer Contact Details (Verified)
                      </label>
                      <div className="rr-contact-box">
                        <p className="rr-contact-item">
                          Email: <strong>{user?.email || "—"}</strong>
                        </p>
                        <p className="rr-contact-item">
                          Phone: <strong>{user?.phone || "—"}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Button block */}
                    <div className="rr-submit-wrap">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rr-submit-btn"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Return Request"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default ReturnRequest;
