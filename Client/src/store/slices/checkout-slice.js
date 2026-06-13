import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

const initialState = {
  source: null,       // "cart" | "buy_now"
  items: [],          // active checkout items
  sessionId: null,
  createdAt: null,
  expiresAt: null
};

const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    createCheckoutFromCart(state, action) {
      state.source = "cart";
      state.items = action.payload; // array of cart items
      state.sessionId = uuidv4();
      state.createdAt = Date.now();
       state.expiresAt = Date.now() + 30 * 60 * 1000;// 30mins expiry
    },
    createBuyNowCheckout(state, action) {
      state.source = "buy_now";
      state.items = [action.payload]; // single item (matching cart item structure)
      state.sessionId = uuidv4();
      state.createdAt = Date.now();
     state.expiresAt = Date.now() + 30 * 60 * 1000; 
    },
    replaceCheckoutItems(state, action) {
      state.items = action.payload;
    },
    clearCheckout(state) {
      state.source = null;
      state.items = [];
      state.sessionId = null;
      state.createdAt = null;
      state.expiresAt = null;
    }
  }
});

export const {
  createCheckoutFromCart,
  createBuyNowCheckout,
  replaceCheckoutItems,
  clearCheckout
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
