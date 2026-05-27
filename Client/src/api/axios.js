import axios from "axios";

console.log(process.env.REACT_APP_API_URL,"This is the url")

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
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            // Only hard-redirect if the user actually had a session
            // AND we are not already on the login page.
            // This prevents startup API calls (cart/wishlist) from
            // kicking a freshly-loaded page to /login unnecessarily.
            // if (wasLoggedIn && !window.location.pathname.includes("/login")) {
            //     window.location.replace(
            //         (process.env.REACT_APP_PUBLIC_URL || "") + "/login"
            //     );
            // }
        }
        return Promise.reject(error);
    }
);

export default api;