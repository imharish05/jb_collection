import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  returns: [],
  currentReturn: null,
  loading: false,
  error: null,
};

const returnSlice = createSlice({
  name: "return",
  initialState,
  reducers: {
    returnStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    returnFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setReturns: (state, action) => {
      state.loading = false;
      state.returns = action.payload;
    },
    setCurrentReturn: (state, action) => {
      state.loading = false;
      state.currentReturn = action.payload;
    },
    clearReturn: (state) => {
      state.currentReturn = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { returnStart, returnFailure, setReturns, setCurrentReturn, clearReturn } = returnSlice.actions;
export default returnSlice.reducer;
