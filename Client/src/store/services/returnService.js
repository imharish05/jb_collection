import api from "../../api/axios";
import cogoToast from "cogo-toast";
import {
  returnStart,
  returnFailure,
  setReturns,
  setCurrentReturn,
} from "../slices/returnSlice";

const getAuthHeader = (getState) => {
  const token = getState().auth?.token;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

// ── Submit Return Request ────────────────────────────────────────────────────
export const submitReturnRequest = (formData) => async (dispatch, getState) => {
  dispatch(returnStart());
  try {
    const token = getState().auth?.token;
    const config = {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "multipart/form-data",
      },
    };
    const res = await api.post("/returns", formData, config);
    cogoToast.success("Return request submitted successfully!", { position: "top-center" });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || "Failed to submit return request";
    dispatch(returnFailure(msg));
    cogoToast.error(msg, { position: "top-center" });
    throw err;
  }
};

// ── Fetch My Returns ─────────────────────────────────────────────────────────
export const fetchMyReturns = () => async (dispatch, getState) => {
  dispatch(returnStart());
  try {
    const res = await api.get("/returns", getAuthHeader(getState));
    dispatch(setReturns(res.data || []));
  } catch (err) {
    const msg = err.response?.data?.message || "Failed to load returns";
    dispatch(returnFailure(msg));
    cogoToast.error(msg, { position: "top-center" });
  }
};

// ── Fetch Return By ID ───────────────────────────────────────────────────────
export const fetchReturnById = (id) => async (dispatch, getState) => {
  dispatch(returnStart());
  try {
    const res = await api.get(`/returns/${id}`, getAuthHeader(getState));
    dispatch(setCurrentReturn(res.data));
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || "Failed to load return details";
    dispatch(returnFailure(msg));
    cogoToast.error(msg, { position: "top-center" });
    throw err;
  }
};

// ── Cancel Order ─────────────────────────────────────────────────────────────
export const cancelOrder = (orderId) => async (dispatch, getState) => {
  dispatch(returnStart());
  try {
    const res = await api.patch(`/returns/cancel-order/${orderId}`, {}, getAuthHeader(getState));
    cogoToast.success("Order cancelled successfully!", { position: "top-center" });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || "Failed to cancel order";
    dispatch(returnFailure(msg));
    cogoToast.error(msg, { position: "top-center" });
    throw err;
  }
};
