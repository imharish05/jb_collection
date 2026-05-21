import api from "../../api/axios";
import cogoToast from "cogo-toast";
import {
  addressStart,
  addressFailure,
  setAddresses,
  addAddress,
  updateAddress,
  removeAddress,
} from "../slices/addressSlice";

const getAuthHeader = (getState) => {
  const token = getState().auth?.token;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

// ── GET /api/address ──────────────────────────────────────────────────────────
export const fetchAddresses = () => async (dispatch, getState) => {
  dispatch(addressStart());
  try {
    const res = await api.get("/address", getAuthHeader(getState));
    dispatch(setAddresses(res.data));
  } catch (err) {
    const msg = err.response?.data?.message || "Failed to load addresses";
    dispatch(addressFailure(msg));
    // No loader here, so immediate call is fine
    cogoToast.error(msg, { position: "top-center" });
  }
};

// ── POST /api/address ─────────────────────────────────────────────────────────
export const addAddressService = (addressData) => async (dispatch, getState) => {
  dispatch(addressStart());
  const loader = cogoToast.loading("Saving address...", { hideAfter: 0 });
  try {
    const res = await api.post("/address", addressData, getAuthHeader(getState));
    
    if (loader?.hide) loader.hide(); // Hide loader before success

    dispatch(addAddress(res.data));
    setTimeout(() => {
      cogoToast.success("Address saved successfully!");
    }, 100);
    return true;
  } catch (err) {
    if (loader?.hide) loader.hide(); // Hide loader first
    const msg = err.response?.data?.message || "Failed to save address";
    
    dispatch(addressFailure(msg));
    setTimeout(() => {
      cogoToast.error(msg, { position: "top-center" });
    }, 50); // Delay error toast
    return false;
  }
};

// ── PUT /api/address/:id ──────────────────────────────────────────────────────
export const updateAddressService = (id, addressData) => async (dispatch, getState) => {
  dispatch(addressStart());
  const loader = cogoToast.loading("Updating address...", { hideAfter: 0 });
  try {
    const res = await api.put(`/address/${id}`, addressData, getAuthHeader(getState));
    
    if (loader?.hide) loader.hide(); // Hide loader before success

    dispatch(updateAddress(res.data));
    setTimeout(() => {
      cogoToast.success("Address updated successfully!");
    }, 100);
    return true;
  } catch (err) {
    if (loader?.hide) loader.hide(); // Hide loader first
    const msg = err.response?.data?.message || "Failed to update address";
    
    dispatch(addressFailure(msg));
    setTimeout(() => {
      cogoToast.error(msg, { position: "top-right" });
    }, 50); // Delay error toast
    return false;
  }
};

// ── DELETE /api/address/:id ───────────────────────────────────────────────────
export const deleteAddressService = (id) => async (dispatch, getState) => {
  dispatch(addressStart());
  try {
    await api.delete(`/address/${id}`, getAuthHeader(getState));
    dispatch(removeAddress(id));
    cogoToast.success("Address removed", { position: "top-center" }); 
  } catch (err) {
    const msg = err.response?.data?.message || "Failed to remove address";
    dispatch(addressFailure(msg));
    cogoToast.error(msg, { position: "top-center" });
  }
};

// ── PATCH /api/address/:id/default ────────────────────────────────────────────
export const setDefaultAddressService = (id) => async (dispatch, getState) => {
  try {
    const res = await api.patch(`/address/${id}/default`, {}, getAuthHeader(getState));
    dispatch(updateAddress(res.data)); 
    cogoToast.success("Default address updated", { position: "top-center" });
  } catch (err) {
    const msg = err.response?.data?.message || "Failed to set default";
    cogoToast.error(msg, { position: "top-center" });
  }
};