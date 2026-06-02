import { createSlice } from "@reduxjs/toolkit";

const reviewSlice = createSlice({
  name: "review",
  initialState: {
    reviews: [],       // approved reviews for current product
    loading: false,
    eligibility: { eligible: false, hasReviewed: false, message: "" },
    eligibilityLoading: false,
    submitting: false,
    error: null,
  },
  reducers: {
    setReviews:            (state, action) => { state.reviews = action.payload; },
    setLoading:            (state, action) => { state.loading = action.payload; },
    setEligibility:        (state, action) => { state.eligibility = action.payload; },
    setEligibilityLoading: (state, action) => { state.eligibilityLoading = action.payload; },
    setSubmitting:         (state, action) => { state.submitting = action.payload; },
    setError:              (state, action) => { state.error = action.payload; },
    clearReviews:          (state) => { state.reviews = []; state.error = null; },
    clearEligibility:      (state) => {
      state.eligibility = { eligible: false, hasReviewed: false, message: "" };
      state.eligibilityLoading = false;
    },
  },
});

export const {
  setReviews,
  setLoading,
  setEligibility,
  setEligibilityLoading,
  setSubmitting,
  setError,
  clearReviews,
  clearEligibility,
} = reviewSlice.actions;
export default reviewSlice.reducer;
