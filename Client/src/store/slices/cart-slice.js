import { v4 as uuidv4 } from 'uuid';
import cogoToast from 'cogo-toast';
import { createSlice } from '@reduxjs/toolkit';

const parseJson = (val) => {
    if (!val || typeof val !== 'string') return val;
    try { return JSON.parse(val); } catch { return val; }
};

const normalizeProduct = (product) => ({
    ...product,
    image: Array.isArray(product.image) ? product.image : parseJson(product.image) || [],
    variation: Array.isArray(product.variation) ? product.variation : parseJson(product.variation) || [],
});

// Two backend-variant cart items are the SAME only if both productId AND
// the full selectedVariantName (attribute combo string) match.
// selectedVariantId alone is NOT enough — the same variant row can represent
// multiple attribute combos (e.g. bronze+Small+Gold-plated vs bronze+Small+Wood
// may share the same variantId but differ by selectedVariantName).
const isSameBackendVariant = (item, product) => {
    if (item.id !== product.id) return false;
    if (item.selectedVariantId !== product.selectedVariantId) return false;
    const a = (item.selectedVariantName || '').trim();
    const b = (product.selectedVariantName || '').trim();
    return a === b && a !== '';
};

const cartSlice = createSlice({
    name: "cart",
    initialState: { cartItems: [] },
    reducers: {
        addToCart(state, action) {
            const product = normalizeProduct(action.payload);
            const newCartItemId = product.cartItemId || uuidv4();

            // ── Combo items: always a unique row — never merge ────────────────
            if (product.isCombo) {
                const existing = product.cartItemId
                    ? state.cartItems.find(item => item.cartItemId === product.cartItemId)
                    : null;
                if (existing) {
                    state.cartItems = state.cartItems.map(item =>
                        item.cartItemId === product.cartItemId
                            ? { ...item, quantity: product.quantity != null ? product.quantity : item.quantity + 1 }
                            : item
                    );
                } else {
                    state.cartItems.push({ ...product, quantity: product.quantity || 1, cartItemId: newCartItemId });
                    cogoToast.success("Added To Cart", { position: "top-center" });
                }
                return;
            }

            // ── Backend variant products ──────────────────────────────────────
            if (product.selectedVariantId) {
                const existingItem = state.cartItems.find(item => isSameBackendVariant(item, product));

                if (existingItem) {
                    // Same product + same full variant combo → increment qty, no toast
                    state.cartItems = state.cartItems.map(item =>
                        isSameBackendVariant(item, product)
                            ? { ...item,
                                quantity: product.quantity != null ? product.quantity : item.quantity + 1,
                                cartItemId: product.cartItemId || item.cartItemId, // keep backend id in sync
                              }
                            : item
                    );
                } else {
                    // Different combo or brand new → new cart row
                    state.cartItems.push({
                        ...product,
                        quantity: product.quantity || 1,
                        cartItemId: newCartItemId,
                    });
                    cogoToast.success("Added To Cart", { position: "top-center" });
                }
                return;
            }

            // ── No variation at all ───────────────────────────────────────────
            if (!product.variation || (Array.isArray(product.variation) && product.variation.length === 0)) {
                const cartItem = state.cartItems.find(item => item.id === product.id);
                if (!cartItem) {
                    state.cartItems.push({ ...product, quantity: product.quantity || 1, cartItemId: newCartItemId });
                    cogoToast.success("Added To Cart", { position: "top-center" });
                } else {
                    // product.quantity is the authoritative total from the backend — set directly,
                    // don't add on top of the local quantity (that causes double-increment).
                    state.cartItems = state.cartItems.map(item =>
                        item.id === cartItem.id
                            ? { ...item, quantity: product.quantity != null ? product.quantity : item.quantity + 1,
                                cartItemId: product.cartItemId || item.cartItemId }
                            : item
                    );
                }
                return;
            }

            // ── Old-style color/size variation ────────────────────────────────
            const cartItem = state.cartItems.find(item =>
                item.id === product.id &&
                item.selectedProductColor === product.selectedProductColor &&
                item.selectedProductSize === product.selectedProductSize
            );
            if (!cartItem) {
                state.cartItems.push({ ...product, quantity: product.quantity || 1, cartItemId: newCartItemId });
                cogoToast.success("Added To Cart", { position: "top-center" });
            } else {
                // Same fix: use backend total directly instead of adding to local quantity
                state.cartItems = state.cartItems.map(item =>
                    item.cartItemId === cartItem.cartItemId
                        ? { ...item, quantity: product.quantity != null ? product.quantity : item.quantity + 1,
                            cartItemId: product.cartItemId || item.cartItemId }
                        : item
                );
            }
        },

        increaseQuantity(state, action) {
            // action.payload = { cartItemId }
            state.cartItems = state.cartItems.map(item =>
                item.cartItemId === action.payload.cartItemId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            );
        },

        deleteFromCart(state, action) {
            state.cartItems = state.cartItems.filter(item => item.cartItemId !== action.payload);
            // cogoToast.success("Removed From Cart", { position: "top-center" });
        },

        decreaseQuantity(state, action) {
            const product = action.payload;
            if (product.quantity === 1) {
                state.cartItems = state.cartItems.filter(item => item.cartItemId !== product.cartItemId);
                // cogoToast.success("Removed From Cart", { position: "top-center" });
            } else {
                state.cartItems = state.cartItems.map(item =>
                    item.cartItemId === product.cartItemId
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                );
            }
        },

        deleteAllFromCart(state) {
            state.cartItems = [];
        },

        replaceCart(state, action) {
            state.cartItems = (action.payload || []).map(normalizeProduct);
        }
    },
});

export const { addToCart, increaseQuantity, deleteFromCart, decreaseQuantity, deleteAllFromCart, replaceCart } = cartSlice.actions;
export default cartSlice.reducer;