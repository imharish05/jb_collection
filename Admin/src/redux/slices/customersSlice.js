import { createSlice } from "@reduxjs/toolkit";

const customersSlice = createSlice({
    name: "customers",
    initialState: { items: [], loading: false, error: null },
    reducers: {
        setLoading: (state) => { state.loading = true; state.error = null; },
        setItems:   (state, action) => { state.loading = false; state.items = action.payload; },
        setError:   (state, action) => { state.loading = false; state.error = action.payload; },
    },
});

export const { setLoading, setItems, setError } = customersSlice.actions;
export default customersSlice.reducer;
