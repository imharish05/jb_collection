import api from "../../api/axiosInstance";
import { setLoading, setItems, setError, removeItem } from "../slices/eventSlice";

export const fetchEvents = () => async (dispatch) => {
    dispatch(setLoading());
    try {
        const res = await api.get("/events");
        dispatch(setItems(res.data.data));
    } catch (err) {
        const msg = err.response?.data?.message || "Failed to load events";
        dispatch(setError(msg));
        throw err;
    }
};

export const createEvent = (data) => async (dispatch) => {
    try {
        await api.post("/events", data);
        // Re-fetch the full list instead of setting a single item
        const res = await api.get("/events");
        dispatch(setItems(res.data.data));
    } catch (err) {
        throw err;
    }
};

export const editEvent = ({ id, data }) => async (dispatch) => {
    try {
        await api.patch(`/events/${id}`, data);
        // Re-fetch the full list
        const res = await api.get("/events");
        dispatch(setItems(res.data.data));
    } catch (err) {
        throw err;
    }
};
export const removeEvent = (id) => async (dispatch) => {
    try {
        await api.delete(`/events/${id}`);
        dispatch(removeItem(id));
    } catch (err) {
        throw err;
    }
};