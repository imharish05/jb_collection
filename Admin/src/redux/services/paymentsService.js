import api from "../../api/axiosInstance";
import { setLoading, setPaymentsData, setError } from "../slices/paymentsSlice";

export const fetchPaymentTransactions = (params) => async (dispatch) => {
    dispatch(setLoading());
    try {
        const res = await api.get("/payment/transactions", { params });
        dispatch(setPaymentsData(res.data));
    } catch (err) {
        const msg = err.response?.data?.message || "Failed to load payment transactions";
        dispatch(setError(msg));
        throw err;
    }
};
