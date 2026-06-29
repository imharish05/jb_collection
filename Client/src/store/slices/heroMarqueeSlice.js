import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  messages: [],
  loading: false,
};

const homeMarqueeSlice = createSlice({
  name: "homeMarquee",
  initialState,
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setMessages, setLoading } = homeMarqueeSlice.actions;
export default homeMarqueeSlice.reducer;
