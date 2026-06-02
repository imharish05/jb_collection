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

// Fetch approved reviews for a product
export const getProductReviews = async (dispatch, productId) => {
  dispatch(setLoading(true));
  try {
    const res = await api.get(`/reviews/product/${productId}`);
    dispatch(setReviews(res.data));
  } catch (err) {
    dispatch(setError("Failed to load reviews"));
    console.error(err);
  } finally {
    dispatch(setLoading(false));
  }
};

// Check whether the current user can review a product.
export const getReviewEligibility = async (dispatch, productId) => {
  dispatch(setEligibilityLoading(true));
  try {
    const res = await api.get(`/reviews/eligibility/${productId}`);
    dispatch(setEligibility(res.data));
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    const msg = err.response?.data?.message || "You are not eligible to review this product.";
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
