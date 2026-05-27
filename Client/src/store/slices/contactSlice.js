import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
  error: null,
  success: false,
  message: '',
};

const contactSlice = createSlice({
  name: 'contact',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.success = false;
    },
    setSuccess: (state, action) => {
      state.success = true;
      state.error = null;
      state.message = action.payload || 'Message sent successfully!';
    },
    resetContactForm: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = '';
    },
  },
});

export const { setLoading, setError, setSuccess, resetContactForm } = contactSlice.actions;
export default contactSlice.reducer;
