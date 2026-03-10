import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

api.interceptors.request.use((config) => {
    if (config.url && !config.url.includes("login") && !config.url.includes("register")) {
        const token = localStorage.getItem("access");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }

    if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
    } else if (!config.headers["Content-Type"]) {
        config.headers["Content-Type"] = "application/json";
    }

    return config;
});

export default api;
