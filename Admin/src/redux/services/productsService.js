import api from "../../api/axiosInstance";
import { setLoading, setItems, setError, removeItem } from "../slices/productsSlice";

export const fetchProducts = () => async (dispatch) => {
    dispatch(setLoading());
    try {
        const res = await api.get("/products");
        dispatch(setItems(res.data));
    } catch (err) {
        const msg = err.response?.data?.message || "Failed to load products";
        dispatch(setError(msg));
        throw err;
    }
};

export const createProduct = (formData) => async (dispatch) => {
    try {
        await api.post("/products/add", formData);
    } catch (err) {
        throw err;
    }
};

export const editProduct = ({ id, formData }) => async (dispatch) => {
    try {
        await api.put(`/products/update/${id}`, formData);
    } catch (err) {
        throw err;
    }
};

export const removeProduct = (id) => async (dispatch) => {
    try {
        await api.delete(`/products/${id}`);
        dispatch(removeItem(id));
    } catch (err) {
        throw err;
    }
};
