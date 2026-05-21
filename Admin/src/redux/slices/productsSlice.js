import { createSlice } from "@reduxjs/toolkit";

// MySQL JSON columns (attributes) sometimes come back as strings — parse to array
function parseAttrs(raw) {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
        try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
    }
    return [];
}

function normaliseProduct(p) {
    return {
        ...p,
        Variants: Array.isArray(p.Variants)
            ? p.Variants.map(v => ({ ...v, attributes: parseAttrs(v.attributes) }))
            : [],
    };
}

const productsSlice = createSlice({
    name: "products",
    initialState: { items: [], loading: false, error: null },
    reducers: {
        setLoading: (state) => { state.loading = true; state.error = null; },
        setItems: (state, action) => {
            state.loading = false;
            state.items = Array.isArray(action.payload)
                ? action.payload.map(normaliseProduct)
                : [];
        },
        setError: (state, action) => { state.loading = false; state.error = action.payload; },
        addItem: (state, action) => { state.items.unshift(normaliseProduct(action.payload)); },
        updateItem: (state, action) => {
            const idx = state.items.findIndex(i => i.id === action.payload.id);
            if (idx !== -1) state.items[idx] = normaliseProduct(action.payload);
            else state.items.unshift(normaliseProduct(action.payload));
        },
        removeItem: (state, action) => {
            state.items = state.items.filter(i => i.id !== action.payload);
        },
    },
});

export const { setLoading, setItems, setError, addItem, updateItem, removeItem } = productsSlice.actions;
export default productsSlice.reducer;