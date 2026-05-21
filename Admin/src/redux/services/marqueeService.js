import api from "../../api/axiosInstance";
import { setLoading, setItems, setError, addItem, updateItem, removeItem } from "../slices/marqueeSlice";

export const fetchMarquees = () => async (dispatch) => {
    dispatch(setLoading());
    try {
        const res = await api.get("/marquee?all=true");
        dispatch(setItems(res.data.data || res.data || []));
    } catch (err) {
        const msg = err.response?.data?.message || "Failed to load marquee messages";
        dispatch(setError(msg));
        throw err;
    }
};

export const createMarquee = (data) => async (dispatch) => {
    try {
        const res = await api.post("/marquee", data);
        dispatch(addItem(res.data.data || res.data));
    } catch (err) {
        throw err;
    }
};

export const editMarquee = ({ id, data }) => async (dispatch) => {
    try {
        const res = await api.patch(`/marquee/${id}`, data);
        dispatch(updateItem(res.data.data || res.data));
    } catch (err) {
        throw err;
    }
};

export const removeMarquee = (id) => async (dispatch) => {
    try {
        await api.delete(`/marquee/${id}`);
        dispatch(removeItem(id));
    } catch (err) {
        throw err;
    }
};
