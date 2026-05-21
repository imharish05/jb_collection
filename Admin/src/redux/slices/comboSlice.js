import { createSlice } from '@reduxjs/toolkit';

const comboSlice = createSlice({
  name: 'combos',
  initialState: { items: [], loading: false, error: null },
  reducers: {
    setLoading: (state)                => { state.loading = true;  state.error = null; },
    setItems:   (state, { payload })   => { state.loading = false; state.items = payload; },
    setError:   (state, { payload })   => { state.loading = false; state.error = payload; },
    removeItem: (state, { payload })   => { state.items = state.items.filter(i => i.id !== payload); },
  },
});

export const { setLoading, setItems, setError, removeItem } = comboSlice.actions;
export default comboSlice.reducer;