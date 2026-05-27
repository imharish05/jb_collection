import { setLoading, setError, setSuccess } from '../slices/contactSlice';
import api from "../../api/axios";
export const submitContactForm = (formData) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const response = await api.post('/contact', formData);
    dispatch(setSuccess('Your message has been sent successfully! We will get back to you soon.'));
    return response.data;
  } catch (error) {
    const errorMsg = error?.response?.data?.message || error?.message || 'Failed to send message. Please try again.';
    dispatch(setError(errorMsg));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};
