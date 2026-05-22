import api from "../../api/axios";
import cogoToast from "cogo-toast";
import { orderStart, orderFailure, setOrders } from "../slices/order-slice";

const getAuthHeader = (getState) => {
  const token = getState().auth?.token;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const fetchOrders = () => async (dispatch, getState) => {
  dispatch(orderStart());
  try {
    const res = await api.get("/orders", getAuthHeader(getState));
    dispatch(setOrders(res.data || []));
  } catch (err) {
    const msg = err.response?.data?.message || "Failed to load orders";
    dispatch(orderFailure(msg));
    cogoToast.error(msg, { position: "top-center" });
  }
};
