import api from "../../api/axiosInstance";
import { setLoading, setItems, setError, addItem, updateItem, removeItem } from "../slices/categoriesSlice";

export const fetchCategories = () => async (dispatch) => {
    dispatch(setLoading());
    try {
        const res = await api.get("/categories?active=true");
       dispatch(setItems(res.data.data)); 
    } catch (err) {
        const msg = err.response?.data?.message || "Failed to load categories";
        dispatch(setError(msg));
        throw err;
    }
};

export const createCategory = (formData) => async (dispatch) => {
    try {
       const res = await api.post("/categories", formData);

       dispatch(setItems(res.data.data));

    } catch (err) {
        console.log(err.message);
        
        throw err;
    }
};

export const editCategory = ({ id, formData }) => async (dispatch) => {
    try {
        const res = await api.patch(`/categories/${id}`, formData);
       dispatch(setItems(res.data.data)); 
    } catch (err) {
        throw err;
    }
};

export const removeCategory = (id) => async (dispatch) => {
    try {
       await api.delete(`/categories/${id}`);
        dispatch(removeItem(id));
    } catch (err) {
        throw err;
    }
};