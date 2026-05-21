import { createSlice } from "@reduxjs/toolkit";

const heroSliderSlice = createSlice({
  name: "heroSlider",
  initialState: { items: [], loading: false, error: null },
  reducers: {
    setLoading: (state) => { state.loading = true; state.error = null; },
    setItems:   (state, action) => { state.loading = false; state.items = action.payload; },
    setError:   (state, action) => { state.loading = false; state.error = action.payload; },
    addItem:    (state, action) => { state.items.push(action.payload); },
    updateItem: (state, action) => {
      const idx = state.items.findIndex(i => i.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
    removeItem: (state, action) => {
      state.items = state.items.filter(i => i.id !== action.payload);
    },
  },
});

export const { setLoading, setItems, setError, addItem, updateItem, removeItem } = heroSliderSlice.actions;
export default heroSliderSlice.reducer;