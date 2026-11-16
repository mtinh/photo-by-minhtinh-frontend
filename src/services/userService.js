import api from "./api";

export const userService = {
    getUsers: async (params) => {
        const response = await api.get("/admin/users", { params });
        return response.data;
    },

    createUser: async (data) => {
        const response = await api.post("/admin/users", data);
        return response.data;
    },

    updateUser: async (id, data) => {
        const response = await api.patch(`/admin/users/${id}`, data);
        return response.data;
    },

    deleteUser: async (id) => {
        const response = await api.delete(`/admin/users/${id}`);
        return response.data;
    },
};

export default userService;
