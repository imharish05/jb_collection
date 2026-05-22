import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  orders: [],
  loading: false,
  error: null,
};

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    orderStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    orderFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setOrders: (state, action) => {
      state.loading = false;
      state.orders = action.payload;
    },
    clearOrders: (state) => {
      state.orders = [];
      state.loading = false;
      state.error = null;
    },
  },
});

export const { orderStart, orderFailure, setOrders, clearOrders } = orderSlice.actions;
export default orderSlice.reducer;
