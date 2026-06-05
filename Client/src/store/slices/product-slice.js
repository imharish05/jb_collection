const { createSlice } = require('@reduxjs/toolkit');

function parseAttrs(raw) {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
        try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
    }
    return [];
}

function parseImage(raw) {
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === 'string' && raw.trim().startsWith('[')) {
        try { const p = JSON.parse(raw); return Array.isArray(p) ? p.filter(Boolean) : []; } catch { return []; }
    }
    if (typeof raw === 'string' && raw.trim()) return [raw];
    return [];
}

function normaliseProduct(p) {
    return {
        ...p,
        image: parseImage(p.image),
        Variants: Array.isArray(p.Variants)
            ? p.Variants.map(v => ({ ...v, attributes: parseAttrs(v.attributes), image: v.image || null }))
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