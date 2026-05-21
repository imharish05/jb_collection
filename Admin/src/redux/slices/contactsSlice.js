import { createSlice } from "@reduxjs/toolkit";

const contactsSlice = createSlice({
    name: "contacts",
    initialState: { items: [], loading: false, error: null },
    reducers: {
        setLoading: (state) => { state.loading = true; state.error = null; },
        setItems:   (state, action) => { state.loading = false; state.items = action.payload; },
        setError:   (state, action) => { state.loading = false; state.error = action.payload; },
        removeItem: (state, action) => {
            state.items = state.items.filter(i => i.id !== action.payload);
        },
    },
});

export const { setLoading, setItems, setError, removeItem } = contactsSlice.actions;
export default contactsSlice.reducer;
