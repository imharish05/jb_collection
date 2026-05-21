import { createSlice } from "@reduxjs/toolkit";

const reviewsSlice = createSlice({
    name: "reviews",
    initialState: { items: [], loading: false, error: null },
    reducers: {
        setLoading: (state) => { state.loading = true; state.error = null; },
        setItems:   (state, action) => { state.loading = false; state.items = action.payload; },
        setError:   (state, action) => { state.loading = false; state.error = action.payload; },
        setStatus:  (state, action) => {
            const r = state.items.find(i => i.id === action.payload.id);
            if (r) r.status = action.payload.status;
        },
        removeItem: (state, action) => {
            state.items = state.items.filter(i => i.id !== action.payload);
        },
    },
});

export const { setLoading, setItems, setError, setStatus, removeItem } = reviewsSlice.actions;
export default reviewsSlice.reducer;
