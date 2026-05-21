import { createSlice } from "@reduxjs/toolkit";

// MySQL JSON columns sometimes come back as strings — always normalise to array
function parseAttrs(raw) {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
        try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
    }
    return [];
}

function normalise(v) {
    return {
        ...v,
        attributes: parseAttrs(v.attributes),
        productName: v.product?.name || v.Product?.name || v.productName || "",
    };
}

const variantsSlice = createSlice({
    name: "variants",
    initialState: { items: [], loading: false, error: null },
    reducers: {
        setLoading: (state) => { state.loading = true; state.error = null; },
        setItems: (state, action) => {
            state.loading = false;
            state.items = Array.isArray(action.payload) ? action.payload.map(normalise) : [];
        },
        setError: (state, action) => { state.loading = false; state.error = action.payload; },
        addItem: (state, action) => { state.items.unshift(normalise(action.payload)); },
        updateItem: (state, action) => {
            const idx = state.items.findIndex(i => i.id === action.payload.id);
            if (idx !== -1) state.items[idx] = normalise(action.payload);
        },
        removeItem: (state, action) => {
            state.items = state.items.filter(i => i.id !== action.payload);
        },
        updateStockLocally: (state, action) => {
            const { id, stock } = action.payload;
            const item = state.items.find(v => v.id === id);
            if (item) { item.stock = stock; item.status = stock > 0 ? "Active" : "Inactive"; }
        },
    },
});

export const { setLoading, setItems, setError, addItem, updateItem, removeItem, updateStockLocally } = variantsSlice.actions;
export default variantsSlice.reducer;