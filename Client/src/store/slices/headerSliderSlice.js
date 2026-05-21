import { createSlice } from "@reduxjs/toolkit";

const initialState = {slides : [], loading : false}

const headerSliderSlice = createSlice({
  name: "headerSlider",
  initialState,
  reducers: {
    setHeaderSlides: (state, action) => { state.slides = action.payload; },
    setLoading: (state, action) => { state.loading = action.payload; },
  },
});

export const { setHeaderSlides, setLoading } = headerSliderSlice.actions;
export default headerSliderSlice.reducer;
