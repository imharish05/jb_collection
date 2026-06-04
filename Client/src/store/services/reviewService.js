import cogoToast from "cogo-toast";
import api from "../../api/axios";
import {
  setReviews,
  setLoading,
  setEligibility,
  setEligibilityLoading,
  setSubmitting,
  setError,
} from "../slices/review-slice";

const reviewPath = (targetType, id) =>
  targetType === "combo" ? `/reviews/combo/${id}` : `/reviews/product/${id}`;

const eligibilityPath = (targetType, id) =>
  targetType === "combo" ? `/reviews/combo/eligibility/${id}` : `/reviews/eligibility/${id}`;

// Fetch approved reviews for a product or child combo.
export const getReviewsByTarget = async (dispatch, { targetType = "product", id }) => {
  dispatch(setLoading(true));
  try {
    const res = await api.get(reviewPath(targetType, id));
    dispatch(setReviews(res.data));
  } catch (err) {
    dispatch(setError("Failed to load reviews"));
    console.error(err);
  } finally {
    dispatch(setLoading(false));
  }
};

// Fetch approved reviews for a product.
export const getProductReviews = async (dispatch, productId) =>
  getReviewsByTarget(dispatch, { targetType: "product", id: productId });

// Fetch approved reviews for a child combo.
export const getComboReviews = async (dispatch, childComboId) =>
  getReviewsByTarget(dispatch, { targetType: "combo", id: childComboId });

// Check whether the current user can review a product or child combo.
export const getReviewEligibilityByTarget = async (dispatch, { targetType = "product", id }) => {
  dispatch(setEligibilityLoading(true));
  try {
    const res = await api.get(eligibilityPath(targetType, id));
    dispatch(setEligibility(res.data));
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    const itemLabel = targetType === "combo" ? "combo" : "product";
    const msg = err.response?.data?.message || `You are not eligible to review this ${itemLabel}.`;
    const next = {
      eligible: false,
      hasReviewed: false,
      message: status === 401 ? "Please login to review delivered purchases." : msg,
    };
    dispatch(setEligibility(next));
    return next;
  } finally {
    dispatch(setEligibilityLoading(false));
  }
};

// Check whether the current user can review a product.
export const getReviewEligibility = async (dispatch, productId) =>
  getReviewEligibilityByTarget(dispatch, { targetType: "product", id: productId });

// Check whether the current user can review a child combo.
export const getComboReviewEligibility = async (dispatch, childComboId) =>
  getReviewEligibilityByTarget(dispatch, { targetType: "combo", id: childComboId });

// Submit a new review for a delivered purchased item.
export const submitReview = async (dispatch, payload) => {
  dispatch(setSubmitting(true));
  try {
    await api.post("/reviews", payload);
    cogoToast.success("Review submitted! It will appear after approval.", {
      position: "top-center",
    });
    return true;
  } catch (err) {
    const msg = err.response?.data?.message || "Failed to submit review";
    cogoToast.error(msg, { position: "top-center" });
    dispatch(setError(msg));
    return false;
  } finally {
    dispatch(setSubmitting(false));
  }
};
