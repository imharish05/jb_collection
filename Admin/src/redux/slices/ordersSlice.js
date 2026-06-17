import { createSlice } from "@reduxjs/toolkit";

const ordersSlice = createSlice({
    name: "orders",
    initialState: { items: [], loading: false, error: null },
    reducers: {
        setLoading:   (state) => { state.loading = true; state.error = null; },
        setItems:     (state, action) => { state.loading = false; state.items = action.payload; },
        setError:     (state, action) => { state.loading = false; state.error = action.payload; },
        updateStatus: (state, action) => {
            const order = state.items.find(o => o.id === action.payload.id);
            if (order) {
                if (action.payload.status !== undefined) order.status = action.payload.status;
                if (action.payload.paymentStatus !== undefined) order.paymentStatus = action.payload.paymentStatus;
                if (action.payload.codCollected !== undefined) order.codCollected = action.payload.codCollected;
            }
        },
        updateItemStatus: (state, action) => {
            const order = state.items.find(o => o.id === action.payload.orderId);
            const items = order?.items || order?.orderItems || [];
            const item = items.find(i => i.id === action.payload.itemId);
            if (item) item.status = action.payload.status;
        },
    },
});

export const { setLoading, setItems, setError, updateStatus, updateItemStatus } = ordersSlice.actions;
export default ordersSlice.reducer;
