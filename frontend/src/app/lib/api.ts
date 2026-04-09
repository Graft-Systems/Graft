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

const API_BASE_URL = normalizeApiBaseURL(process.env.NEXT_PUBLIC_API_BASE_URL);

let refreshRequest: Promise<string | null> | null = null;

function isAuthRoute(url?: string) {
    if (!url) return false;
    return ["/login/", "/register/", "/token/", "/token/refresh/"].some((route) => url.includes(route));
}

function clearStoredAuth() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("role");
    localStorage.removeItem("is_staff");
}

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        if (!isAuthRoute(config.url)) {
            const token = localStorage.getItem("access");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
    }

    if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
    } else if (!config.headers["Content-Type"]) {
        config.headers["Content-Type"] = "application/json";
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

        if (
            typeof window === "undefined" ||
            !originalRequest ||
            originalRequest._retry ||
            error.response?.status !== 401 ||
            isAuthRoute(originalRequest.url)
        ) {
            return Promise.reject(error);
        }

        const refreshToken = localStorage.getItem("refresh");
        if (!refreshToken) {
            clearStoredAuth();
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (!refreshRequest) {
            refreshRequest = axios
                .post(`${API_BASE_URL}/token/refresh/`, { refresh: refreshToken })
                .then((response) => {
                    const newAccessToken = response.data?.access;
                    if (newAccessToken) {
                        localStorage.setItem("access", newAccessToken);
                        return newAccessToken as string;
                    }
                    return null;
                })
                .catch(() => {
                    clearStoredAuth();
                    return null;
                })
                .finally(() => {
                    refreshRequest = null;
                });
        }

        const newAccessToken = await refreshRequest;
        if (!newAccessToken) {
            return Promise.reject(error);
        }

        originalRequest.headers = {
            ...(originalRequest.headers ?? {}),
            Authorization: `Bearer ${newAccessToken}`,
        };

        return api(originalRequest);
    }
);

export default api;
