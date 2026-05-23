import { createSlice } from "@reduxjs/toolkit";

const reviewSlice = createSlice({
  name: "review",
  initialState: {
    reviews: [],       // approved reviews for current product
    loading: false,
    submitting: false,
    error: null,
  },
  reducers: {
    setReviews:    (state, action) => { state.reviews    = action.payload; },
    setLoading:    (state, action) => { state.loading    = action.payload; },
    setSubmitting: (state, action) => { state.submitting = action.payload; },
    setError:      (state, action) => { state.error      = action.payload; },
    clearReviews:  (state)         => { state.reviews    = []; state.error = null; },
  },
});

export const { setReviews, setLoading, setSubmitting, setError, clearReviews } = reviewSlice.actions;
export default reviewSlice.reducer;