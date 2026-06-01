import api from "../../api/axiosInstance";

export const loginAdmin = async (navigate, credentials, onLoginSuccess, showToast) => {
    let toastId;
    try {
        toastId = showToast.loading('Verifying credentials...');
        const res = await api.post("/auth/admin/login", credentials);
        localStorage.setItem("adminToken", res.data.token);
        showToast.success('Login successful! Redirecting...', toastId);
        if (onLoginSuccess) onLoginSuccess();
        setTimeout(() => navigate("/dashboard"), 500);
    } catch (err) {
        const errorMessage = err?.response?.data?.message || 'Login failed. Please check your credentials.';
        showToast.error(errorMessage, toastId);
    }
};