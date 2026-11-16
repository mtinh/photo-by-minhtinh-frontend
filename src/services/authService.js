import api from "./api";

const authService = {
    login: async (email, password) => {
        const response = await api.post("/login", { email, password });
        return response.data;
    },

    register: async (data) => {
        const response = await api.post("/register", data);
        return response.data;
    },

    logout: async () => {
        const refreshToken = localStorage.getItem("refreshToken");
        const response = await api.post("/logout", { refreshToken });
        return response.data;
    },

    forgotPassword: async (email) => {
        const response = await api.post("/forgot-password", { email });
        return response.data;
    },

    resetPassword: async (token, password) => {
        const response = await api.post("/reset-password", { token, password });
        return response.data;
    },

    getMe: async () => {
        const response = await api.get("/me");
        return response.data;
    },

    updateMe: async (data) => {
        const response = await api.patch("/me", data);
        return response.data;
    },

    changePassword: async (currentPassword, newPassword) => {
        const response = await api.post("/change-password", { currentPassword, newPassword });
        return response.data;
    },
};

export default authService;
