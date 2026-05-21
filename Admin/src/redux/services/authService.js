import api from "../../api/axiosInstance";

export const loginAdmin = async (navigate, credentials, onLoginSuccess) => {
    try {
        const res = await api.post("/auth/admin/login", credentials);
        localStorage.setItem("adminToken", res.data.token);
        if (onLoginSuccess) onLoginSuccess();
        navigate("/dashboard");
    } catch (err) {
    }
};