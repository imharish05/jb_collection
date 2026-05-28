// Client/src/store/services/comboService.js
import api from "../../api/axios";
import { setLoading, setCurrentCombo, setError } from "../slices/combo-slice";
import { store } from "../store";
import cogoToast from "cogo-toast";

export const fetchComboById = (id) => async (dispatch) => {
  dispatch(setLoading());
  try {
    const res = await api.get(`/combos/${id}`);
    dispatch(setCurrentCombo(res.data.data));
    return res.data.data;
  } catch (err) {
    dispatch(setError(err.response?.data?.message || "Failed to load combo"));
    throw err;
  }
};

export const validateCombo = async ({ childComboId, selections }) => {
  try {
    const res = await api.post("/combos/validate", { childComboId, selections });
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const addComboToCart = async ({ childComboId, quantity = 1, selections }) => {
  const state = store.getState();
  if (!state.auth?.isAuthenticated) {
    cogoToast.warn("Please login to add items to cart", { position: "top-center" });
    const redirect = encodeURIComponent(window.location.pathname);
    window.location.href = `/login?redirect=${redirect}`;
    return null;
  }
  try {
    const res = await api.post("/combos/cart/add", { childComboId, quantity, selections });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.errors?.join(", ") || err.response?.data?.message || "Failed to add combo to cart";
    cogoToast.error(msg, { position: "top-center" });
    throw err;
  }
};
