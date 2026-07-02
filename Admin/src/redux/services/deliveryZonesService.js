import api from "../../api/axiosInstance";
import { setLoading, setItems, setError, addItem, updateItem, removeItem } from "../slices/deliveryZonesSlice";

export const fetchDeliveryZones = () => async (dispatch) => {
    dispatch(setLoading());
    try {
        const res = await api.get("/delivery-zones/admin/all");
        dispatch(setItems(res.data));
    } catch (err) {
        const msg = err.response?.data?.message || "Failed to load delivery zones";
        dispatch(setError(msg));
        throw err;
    }
};

export const createDeliveryZone = (data) => async (dispatch) => {
    try {
        const res = await api.post("/delivery-zones/admin/create", data);
        dispatch(addItem(res.data));
    } catch (err) {
        throw err;
    }
};

export const editDeliveryZone = ({ id, data }) => async (dispatch) => {
    try {
        const res = await api.put(`/delivery-zones/admin/update/${id}`, data);
        dispatch(updateItem(res.data));
    } catch (err) {
        throw err;
    }
};

export const removeDeliveryZone = (id) => async (dispatch) => {
    try {
        await api.delete(`/delivery-zones/admin/delete/${id}`);
        dispatch(removeItem(id));
    } catch (err) {
        throw err;
    }
};
