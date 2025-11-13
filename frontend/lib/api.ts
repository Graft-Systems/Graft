import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000/api/", // Django backend URL
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    if (config.url && !config.url.includes("login") && !config.url.includes("register")) {
        const token = localStorage.getItem("access");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export default api;
