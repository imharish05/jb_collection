import cogoToast from "cogo-toast";
import api from "../../api/axios";
import { setReviews, setLoading, setSubmitting, setError } from "../slices/review-slice";

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

// Submit a new review (guest or logged-in)
export const submitReview = async (dispatch, payload) => {
  // payload: { productId, feedback, rating, guestName? }
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