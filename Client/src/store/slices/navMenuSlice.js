import { createSlice } from "@reduxjs/toolkit";

const initialState = {};
const navMenuSlice = createSlice({
  name: "navMenu",
  initialState,
  reducers: {
    setCombos:      (state, action) => { state.combos     = action.payload; },
    setCategories:  (state, action) => { state.categories = action.payload; },
    setEvents:      (state, action) => { state.events     = action.payload; },
    setLoading:     (state, action) => { state.loading    = action.payload; },
  },
});

export const { setCombos, setCategories, setEvents, setLoading, resetToMockData } = navMenuSlice.actions;
export default navMenuSlice.reducer;