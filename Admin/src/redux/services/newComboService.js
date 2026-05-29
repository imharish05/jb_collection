// Admin/src/redux/services/newComboService.js
import api from "../../api/axiosInstance";
import {
  setLoading, setRootCombos, setCurrentRoot, setError,
  addRootCombo, updateRootCombo, removeRootCombo,
  addChildToRoot, updateChildInRoot, removeChildFromRoot,
  addProductToChild, removeProductFromChild,
} from "../slices/newComboSlice";

// ── Root combos ───────────────────────────────────────────────────────────────

export const fetchRootCombos = () => async (dispatch) => {
  dispatch(setLoading());
  try {
    const res = await api.get("/combos");
    dispatch(setRootCombos(res.data.data || []));
  } catch (err) {
    dispatch(setError(err.response?.data?.message || "Failed to load combos"));
    throw err;
  }
};

export const fetchRootComboById = (id) => async (dispatch) => {
  dispatch(setLoading());
  try {
    const res = await api.get(`/combos/${id}`);
    dispatch(setCurrentRoot(res.data.data));
    return res.data.data;
  } catch (err) {
    dispatch(setError(err.response?.data?.message || "Failed to load combo"));
    throw err;
  }
};

export const createRootCombo = (formData) => async (dispatch) => {
  try {
    const res = await api.post("/combos/root", formData);
    dispatch(addRootCombo(res.data.data));
    return res.data.data;
  } catch (err) {
    throw err;
  }
};

export const updateRootComboAction = ({ id, formData }) => async (dispatch) => {
  try {
    const res = await api.put(`/combos/root/${id}`, formData);
    dispatch(updateRootCombo(res.data.data));
    return res.data.data;
  } catch (err) {
    throw err;
  }
};

export const deleteRootCombo = (id) => async (dispatch) => {
  try {
    await api.delete(`/combos/root/${id}`);
    dispatch(removeRootCombo(id));
  } catch (err) {
    throw err;
  }
};

// ── Child combos ──────────────────────────────────────────────────────────────

export const createChildCombo = (formData) => async (dispatch) => {
  try {
    const res = await api.post("/combos/child", formData);
    dispatch(addChildToRoot(res.data.data));
    return res.data.data;
  } catch (err) {
    throw err;
  }
};

export const updateChildCombo = ({ id, formData }) => async (dispatch) => {
  try {
    const res = await api.put(`/combos/child/${id}`, formData);
    dispatch(updateChildInRoot(res.data.data));
    return res.data.data;
  } catch (err) {
    throw err;
  }
};

export const deleteChildCombo = (id) => async (dispatch) => {
  try {
    await api.delete(`/combos/child/${id}`);
    dispatch(removeChildFromRoot(id));
  } catch (err) {
    throw err;
  }
};

// ── Child combo products ──────────────────────────────────────────────────────

export const addChildProduct = ({ childId, data }) => async (dispatch) => {
  try {
    const res = await api.post(`/combos/child/${childId}/products`, data);
    dispatch(addProductToChild({ childId, product: res.data.data }));
    return res.data.data;
  } catch (err) {
    throw err;
  }
};

export const removeChildProduct = ({ childId, pid }) => async (dispatch) => {
  try {
    await api.delete(`/combos/child/${childId}/products/${pid}`);
    dispatch(removeProductFromChild({ childId, productRecordId: pid }));
  } catch (err) {
    throw err;
  }
};
