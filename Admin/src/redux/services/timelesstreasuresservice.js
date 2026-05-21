import api from "../../api/axiosInstance";
import { setLoading, setItems, setError, addItem, updateItem, removeItem } from "../slices/timelessTreasuresSlice";

export const fetchOfferBanners = () => async (dispatch) => {
  dispatch(setLoading());
  try {
    const res = await api.get("/offer-banners?all=true");
    dispatch(setItems(res.data));
  } catch (err) {
    const msg = err.response?.data?.message || "Failed to load offer banners";
    dispatch(setError(msg));
    throw err;
  }
};

export const createOfferBanner = (formData) => async (dispatch) => {
  try {
    const res = await api.post("/offer-banners", formData);
    dispatch(addItem(res.data));
  } catch (err) {
    throw err;
  }
};

export const editOfferBanner = ({ id, formData }) => async (dispatch) => {
  try {
    const res = await api.put(`/offer-banners/${id}`, formData);
    dispatch(updateItem(res.data));
  } catch (err) {
    throw err;
  }
};

export const removeOfferBanner = (id) => async (dispatch) => {
  try {
    await api.delete(`/offer-banners/${id}`);
    dispatch(removeItem(id));
  } catch (err) {
    throw err;
  }
};