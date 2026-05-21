import { v4 as uuidv4 } from 'uuid';
import cogoToast from 'cogo-toast';
import { createSlice } from '@reduxjs/toolkit';

// Parse JSON strings that may come from backend (image, variation stored as JSON)
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

            // Backend variant products: deduplicate by cartItemId (unique per product+variant in DB)
            if (product.selectedVariantId) {
                const existingItem = state.cartItems.find(item => item.cartItemId === newCartItemId);
                if (existingItem) {
                    // Same variant already in cart → set quantity from DB (source of truth)
                    state.cartItems = state.cartItems.map(item =>
                        item.cartItemId === newCartItemId
                            ? { ...item, quantity: product.quantity || item.quantity + 1 }
                            : item
                    );
                } else {
                    // Different variant or first time → add as separate line item
                    state.cartItems.push({
                        ...product,
                        quantity: product.quantity || 1,
                        cartItemId: newCartItemId,
                    });
                }
                cogoToast.success("Added To Cart", { position: "top-center" });
                return;
            }

            if(!product.variation || (Array.isArray(product.variation) && product.variation.length === 0)){
                // No variation: deduplicate by product id AND cartItemId (if provided)
                const cartItem = state.cartItems.find(item =>
                    item.id === product.id &&
                    (newCartItemId ? item.cartItemId === newCartItemId : true)
                );
                if(!cartItem){
                    state.cartItems.push({
                        ...product,
                        quantity: product.quantity ? product.quantity : 1,
                        cartItemId: newCartItemId
                    });
                } else {
                    state.cartItems = state.cartItems.map(item => {
                        if(item.cartItemId === cartItem.cartItemId){
                            return {
                                ...item,
                                quantity: product.quantity ? item.quantity + product.quantity : item.quantity + 1
                            }
                        }
                        return item;
                    })
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
                if(!cartItem){
                    state.cartItems.push({
                        ...product,
                        quantity: product.quantity ? product.quantity : 1,
                        cartItemId: newCartItemId
                    });
                } else if (cartItem !== undefined && (cartItem.selectedProductColor !== product.selectedProductColor || cartItem.selectedProductSize !== product.selectedProductSize)) {
                    state.cartItems = [
                        ...state.cartItems,
                        {
                            ...product,
                            quantity: product.quantity ? product.quantity : 1,
                            cartItemId: newCartItemId
                        }
                    ]
                } else {
                    state.cartItems = state.cartItems.map(item => {
                        if(item.cartItemId === cartItem.cartItemId){
                            return {
                                ...item,
                                quantity: product.quantity ? item.quantity + product.quantity : item.quantity + 1,
                                selectedProductColor: product.selectedProductColor,
                                selectedProductSize: product.selectedProductSize
                            }
                        }
                        return item;
                    });
                }
            }

            cogoToast.success("Added To Cart", {position: "top-center"});
        },
        deleteFromCart(state, action) {
            state.cartItems = state.cartItems.filter(item => item.cartItemId !== action.payload);
            cogoToast.error("Removed From Cart", {position: "top-center"});
        },
        decreaseQuantity(state, action){
            const product = action.payload;
            if (product.quantity === 1) {
                state.cartItems = state.cartItems.filter(item => item.cartItemId !== product.cartItemId);
                cogoToast.error("Removed From Cart", {position: "top-center"});
            } else {
                state.cartItems = state.cartItems.map(item =>
                    item.cartItemId === product.cartItemId
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                );
                cogoToast.warn("Item Decremented From Cart", {position: "top-center"});
            }
        },
        deleteAllFromCart(state){
            state.cartItems = []
        },
        replaceCart(state, action) {
            state.cartItems = action.payload || [];
        }
    },
});

export const { addToCart, deleteFromCart, decreaseQuantity, deleteAllFromCart, replaceCart } = cartSlice.actions;
export default cartSlice.reducer;