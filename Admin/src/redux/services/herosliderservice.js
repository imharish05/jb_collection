import api from "../../api/axiosInstance";
import { setLoading, setItems, setError, addItem, updateItem, removeItem } from "../slices/heroSliderSlice";

export const fetchHeroSlides = () => async (dispatch) => {
  dispatch(setLoading());
  try {
    // ?all=true so admin sees active + inactive slides
    const res = await api.get("/hero-slides?all=true");
    dispatch(setItems(res.data));
  } catch (err) {
    const msg = err.response?.data?.message || "Failed to load hero slides";
    dispatch(setError(msg));
    throw err;
  }
};

export const createHeroSlide = (formData) => async (dispatch) => {
  try {
    const res = await api.post("/hero-slides", formData);
    dispatch(addItem(res.data));
  } catch (err) {
    throw err;
  }
};

export const editHeroSlide = ({ id, formData }) => async (dispatch) => {
  try {
    const res = await api.put(`/hero-slides/${id}`, formData);
    dispatch(updateItem(res.data));
  } catch (err) {
    throw err;
  }
};

export const removeHeroSlide = (id) => async (dispatch) => {
  try {
    await api.delete(`/hero-slides/${id}`);
    dispatch(removeItem(id));
  } catch (err) {
    throw err;
  }
};