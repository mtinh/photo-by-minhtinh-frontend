import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4310/api/v1";

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isAuthCall = /\/(login|register|refresh-token)$/.test(originalRequest?.url ?? "");

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthCall) {
            const refreshToken = localStorage.getItem("refreshToken");

            if (!refreshToken) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const res = await axios.post(`${API_BASE_URL}/refresh-token`, {
                    refreshToken: refreshToken,
                });

                if (res.data?.success) {
                    const newAccessToken = res.data.data.access_token;

                    localStorage.setItem("accessToken", newAccessToken);

                    api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                    processQueue(null, newAccessToken);

                    return api(originalRequest);
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                handleLogoutForce();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

const handleLogoutForce = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("currentUser");
    window.location.href = "/login";
};

export const getErrorMessage = (error, fallback = "Đã xảy ra lỗi, vui lòng thử lại.") =>
    error?.response?.data?.message || (error?.message === "Network Error" ? "Không kết nối được máy chủ." : fallback);

export const getFieldErrors = (error) => {
    const fieldErrors = {};
    for (const { field, message } of error?.response?.data?.errors ?? []) {
        if (field && !fieldErrors[field]) fieldErrors[field] = message;
    }
    return fieldErrors;
};

export default api;
