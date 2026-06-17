import api from "../../api/axiosInstance";
import { setLoading, setItems, setError, updateStatus, updateItemStatus } from "../slices/ordersSlice";

export const fetchOrders = () => async (dispatch) => {
    dispatch(setLoading());
    try {
        const res = await api.get("/orders/all");
        dispatch(setItems(Array.isArray(res.data.orders) ? res.data.orders : []));
    } catch (err) {
        const msg = err.response?.data?.message || "Failed to load orders";
        dispatch(setError(msg));
        throw err;
    }
};

export const changeOrderStatus = ({ id, ...payload }) => async (dispatch) => {
    try {
        await api.patch(`/orders/${id}/status`, payload);
        dispatch(updateStatus({ id, ...payload }));
    } catch (err) {
        throw err;
    }
};

export const changeOrderItemStatus = ({ orderId, itemId, status }) => async (dispatch) => {
    try {
        await api.patch(`/orders/${orderId}/items/${itemId}/status`, { status });
        dispatch(updateItemStatus({ orderId, itemId, status }));
    } catch (err) {
        throw err;
    }
};
