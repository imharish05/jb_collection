import api from "../../api/axiosInstance";
import { setLoading, setItems, setError, addItem, updateItem, removeItem } from "../slices/couponsSlice";

export const fetchCoupons = () => async (dispatch) => {
    dispatch(setLoading());
    try {
        const res = await api.get("/coupons/admin/all");
        dispatch(setItems(res.data));
    } catch (err) {
        const msg = err.response?.data?.message || "Failed to load coupons";
        dispatch(setError(msg));
        throw err;
    }
};

export const createCoupon = (data) => async (dispatch) => {
    try {
        const res = await api.post("/coupons/admin/create", data);
        dispatch(addItem(res.data));
    } catch (err) {
        throw err;
    }
};

export const editCoupon = ({ id, data }) => async (dispatch) => {
    try {
        const res = await api.put(`/coupons/admin/update/${id}`, data);
        dispatch(updateItem(res.data));
    } catch (err) {
        throw err;
    }
};

export const removeCoupon = (id) => async (dispatch) => {
    try {
        await api.delete(`/coupons/admin/delete/${id}`);
        dispatch(removeItem(id));
    } catch (err) {
        throw err;
    }
};
