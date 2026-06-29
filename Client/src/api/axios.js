import axios from "axios";
import { store } from "../store/store";
import { logoutAction } from "../store/slices/authSlice";

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const wasLoggedIn = !!localStorage.getItem("token");
            // Clear localStorage AND Redux state so UI reflects logged-out state
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            store.dispatch(logoutAction());
            // Redirect to login only if user had an active session
            if (wasLoggedIn && !window.location.pathname.includes("/login")) {
                window.location.replace(
                    (process.env.REACT_APP_PUBLIC_URL || "") + "/login"
                );
            }
        }
        return Promise.reject(error);
    }
);

export default api;
