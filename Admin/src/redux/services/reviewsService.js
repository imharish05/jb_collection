import api from "../../api/axiosInstance";
import { setLoading, setItems, setError, setStatus, removeItem } from "../slices/reviewsSlice";

export const fetchReviews = () => async (dispatch) => {
    dispatch(setLoading());
    try {
        const res = await api.get("/reviews");
        dispatch(setItems(res.data));
    } catch (err) {
        const msg = err.response?.data?.message || "Failed to load reviews";
        dispatch(setError(msg));
        throw err;
    }
};

export const approveReview = (id) => async (dispatch) => {
    try {
        await api.put(`/reviews/update/${id}`, { status: "Approved" });
        dispatch(setStatus({ id, status: "Approved" }));
    } catch (err) {
        throw err;
    }
};

export const rejectReview = (id) => async (dispatch) => {
    try {
        await api.put(`/reviews/update/${id}`, { status: "Rejected" });
        dispatch(setStatus({ id, status: "Rejected" }));
    } catch (err) {
        throw err;
    }
};

export const removeReview = (id) => async (dispatch) => {
    try {
        await api.delete(`/reviews/${id}`);
        dispatch(removeItem(id));
    } catch (err) {
        throw err;
    }
};
