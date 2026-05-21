const { createSlice } = require('@reduxjs/toolkit');

function parseAttrs(raw) {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
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

const productSlice = createSlice({
    name: 'product',
    initialState: {
        products: [],
    },
    reducers: {
        setProducts(state, action) {
            state.products = Array.isArray(action.payload)
                ? action.payload.map(normaliseProduct)
                : [];
        }
    },
});

export const { setProducts } = productSlice.actions;
export default productSlice.reducer;