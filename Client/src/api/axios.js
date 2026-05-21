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

// api.interceptors.response.use(
//     (response) => response,
//     (error) => {
//         if (error.response && error.response.status === 401) {
//             localStorage.removeItem("token");
//             localStorage.removeItem("user");

//             // ONLY redirect if we aren't already on the sign-in page
//             if (!window.location.pathname.includes("/login")) {
//                 window.location.replace("/login");
//             }
//         }
//         return Promise.reject(error);
//     }
// );

export default api;
