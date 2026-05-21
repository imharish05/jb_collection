import api from "../../api/axiosInstance";
import { setLoading, setItems, setError } from "../slices/customersSlice";

export const fetchCustomers = () => async (dispatch) => {
    dispatch(setLoading());
    try {
        const res = await api.get("/customers");
        dispatch(setItems(res.data));
    } catch (err) {
        const msg = err.response?.data?.message || "Failed to load customers";
        dispatch(setError(msg));
        throw err;
    }
};
