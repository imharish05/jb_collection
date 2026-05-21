import api from "../../api/axios";
import { loginStart, loginSuccess, loginFailure, logoutAction } from "../slices/authSlice";
import { replaceCart } from "../slices/cart-slice";
import cogoToast from "cogo-toast";

const getRedirectPath = () => {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  return redirect ? decodeURIComponent(redirect) : process.env.PUBLIC_URL + "/";
};

// Sync cart from server after login
const syncCartFromServer = async (dispatch) => {
  try {
    const res = await api.get('/cart');
    const cartItems = res.data || [];
    
    // Map database records to Redux cart structure
    const formattedItems = cartItems.map(cartItem => ({
      id: cartItem.productId,
      cartItemId: cartItem.id,
      quantity: cartItem.quantity,
      selectedVariantId: cartItem.selectedVariantId || null,
      selectedVariantName: cartItem.productSnapshot?.selectedVariantName || null,
      selectedProductColor: cartItem.selectedProductColor || null,
      selectedProductSize: cartItem.selectedProductSize || null,
      name: cartItem.productSnapshot?.name || cartItem.product?.name,
      price: cartItem.productSnapshot?.price || cartItem.product?.price,
      discount: cartItem.productSnapshot?.discount || cartItem.product?.discount || 0,
      image: cartItem.productSnapshot?.image || cartItem.product?.image || [],
      variation: cartItem.product?.variation || [],
    }));
    
    dispatch(replaceCart(formattedItems));
  } catch (err) {
    console.error('Failed to sync cart from server:', err);
  }
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
    
    // Sync cart from server after successful login
    await syncCartFromServer(dispatch);
    
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