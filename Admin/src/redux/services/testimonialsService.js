import api from "../../api/axiosInstance";
import { setLoading, setItems, setError, addItem, updateItem, removeItem } from "../slices/testimonialsSlice";

export const fetchTestimonials = () => async (dispatch) => {
  dispatch(setLoading());
  try {
    // ?all=true so admin sees active + inactive testimonials
    const res = await api.get("/testimonials?all=true");
    dispatch(setItems(res.data));
  } catch (err) {
    const msg = err.response?.data?.message || "Failed to load testimonials";
    dispatch(setError(msg));
    throw err;
  }
};

export const createTestimonial = (formData) => async (dispatch) => {
  try {
    const res = await api.post("/testimonials", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    dispatch(addItem(res.data));
  } catch (err) {
    throw err;
  }
};

export const editTestimonial = ({ id, formData }) => async (dispatch) => {
  try {
    const res = await api.put(`/testimonials/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    dispatch(updateItem(res.data));
  } catch (err) {
    throw err;
  }
};

export const removeTestimonial = (id) => async (dispatch) => {
  try {
    await api.delete(`/testimonials/${id}`);
    dispatch(removeItem(id));
  } catch (err) {
    throw err;
  }
};
