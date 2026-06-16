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

const FALLBACK_IMG = "/assets/img/logo.png";

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
        setReturnQuantity(matchedItem.quantity || 1);
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
      formData.append("return_quantity", returnQuantity);
      formData.append("comments", comments);

      if (videoFile) {
        formData.append("video", videoFile);
      }
      
      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      const res = await dispatch(submitReturnRequest(formData));
      if (res && res.id) {
        navigate(`/return-tracking/${res.id}`);
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
        <div className="login-register-area pt-100 pb-100">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="login-register-wrapper">
                  <div className="login-form-container" style={{ padding: "40px" }}>
                    <div className="login-register-title mb-30">
                      <h2>Request Return / Replacement</h2>
                      <p style={{ fontSize: "14px", color: "#666" }}>
                        Submit your return/replacement request for product level processing.
                      </p>
                    </div>

                    {item && (
                      <div className="return-req-item-summary">
                        <img
                          src={getOrderItemImage(item.image)}
                          alt={item.productName}
                          className="return-req-item-img"
                          onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }}
                        />
                        <div className="return-req-item-info">
                          <h6>{item.productName}</h6>
                          <p>
                            {item.selectedVariantName || "Default variant"}
                          </p>
                          <p style={{ fontWeight: 600, color: "#111", marginTop: "4px" }}>
                            Purchased Qty: {item.quantity} · Price: ₹{parseFloat(item.salesPrice || item.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSubmit}>
                      <div className="mb-4">
                        <label style={{ fontWeight: 600, marginBottom: "8px", display: "block" }}>
                          Select Request Type
                        </label>
                        <div style={{ display: "flex", gap: "24px" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="returnType"
                              value="refund"
                              checked={returnType === "refund"}
                              onChange={() => setReturnType("refund")}
                              style={{ width: "auto", margin: 0 }}
                            />
                            Refund to Source Account
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="returnType"
                              value="replacement"
                              checked={returnType === "replacement"}
                              onChange={() => setReturnType("replacement")}
                              style={{ width: "auto", margin: 0 }}
                            />
                            Replacement Item
                          </label>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label style={{ fontWeight: 600, marginBottom: "8px", display: "block" }}>
                          Reason for Return
                        </label>
                        <select
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "4px",
                            fontSize: "14px",
                          }}
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

                      <div className="mb-4">
                        <label style={{ fontWeight: 600, marginBottom: "8px", display: "block" }}>
                          Return Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={item?.quantity || 1}
                          value={returnQuantity}
                          onChange={(e) => setReturnQuantity(parseInt(e.target.value, 10))}
                          style={{
                            width: "120px",
                            padding: "10px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "4px",
                          }}
                          required
                        />
                      </div>

                      <div className="mb-4">
                        <label style={{ fontWeight: 600, marginBottom: "8px", display: "block" }}>
                          Comments / Explanations
                        </label>
                        <textarea
                          placeholder="Provide details about the issue..."
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          rows="4"
                          style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "4px",
                            fontSize: "14px",
                          }}
                        />
                      </div>

                      <div className="mb-4">
                        <label style={{ fontWeight: 600, marginBottom: "4px", display: "block" }}>
                          Proof of Issue (At least one is required)
                        </label>
                        <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>
                          Please upload box opening unboxing video OR clear supporting images. Max video: 50MB (MP4/MOV). Max images: 5MB each, up to 10 photos.
                        </p>

                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <div className="return-upload-zone" onClick={() => document.getElementById("video-input").click()}>
                              <i className="fa fa-video-camera"></i>
                              <p>{videoFile ? videoFile.name : "Upload Unboxing Video"}</p>
                              <span>{videoFile ? `${(videoFile.size / (1024 * 1024)).toFixed(1)} MB` : "Required if no images"}</span>
                            </div>
                            <input
                              type="file"
                              id="video-input"
                              accept="video/mp4,video/quicktime"
                              onChange={handleVideoChange}
                              style={{ display: "none" }}
                            />
                            {videoFile && (
                              <button
                                type="button"
                                onClick={removeVideo}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#dc2626",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                <i className="fa fa-trash"></i> Remove Video
                              </button>
                            )}
                          </div>

                          <div className="col-md-6 mb-3">
                            <div className="return-upload-zone" onClick={() => document.getElementById("images-input").click()}>
                              <i className="fa fa-camera"></i>
                              <p>Upload Images ({imageFiles.length})</p>
                              <span>Required if no video</span>
                            </div>
                            <input
                              type="file"
                              id="images-input"
                              multiple
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleImagesChange}
                              style={{ display: "none" }}
                            />
                          </div>
                        </div>

                        {imageFiles.length > 0 && (
                          <div className="return-proof-preview">
                            {imageFiles.map((file, idx) => (
                              <div className="return-proof-preview-item" key={idx}>
                                <img src={URL.createObjectURL(file)} alt="preview" />
                                <button type="button" className="remove-btn" onClick={() => removeImage(idx)}>
                                  &times;
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <label style={{ fontWeight: 600, marginBottom: "8px", display: "block" }}>
                          Customer Contact Details (Verified)
                        </label>
                        <div style={{ padding: "12px", backgroundColor: "#f9fafb", borderRadius: "4px", border: "1px solid #e5e7eb" }}>
                          <p style={{ margin: "0 0 4px 0", fontSize: "13px" }}>Email: <strong>{user?.email || "—"}</strong></p>
                          <p style={{ margin: 0, fontSize: "13px" }}>Phone: <strong>{user?.phone || "—"}</strong></p>
                        </div>
                      </div>

                      <div className="button-box">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          style={{
                            backgroundColor: "#db1a5d",
                            color: "#fff",
                            padding: "12px 30px",
                            fontSize: "14px",
                            fontWeight: 700,
                            border: "none",
                            borderRadius: "50px",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                          }}
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
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default ReturnRequest;
