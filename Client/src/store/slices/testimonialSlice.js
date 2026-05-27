import { createSlice } from "@reduxjs/toolkit";

const testimonialSlice = createSlice({
  name: "testimonial",
  initialState: { testimonials: [], loading: false, error: null },
  reducers: {
    setTestimonials: (state, action) => {
      state.testimonials = action.payload;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setTestimonials, setLoading, setError } = testimonialSlice.actions;
export default testimonialSlice.reducer;
