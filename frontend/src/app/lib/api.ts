import axios from "axios";

const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const defaultBaseUrl = "http://127.0.0.1:8000/api";
const baseURL = (configuredBaseUrl || defaultBaseUrl).replace(/\/+$/, "");

const api = axios.create({
    baseURL,
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
