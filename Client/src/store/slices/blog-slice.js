import { createSlice } from "@reduxjs/toolkit";

const blogSlice = createSlice({
  name: "blog",
  initialState: { blogs: [], loading: false },
  reducers: {
    setBlogs: (state, action) => { state.blogs = action.payload; },
    setLoading: (state, action) => { state.loading = action.payload; },
  },
});

export const { setBlogs, setLoading } = blogSlice.actions;
export default blogSlice.reducer;
