import api from "./api";

export const orderService = {
    async placeOrder(data) {
        const response = await api.post("/orders", data);
        return response.data;
    },

    async getMyOrders(params) {
        const response = await api.get("/orders", { params });
        return response.data;
    },

    async getMyOrder(code) {
        const response = await api.get(`/orders/${encodeURIComponent(code)}`);
        return response.data;
    },

    async cancelMyOrder(code, reason) {
        const response = await api.post(`/orders/${encodeURIComponent(code)}/cancel`, { reason });
        return response.data;
    },

    async getMyGalleries() {
        const response = await api.get("/my-galleries");
        return response.data;
    },

    async getOrders(params) {
        const response = await api.get("/admin/orders", { params });
        return response.data;
    },

    async getOrder(id) {
        const response = await api.get(`/admin/orders/${id}`);
        return response.data;
    },

    async updateStatus(id, data) {
        const response = await api.patch(`/admin/orders/${id}/status`, data);
        return response.data;
    },

    async attachGallery(id, albumId) {
        const response = await api.put(`/admin/orders/${id}/gallery`, { albumId });
        return response.data;
    },

    async getStats(range) {
        const response = await api.get("/admin/dashboard", { params: { range } });
        return response.data;
    },
};

export default orderService;
