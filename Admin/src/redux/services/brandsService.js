import api from "../../api/axiosInstance";
import { setLoading, setItems, setError, addItem, updateItem, removeItem } from "../slices/brandsSlice";

export const fetchBrands = () => async (dispatch) => {
    dispatch(setLoading());
    try {
        const res = await api.get("/brands");
        dispatch(setItems(res.data));
    } catch (err) {
        const msg = err.response?.data?.message || "Failed to load brands";
        dispatch(setError(msg));
        throw err;
    }
};

export const createBrand = (formData) => async (dispatch) => {
    try {
        const res = await api.post("/brands/add", formData);
        dispatch(addItem(res.data));
    } catch (err) {
        throw err;
    }
};

export const editBrand = ({ id, formData }) => async (dispatch) => {
    try {
        const res = await api.put(`/brands/update/${id}`, formData);
        dispatch(updateItem(res.data));
    } catch (err) {
        throw err;
    }
};

export const removeBrand = (id) => async (dispatch) => {
    try {
        await api.delete(`/brands/${id}`);
        dispatch(removeItem(id));
    } catch (err) {
        throw err;
    }
};
