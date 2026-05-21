import api from "../../api/axiosInstance";
import { setLoading, setItems, setError, removeItem } from "../slices/contactsSlice";

export const fetchContacts = () => async (dispatch) => {
    dispatch(setLoading());
    try {
        const res = await api.get("/contact/all");
        dispatch(setItems(res.data || res.data.data || []));
    } catch (err) {
        const msg = err.response?.data?.message || "Failed to load contacts";
        dispatch(setError(msg));
        throw err;
    }
};

export const removeContact = (id) => async (dispatch) => {
    try {
        await api.delete(`/contact/${id}`);
        dispatch(removeItem(id));
    } catch (err) {
        throw err;
    }
};
