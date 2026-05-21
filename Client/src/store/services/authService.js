import api from "../../api/axios";
import { loginStart, loginSuccess, loginFailure, logoutAction } from "../slices/authSlice";
import cogoToast from "cogo-toast";

const getRedirectPath = () => {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  return redirect ? decodeURIComponent(redirect) : process.env.PUBLIC_URL + "/";
};

// --- REGISTER ---
export const registerFunction = async (dispatch, navigate, userData) => {
  dispatch(loginStart());
  const loader = cogoToast.loading("Creating your account...", { hideAfter: 0 });

  try {
    const res = await api.post("/auth/register", userData);
    if (loader?.hide) loader.hide();

    dispatch(loginSuccess(res.data));
    setTimeout(() => {
      cogoToast.success(`Welcome to Kamali Gifts, ${res.data.name}!`);
    }, 100);

    navigate(getRedirectPath());
  } catch (err) {
    if (loader?.hide) loader.hide(); // Hide first
    const msg = err.response?.data?.message || "Registration failed";
    
    dispatch(loginFailure(msg));
    setTimeout(() => { cogoToast.error(msg); }, 50); // Delay error
  }
};

// --- LOGIN ---
export const loginFunction = async (dispatch, navigate, credentials) => {
  dispatch(loginStart());
  const loader = cogoToast.loading("Logging in...", { hideAfter: 0 });

  try {
    const res = await api.post("/auth/login", credentials);
    if (loader?.hide) loader.hide();

    dispatch(loginSuccess(res.data));
    setTimeout(() => {
      cogoToast.success(`Welcome back, ${res.data.name}!`);
    }, 100);

    navigate(getRedirectPath());
  } catch (err) {
    if (loader?.hide) loader.hide(); 
    const msg = err.response?.data?.message || "Invalid credentials";
    
    dispatch(loginFailure(msg));
    setTimeout(() => { cogoToast.error(msg); }, 50);
  }
};

// --- UPDATE PROFILE ---
export const updateProfileFunction = async (dispatch, userData) => {
  dispatch(loginStart());
  const loader = cogoToast.loading("Updating profile...", { hideAfter: 0 });

  try {
    const res = await api.put("/auth/me", userData);
    if (loader?.hide) loader.hide();

    dispatch(loginSuccess(res.data));
    setTimeout(() => {
      cogoToast.success("Profile updated successfully!");
    }, 100);

    return true;
  } catch (err) {
    if (loader?.hide) loader.hide();
    const msg = err.response?.data?.message || "Update failed";
    
    dispatch(loginFailure(msg));
    setTimeout(() => { cogoToast.error(msg); }, 50);
    return false;
  }
};

// --- UPDATE PASSWORD ---
export const updatePasswordService = async (passwordData) => {
  const loader = cogoToast.loading("Updating password...", { hideAfter: 0 });
  
  try {
    await api.put("/auth/update-password", {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });

    if (loader?.hide) loader.hide();

    setTimeout(() => {
      cogoToast.success("Password updated successfully");
    }, 100);
    
    return true;
  } catch (err) {
    if (loader?.hide) loader.hide();
    const msg = err.response?.data?.message || "Update failed";
    
    setTimeout(() => { cogoToast.error(msg); }, 50);
    return false;
  }
};

// --- LOGOUT ---
export const logoutFunction = (dispatch, navigate) => {
  dispatch(logoutAction());
  cogoToast.success("Logged out successfully", { position: "top-center" });
  navigate(process.env.PUBLIC_URL + "/");
};