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

const cartSlice = createSlice({
    name: "cart",
    initialState: {
        cartItems: []
    },
    reducers: {
        addToCart(state, action) {
            const product = normalizeProduct(action.payload);
            const newCartItemId = product.cartItemId || uuidv4();

            // Backend variant products: deduplicate by cartItemId
            if (product.selectedVariantId) {
                const existingItem = state.cartItems.find(item => item.cartItemId === newCartItemId);
                if (existingItem) {
                    // Updating qty of existing item — NO toast
                    state.cartItems = state.cartItems.map(item =>
                        item.cartItemId === newCartItemId
                            ? { ...item, quantity: product.quantity || item.quantity + 1 }
                            : item
                    );
                } else {
                    // New item added — show toast
                    state.cartItems.push({
                        ...product,
                        quantity: product.quantity || 1,
                        cartItemId: newCartItemId,
                    });
                    cogoToast.success("Added To Cart", { position: "top-center" });
                }
                return;
            }

            if (!product.variation || (Array.isArray(product.variation) && product.variation.length === 0)) {
                const cartItem = state.cartItems.find(item =>
                    item.id === product.id &&
                    (newCartItemId ? item.cartItemId === newCartItemId : true)
                );
                if (!cartItem) {
                    state.cartItems.push({
                        ...product,
                        quantity: product.quantity ? product.quantity : 1,
                        cartItemId: newCartItemId
                    });
                    cogoToast.success("Added To Cart", { position: "top-center" });
                } else {
                    // Qty increment — NO toast
                    state.cartItems = state.cartItems.map(item => {
                        if (item.cartItemId === cartItem.cartItemId) {
                            return {
                                ...item,
                                quantity: product.quantity ? item.quantity + product.quantity : item.quantity + 1
                            };
                        }
                        return item;
                    });
                }
            } else {
                const cartItem = state.cartItems.find(
                    item =>
                        item.id === product.id &&
                        product.selectedProductColor &&
                        product.selectedProductColor === item.selectedProductColor &&
                        product.selectedProductSize &&
                        product.selectedProductSize === item.selectedProductSize &&
                        (product.cartItemId ? product.cartItemId === item.cartItemId : true)
                );
                if (!cartItem) {
                    state.cartItems.push({
                        ...product,
                        quantity: product.quantity ? product.quantity : 1,
                        cartItemId: newCartItemId
                    });
                    cogoToast.success("Added To Cart", { position: "top-center" });
                } else if (cartItem !== undefined && (cartItem.selectedProductColor !== product.selectedProductColor || cartItem.selectedProductSize !== product.selectedProductSize)) {
                    state.cartItems = [
                        ...state.cartItems,
                        {
                            ...product,
                            quantity: product.quantity ? product.quantity : 1,
                            cartItemId: newCartItemId
                        }
                    ];
                    cogoToast.success("Added To Cart", { position: "top-center" });
                } else {
                    // Qty increment — NO toast
                    state.cartItems = state.cartItems.map(item => {
                        if (item.cartItemId === cartItem.cartItemId) {
                            return {
                                ...item,
                                quantity: product.quantity ? item.quantity + product.quantity : item.quantity + 1,
                                selectedProductColor: product.selectedProductColor,
                                selectedProductSize: product.selectedProductSize
                            };
                        }
                        return item;
                    });
                }
            }
        },
        deleteFromCart(state, action) {
            state.cartItems = state.cartItems.filter(item => item.cartItemId !== action.payload);
            cogoToast.error("Removed From Cart", { position: "top-center" });
        },
        decreaseQuantity(state, action) {
            const product = action.payload;
            if (product.quantity === 1) {
                state.cartItems = state.cartItems.filter(item => item.cartItemId !== product.cartItemId);
                cogoToast.error("Removed From Cart", { position: "top-center" });
            } else {
                // Just decrement — NO toast
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
            state.cartItems = action.payload || [];
        }
    },
});

export const { addToCart, deleteFromCart, decreaseQuantity, deleteAllFromCart, replaceCart } = cartSlice.actions;
export default cartSlice.reducer;