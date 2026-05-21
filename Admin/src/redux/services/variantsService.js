import api from "../../api/axiosInstance";
import { setLoading, setItems, setError, addItem, updateItem, removeItem } from "../slices/variantsSlice";

export const fetchVariants = () => async (dispatch) => {
    dispatch(setLoading());
    try {
        const res = await api.get("/variants");
        dispatch(setItems(res.data));
    } catch (err) {
        const msg = err.response?.data?.message || "Failed to load variants";
        dispatch(setError(msg));
        throw err;
    }
};

export const createVariant = (data) => async (dispatch) => {
    try {
        const res = await api.post("/variants/add", data);
        dispatch(addItem(res.data));
    } catch (err) {
        throw err;
    }
};

export const editVariant = ({ id, data }) => async (dispatch) => {
    try {
        const res = await api.put(`/variants/update/${id}`, data);
        dispatch(updateItem(res.data));
    } catch (err) {
        throw err;
    }
};

export const removeVariant = (id) => async (dispatch) => {
    try {
        await api.delete(`/variants/${id}`);
        dispatch(removeItem(id));
    } catch (err) {
        throw err;
    }
};
