import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  brands: [],
  loading: false,
};

const brandsSlice = createSlice({
  name: "brands",
  initialState,
  reducers: {
    setBrands:  (state, action) => { state.brands  = action.payload; },
    setLoading: (state, action) => { state.loading = action.payload; },
  },
});

export const { setBrands, setLoading } = brandsSlice.actions;
export default brandsSlice.reducer;
