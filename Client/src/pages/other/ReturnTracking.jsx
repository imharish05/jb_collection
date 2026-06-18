import { Fragment, useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import api from "../../api/axios";
import cogoToast from "cogo-toast";

const REFUND_STATUS_LABELS = {
  initiated:        'Initiated — processing with Razorpay',
  completed:        'Refunded ✓',
  failed:           'Refund Failed — contact support',
  manual_pending:   'Pending — will be transferred manually',
  manual_completed: 'Transferred ✓',
  pending:          'Pending',
};

const ReturnTracking = () => {
  const { id } = useParams();
  const [returnReq, setReturnReq] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadReturn = useCallback(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/returns/${id}`)
      .then((res) => {
        setReturnReq(res.data);
      })
      .catch((err) => {
        console.error(err);
        cogoToast.error("Failed to load return details", { position: "top-center" });
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadReturn();
  }, [loadReturn]);

  const stages = [
    { key: "pending_review", label: "Request Submitted", icon: "fa-send" },
    { key: "approved", label: "Under Review", icon: "fa-eye" },
    { key: "pickup_scheduled", label: "Approved / Pickup Scheduled", icon: "fa-calendar" },
    { key: "picked_up", label: "Picked Up", icon: "fa-truck" },
    { key: "inspection_completed", label: "Inspection Done", icon: "fa-search" },
    { key: "refund_initiated", label: "Initiated", icon: "fa-refresh" },
    { key: "refund_completed", label: "Completed / Refunded", icon: "fa-check-circle" },
  ];

  const getActiveStageIndex = (status) => {
    if (!status) return 0;
    if (status === "rejected" || status === "cancelled") return -1;
    
    // Map status strings to stages
    if (status === "pending_review") return 0;
    if (status === "approved") return 1;
    if (status === "pickup_scheduled") return 2;
    if (status === "picked_up") return 3;
    if (status === "inspection_completed") return 4;
    
    if (status === "refund_initiated" || status === "replacement_shipped") return 5;
    if (status === "refund_completed" || status === "replacement_delivered") return 6;
    
    return 0;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending_review: "Pending Review",
      approved: "Approved",
      rejected: "Rejected",
      pickup_scheduled: "Pickup Scheduled",
      picked_up: "Picked Up",
      inspection_completed: "Inspection Completed",
      refund_initiated: "Refund Initiated",
      refund_completed: "Refund Completed",
      replacement_shipped: "Replacement Shipped",
      replacement_delivered: "Replacement Delivered",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <Fragment>
        <SEO titleTemplate="Track Return" />
        <LayoutOne headerTop="visible">
          <div className="pt-100 pb-100 text-center">
            <p>Loading tracking info...</p>
          </div>
        </LayoutOne>
      </Fragment>
    );
  }

  if (!returnReq) {
    return (
      <Fragment>
        <SEO titleTemplate="Return Not Found" />
        <LayoutOne headerTop="visible">
          <div className="pt-100 pb-100 text-center">
            <p>Return request not found</p>
            <Link to="/my-account?tab=orders">Back to Orders</Link>
          </div>
        </LayoutOne>
      </Fragment>
    );
  }

  const activeIndex = getActiveStageIndex(returnReq.status);

  return (
    <Fragment>
      <SEO titleTemplate={`Track Return #${returnReq.referenceSlug || id}`} />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Home", path: "/" },
            { label: "Track Return", path: `/return-tracking/${id}` },
          ]}
        />
        <div className="pt-100 pb-100">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                
                {returnReq.status === "rejected" && (
                  <div className="return-rejection-card">
                    <h6>Request Rejected</h6>
                    <p>Reason: {returnReq.rejectedReason || returnReq.adminNotes || "No details provided by administration"}</p>
                  </div>
                )}

                {returnReq.status === "cancelled" && (
                  <div className="return-rejection-card" style={{ backgroundColor: "#fef2f2", borderColor: "#fca5a5" }}>
                    <h6 style={{ color: "#b91c1c" }}>Request Cancelled</h6>
                    <p style={{ color: "#7f1d1d", margin: 0 }}>This return/replacement request has been cancelled.</p>
                  </div>
                )}

                <div className="return-tracking-card">
                  <h5>Return Summary</h5>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <p style={{ margin: "0 0 6px 0", fontSize: "14px" }}>
                        Return ID: <strong>#{returnReq.referenceSlug || returnReq.id}</strong>
                      </p>
                      <p style={{ margin: "0 0 6px 0", fontSize: "14px" }}>
                        Order ID: <strong>#{returnReq.order?.referenceSlug || returnReq.orderId}</strong>
                      </p>
                      <p style={{ margin: "0 0 6px 0", fontSize: "14px" }}>
                        Product: <strong>{returnReq.orderItem?.productName || "Product"}</strong>
                      </p>
                      {returnReq.orderItem?.selectedVariantName && (
                        <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#666" }}>
                          Variant: {returnReq.orderItem.selectedVariantName}
                        </p>
                      )}
                    </div>
                    <div className="col-md-6 mb-3">
                      <p style={{ margin: "0 0 6px 0", fontSize: "14px" }}>
                        Type: <strong>{returnReq.returnType === "replacement" ? "Replacement" : "Refund"}</strong>
                      </p>
                      <p style={{ margin: "0 0 6px 0", fontSize: "14px" }}>
                        Quantity: <strong>{returnReq.returnQuantity}</strong>
                      </p>
                      <p style={{ margin: "0 0 6px 0", fontSize: "14px" }}>
                        Reason: <strong>{returnReq.reason?.replace(/_/g, " ")}</strong>
                      </p>
                      <p style={{ margin: "0 0 6px 0", fontSize: "14px" }}>
                        Status: <span className={`return-status-badge ${returnReq.status}`}>{getStatusLabel(returnReq.status)}</span>
                      </p>
                    </div>
                  </div>
                  {returnReq.comments && (
                    <div style={{ marginTop: "10px", padding: "12px", background: "#f9fafb", borderRadius: "4px" }}>
                      <label style={{ fontWeight: 600, fontSize: "12px", display: "block", color: "#666" }}>Comments</label>
                      <p style={{ margin: 0, fontSize: "13px" }}>{returnReq.comments}</p>
                    </div>
                  )}
                </div>

                {returnReq.status !== "rejected" && returnReq.status !== "cancelled" && (
                  <div className="return-tracking-card">
                    <h5>Tracking Lifecycle</h5>
                    <div className="return-stepper">
                      {stages.map((stage, idx) => {
                        const isCompleted = idx < activeIndex;
                        const isActive = idx === activeIndex;
                        return (
                          <div
                            key={idx}
                            className={`return-stepper-step ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}
                          >
                            <div className="return-stepper-icon">
                              {isCompleted ? <i className="fa fa-check"></i> : idx + 1}
                            </div>
                            <div className="return-stepper-content">
                              <p className="return-stepper-title">
                                {stage.key === "refund_completed"
                                  ? returnReq.returnType === "replacement"
                                    ? "Replacement Delivered"
                                    : "Refund Completed"
                                  : stage.key === "refund_initiated"
                                  ? returnReq.returnType === "replacement"
                                    ? "Replacement Shipped"
                                    : "Refund Initiated"
                                  : stage.label}
                              </p>
                              {isActive && (
                                <span className="return-stepper-date">Current Step</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ textAlign:'center', marginTop:'12px' }}>
                      <button
                        onClick={loadReturn}
                        disabled={loading}
                        style={{
                          background:'none', border:'1px solid #d1d5db', borderRadius:'6px',
                          padding:'6px 16px', fontSize:'12px', color:'#6b7280',
                          cursor:'pointer', fontWeight:600
                        }}
                      >
                        {loading ? 'Refreshing...' : '↻ Refresh Status'}
                      </button>
                    </div>
                  </div>
                )}

                {returnReq.reverseShipment && (returnReq.reverseShipment.awbCode || returnReq.reverseShipment.replacementAwb) && (
                  <div className="return-tracking-card">
                    <h5>Logistics & Shipments</h5>
                    
                    {returnReq.reverseShipment.awbCode && (
                      <div style={{ marginBottom: "20px" }}>
                        <p style={{ fontWeight: 700, margin: "0 0 4px 0", fontSize: "14px" }}>Reverse Pickup Details</p>
                        <p style={{ margin: "0 0 4px 0", fontSize: "13px" }}>
                          AWB Code: <strong>{returnReq.reverseShipment.awbCode}</strong>
                        </p>
                        <p style={{ margin: "0 0 8px 0", fontSize: "13px" }}>
                          Courier Partner: <strong>{returnReq.reverseShipment.courierName || "Shiprocket"}</strong>
                        </p>
                        {returnReq.reverseShipment.trackingUrl && (
                          <a
                            href={returnReq.reverseShipment.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              backgroundColor: "#0d1b40",
                              color: "#fff",
                              padding: "6px 16px",
                              fontSize: "12px",
                              fontWeight: 600,
                              borderRadius: "4px",
                              display: "inline-block",
                              textDecoration: "none",
                            }}
                          >
                            Track Reverse Pickup
                          </a>
                        )}
                      </div>
                    )}

                    {returnReq.reverseShipment.replacementAwb && (
                      <div className="replacement-tracking-card" style={{ padding: "16px", borderRadius: "6px", border: "1px solid #bfdbfe" }}>
                        <p style={{ fontWeight: 700, margin: "0 0 4px 0", fontSize: "14px", color: "#1e40af" }}>Replacement Forward Shipment</p>
                        <p style={{ margin: "0 0 4px 0", fontSize: "13px" }}>
                          Replacement AWB: <strong>{returnReq.reverseShipment.replacementAwb}</strong>
                        </p>
                        <p style={{ margin: "0 0 8px 0", fontSize: "13px" }}>
                          Courier: <strong>{returnReq.reverseShipment.replacementCourier || "Shiprocket"}</strong>
                        </p>
                        <p style={{ margin: "0 0 12px 0", fontSize: "12px", fontStyle: "italic", color: "#1e3a8a" }}>
                          * Delivery charge paid by Kamali Gifts (Customer pays ₹0)
                        </p>
                        {returnReq.reverseShipment.replacementTrackingUrl && (
                          <a
                            href={returnReq.reverseShipment.replacementTrackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              backgroundColor: "#db1a5d",
                              color: "#fff",
                              padding: "6px 16px",
                              fontSize: "12px",
                              fontWeight: 600,
                              borderRadius: "4px",
                              display: "inline-block",
                              textDecoration: "none",
                            }}
                          >
                            Track Replacement Package
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {returnReq.refund && (
                  <div className="return-tracking-card refund-details-card">
                    <h5>Refund Transaction Details</h5>
                    <p style={{ margin: "0 0 6px 0", fontSize: "14px" }}>
                      Refund Mode: <strong>{returnReq.refund.refundMode === "razorpay" ? "Razorpay (Direct Online)" : "Manual Offline / Bank Transfer"}</strong>
                    </p>
                    <p style={{ margin: "0 0 6px 0", fontSize: "14px" }}>
                      Refunded Amount: <strong>₹{parseFloat(returnReq.refund.refundAmount).toFixed(2)}</strong>
                    </p>
                    <p style={{ margin: "0 0 6px 0", fontSize: "14px" }}>
                      Refund Status: <span style={{ fontWeight: 700 }}>{REFUND_STATUS_LABELS[returnReq.refund.refundStatus] || returnReq.refund.refundStatus}</span>
                    </p>
                    {returnReq.refund.refundedAt && (
                      <p style={{ margin:'0 0 6px 0', fontSize:'14px' }}>
                        Refunded on:{' '}
                        <strong>
                          {new Date(returnReq.refund.refundedAt).toLocaleDateString('en-IN', {
                            day:'numeric', month:'long', year:'numeric'
                          })}
                        </strong>
                      </p>
                    )}
                    {returnReq.refund.refundStatus === 'failed' && (
                      <div style={{ marginTop:'12px', padding:'12px 16px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'6px' }}>
                        <p style={{ margin:0, fontSize:'13px', color:'#b91c1c', fontWeight:600 }}>
                          Your refund could not be processed automatically. Please contact us at{' '}
                          <a href="mailto:Kamalireturngifts@gmail.com" style={{ color:'#b91c1c' }}>
                            Kamalireturngifts@gmail.com
                          </a>{' '}
                          with your Return ID and we will resolve this within 2 business days.
                        </p>
                      </div>
                    )}
                    {returnReq.refund.razorpayRefundId && (
                      <p style={{ margin: "0 0 6px 0", fontSize: "13px" }}>
                        Razorpay Refund ID: <code>{returnReq.refund.razorpayRefundId}</code>
                      </p>
                    )}
                    {returnReq.refund.manualRefundNotes && (
                      <div style={{ marginTop: "10px", padding: "10px", background: "rgba(255,255,255,0.7)", borderRadius: "4px", border: "1px dashed #e9d5ff" }}>
                        <span style={{ fontSize: "11px", color: "#6b7280", display: "block" }}>Refund Notes</span>
                        <p style={{ margin: 0, fontSize: "13px", color: "#581c87" }}>{returnReq.refund.manualRefundNotes}</p>
                      </div>
                    )}
                  </div>
                )}

                {returnReq.media && returnReq.media.length > 0 && (
                  <div className="return-tracking-card">
                    <h5>Submitted Proof of Issue</h5>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "12px", marginTop: "10px" }}>
                      {returnReq.media.map((med, idx) => {
                        const getMediaUrl = (url) => {
                          if (!url) return "";
                          if (url.startsWith("http://") || url.startsWith("https://")) return url;
                          const imgHost = process.env.REACT_APP_IMG_URL || "";
                          const clean = url.replace(/^\//, "");
                          return `${imgHost}/${clean}`;
                        };
                        const resolvedUrl = getMediaUrl(med.mediaUrl);
                        if (med.mediaType === "video") {
                          return (
                            <div key={idx} style={{ gridColumn: "span 2" }}>
                              <video src={resolvedUrl} controls style={{ width: "100%", borderRadius: "4px", border: "1px solid #e5e7eb" }} />
                            </div>
                          );
                        } else {
                          return (
                            <a href={resolvedUrl} target="_blank" rel="noopener noreferrer" key={idx}>
                              <img src={resolvedUrl} alt="proof" style={{ width: "100%", borderRadius: "4px", border: "1px solid #e5e7eb", cursor: "zoom-in" }} />
                            </a>
                          );
                        }
                      })}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default ReturnTracking;
