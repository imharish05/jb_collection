import { createSlice } from "@reduxjs/toolkit";

const settingsSlice = createSlice({
  name: "settings",
  initialState: { settings: {}, loading: false, error: null },
  reducers: {
    setSettings: (state, action) => {
      state.settings = action.payload;
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

export const { setSettings, setLoading, setError } = settingsSlice.actions;
export default settingsSlice.reducer;
