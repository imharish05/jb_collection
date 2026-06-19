import { createSlice } from "@reduxjs/toolkit";

const paymentsSlice = createSlice({
    name: "payments",
    initialState: {
        transactions: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
        stats: null,
        loading: false,
        error: null
    },
    reducers: {
        setLoading: (state) => {
            state.loading = true;
            state.error = null;
        },
        setPaymentsData: (state, action) => {
            state.loading = false;
            state.transactions = action.payload.data || [];
            state.total = action.payload.total || 0;
            state.page = action.payload.page || 1;
            state.limit = action.payload.limit || 10;
            state.totalPages = action.payload.totalPages || 1;
            state.stats = action.payload.stats || null;
        },
        setError: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        }
    },
});

export const { setLoading, setPaymentsData, setError } = paymentsSlice.actions;
export default paymentsSlice.reducer;
