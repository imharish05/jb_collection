import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";
import { useSelector, useDispatch } from "react-redux";
import { getProductReviews, getReviewEligibility, submitReview } from "../../store/services/reviewService";
import { clearEligibility, clearReviews } from "../../store/slices/review-slice";

// ── Star picker ──────────────────────────────────────────────────────────────
const StarPicker = ({ value, onChange }) => (
  <div style={{ display: "flex", gap: 4, cursor: "pointer" }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <i
        key={n}
        className={n <= value ? "fa fa-star" : "fa fa-star-o"}
        style={{ color: n <= value ? "#f5a623" : "#ccc", fontSize: 20 }}
        onClick={() => onChange(n)}
      />
    ))}
  </div>
);

// ── Star display (read-only) ─────────────────────────────────────────────────
const StarDisplay = ({ rating, size = 14 }) => {
  const filled = Math.round(Number(rating) || 0);
  return (
    <span>
      {[1, 2, 3, 4, 5].map((n) => (
        <i
          key={n}
          className={n <= filled ? "fa fa-star" : "fa fa-star-o"}
          style={{ color: n <= filled ? "#f5a623" : "#ccc", fontSize: size, marginRight: 1 }}
        />
      ))}
    </span>
  );
};

// ── Single review card ───────────────────────────────────────────────────────
const ReviewCard = ({ review }) => {
  const name = review.Customer?.name || review.guestName || "Guest";
  const date = new Date(review.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
  return (
    <div className="single-review" style={{ marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid #f3f3f3" }}>
      <div className="review-content">
        <div className="review-top-wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{name}</h4>
            <div style={{ margin: "5px 0" }}>
              <StarDisplay rating={review.rating} size={13} />
            </div>
            <span style={{ fontSize: 11, color: "#aaa" }}>{date}</span>
          </div>
        </div>
        <p style={{ color: "#555", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{review.feedback}</p>
      </div>
    </div>
  );
};

// ── Average rating summary ───────────────────────────────────────────────────
const RatingSummary = ({ reviews }) => {
  if (!reviews.length) return null;
  const avg = reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length;
  const rounded = Math.round(avg * 10) / 10;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, padding: "16px 20px", background: "#fafafa", borderRadius: 10, border: "1px solid #f0f0f0" }}>
      <span style={{ fontSize: 42, fontWeight: 800, color: "#222", lineHeight: 1 }}>{rounded}</span>
      <div>
        <StarDisplay rating={rounded} size={18} />
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
          Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────
const ProductDescriptionTab = ({ spaceBottomClass, productFullDesc, productId }) => {
  const dispatch = useDispatch();
  const { reviews, loading, submitting, eligibility, eligibilityLoading } = useSelector((state) => state.review);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const INITIAL_SHOW = 1;
  const [showAll, setShowAll]     = useState(false);
  const [rating, setRating]       = useState(0);
  const [feedback, setFeedback]   = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [ratingErr, setRatingErr] = useState(false);
  const showReviewForm = isAuthenticated && eligibility?.eligible;
  const showReviewPanel = isAuthenticated && (eligibilityLoading || showReviewForm || submitted);

  // reset collapse when product changes
  useEffect(() => {
    setShowAll(false);
    setSubmitted(false);
    setRating(0);
    setFeedback("");
    setRatingErr(false);
  }, [productId]);

  // Fetch reviews when productId changes
  useEffect(() => {
    if (!productId) return;
    dispatch(clearReviews());
    getProductReviews(dispatch, productId);
  }, [productId, dispatch]);

  useEffect(() => {
    dispatch(clearEligibility());
    if (productId && isAuthenticated) {
      getReviewEligibility(dispatch, productId);
    }
  }, [productId, isAuthenticated, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!showReviewForm) return;
    if (!rating) { setRatingErr(true); return; }
    setRatingErr(false);

    const payload = {
      productId,
      feedback,
      rating,
    };

    const ok = await submitReview(dispatch, payload);
    if (ok) {
      setSubmitted(true);
      setRating(0);
      setFeedback("");
      getReviewEligibility(dispatch, productId);
    }
  };

  return (
    <div className={clsx("description-review-area", spaceBottomClass)}>
      <div className="container">
        <div className="description-review-wrapper">
          <Tab.Container defaultActiveKey="productDescription">
            <Nav variant="pills" className="description-review-topbar">
              <Nav.Item>
                <Nav.Link eventKey="productDescription">Description</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="productReviews">
                  Reviews {reviews.length > 0 ? `(${reviews.length})` : ""}
                </Nav.Link>
              </Nav.Item>
              {/* <Nav.Item>
                <Nav.Link eventKey="returnsRefunds">Returns &amp; Refunds</Nav.Link>
              </Nav.Item> */}
            </Nav>

            <Tab.Content className="description-review-bottom">

              {/* ── Description ── */}
              <Tab.Pane eventKey="productDescription">
                <div style={{ lineHeight: 1.8, color: "#444", fontSize: 14 }}>
                  {productFullDesc || <span style={{ color: "#aaa" }}>No description available.</span>}
                </div>
              </Tab.Pane>

              {/* ── Reviews ── */}
              <Tab.Pane eventKey="productReviews">
                <div className="row">

                  {/* Left: existing reviews */}
                  <div className={showReviewPanel ? "col-lg-7" : "col-lg-12"}>
                    {loading ? (
                      <p style={{ color: "#aaa", padding: "20px 0" }}>Loading reviews…</p>
                    ) : reviews.length === 0 ? (
                      <div style={{ padding: "30px 0", textAlign: "center", color: "#bbb" }}>
                        <i className="fa fa-comment-o" style={{ fontSize: 36, display: "block", marginBottom: 10 }} />
                        <p style={{ margin: 0 }}>No reviews yet. Be the first!</p>
                      </div>
                    ) : (
                      <div className="review-wrapper">
                        <RatingSummary reviews={reviews} />

                        {/* Always show first INITIAL_SHOW reviews */}
                        {reviews.slice(0, INITIAL_SHOW).map((r) => (
                          <ReviewCard key={r.id} review={r} />
                        ))}

                        {/* Remaining reviews — faded peek when collapsed, full when expanded */}
                        {reviews.length > INITIAL_SHOW && (
                          <>
                            <div style={{ position: "relative" }}>
                              {/* Fade overlay — only visible when collapsed */}
                              {!showAll && (
                                <div style={{
                                  position: "absolute", top: 0, left: 0, right: 0,
                                  height: "100%", zIndex: 2,
                                  background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 40%, rgba(255,255,255,1) 100%)",
                                  pointerEvents: "none",
                                }} />
                              )}
                              <div style={{
                                maxHeight: showAll ? "none" : 110,
                                overflow: "hidden",
                                transition: "max-height 0.45s ease",
                              }}>
                                {reviews.slice(INITIAL_SHOW).map((r) => (
                                  <ReviewCard key={r.id} review={r} />
                                ))}
                              </div>
                            </div>

                            {/* Toggle button */}
                            <div style={{ textAlign: "center", marginTop: showAll ? 8 : -10, position: "relative", zIndex: 3 }}>
                              <button
                                onClick={() => setShowAll(v => !v)}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: 6,
                                  background: "#fff", border: "1.5px solid #e0e0e0",
                                  borderRadius: 24, padding: "8px 22px",
                                  fontSize: 13, fontWeight: 600, color: "#555",
                                  cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                                  transition: "all 0.2s",
                                }}
                              >
                                {showAll ? (
                                  <><i className="fa fa-chevron-up" style={{ fontSize: 11 }} /> Show less</>
                                ) : (
                                  <><i className="fa fa-chevron-down" style={{ fontSize: 11 }} /> Show {reviews.length - INITIAL_SHOW} more review{reviews.length - INITIAL_SHOW !== 1 ? "s" : ""}</>
                                )}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: submit form */}
                  {showReviewPanel && (
                  <div className="col-lg-5">
                    <div className="ratting-form-wrapper pl-50">
                      {eligibilityLoading ? (
                        <p style={{ color: "#aaa", padding: "20px 0" }}>Checking review eligibility...</p>
                      ) : (
                        <>
                      {!submitted && <h3>Add a Review</h3>}

                      {submitted ? (
                        <div style={{ padding: "20px 0", color: "#4caf50", fontWeight: 600 }}>
                          ✅ Thank you! Your review has been submitted and is pending approval.
                        </div>
                      ) : (
                        <div className="ratting-form">
                          <form onSubmit={handleSubmit}>

                            {/* Star rating */}
                            <div className="star-box" style={{ marginBottom: 16 }}>
                              <span style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 13 }}>
                                Your rating: <span style={{ color: "#e74c3c" }}>*</span>
                              </span>
                              <StarPicker value={rating} onChange={(v) => { setRating(v); setRatingErr(false); }} />
                              {ratingErr && (
                                <span style={{ color: "#e74c3c", fontSize: 12, marginTop: 4, display: "block" }}>
                                  Please select a rating
                                </span>
                              )}
                            </div>

                            <div className="row">
                              {/* Show logged-in user's name */}
                              {isAuthenticated && user?.name && (
                                <div className="col-md-12">
                                  <p style={{ fontSize: 13, color: "#777", marginBottom: 10 }}>
                                    Reviewing as <strong>{user.name}</strong>
                                  </p>
                                </div>
                              )}

                              {/* Message */}
                              <div className="col-md-12">
                                <div className="rating-form-style form-submit">
                                  <textarea
                                    name="feedback"
                                    placeholder="Share your experience with this product…"
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    required
                                    style={{ minHeight: 100 }}
                                  />
                                  <input
                                    type="submit"
                                    value={submitting ? "Submitting…" : "Submit Review"}
                                    disabled={submitting}
                                    style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? "not-allowed" : "pointer" }}
                                  />
                                </div>
                              </div>
                            </div>
                          </form>
                        </div>
                      )}
                        </>
                      )}
                    </div>
                  </div>
                  )}
                </div>
              </Tab.Pane>

              {/* ── Returns & Refunds ── */}
              {/* <Tab.Pane eventKey="returnsRefunds">
                <div className="product-anotherinfo-wrapper">
                  <ul>
                    <li><span>Return Window</span> 7 days from delivery date</li>
                    <li><span>Eligible Items</span> Unused, original packaging, non-customised products</li>
                    <li><span>Non-returnable</span> Customised / personalised items (bracelets, jewellery with engraving)</li>
                    <li><span>Refund Mode</span> Original payment method within 5–7 business days</li>
                    <li><span>Damaged Items</span> Report within 48 hours with photos to get a free replacement</li>
                    <li><span>How to Return</span> WhatsApp us at +91 98765 43210 with your Order ID</li>
                  </ul>
                </div>
              </Tab.Pane> */}

            </Tab.Content>
          </Tab.Container>
        </div>
      </div>
    </div>
  );
};

ProductDescriptionTab.propTypes = {
  spaceBottomClass: PropTypes.string,
  productFullDesc:  PropTypes.string,
  productId:        PropTypes.string.isRequired,
};

export default ProductDescriptionTab;
