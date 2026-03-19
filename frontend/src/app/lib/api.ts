import axios from "axios";

function normalizeApiBaseURL(envBaseURL: string | undefined) {
    // Default for local dev
    const raw = (envBaseURL || "http://localhost:8000/api").trim();
    // Remove trailing slash
    const noTrailing = raw.endsWith("/") ? raw.slice(0, -1) : raw;
    const lower = noTrailing.toLowerCase();

    // Common dev misconfig: API base accidentally points to the Next frontend (port 3000).
    // If that happens, requests like "/register/" will hit Next and return an HTML 404 page.
    const looksLikeFrontend = lower.includes("localhost:3000") || lower.includes("127.0.0.1:3000");
    const alreadyHasApiPrefix = lower.endsWith("/api");
    if (looksLikeFrontend && !alreadyHasApiPrefix) {
        return "http://localhost:8000/api";
    }

    // Ensure we end with "/api"
    return lower.endsWith("/api") ? noTrailing : `${noTrailing}/api`;
}

const api = axios.create({
    baseURL: normalizeApiBaseURL(process.env.NEXT_PUBLIC_API_BASE_URL),
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
