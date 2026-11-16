import api from "./api";

export const albumService = {
    async getAlbums() {
        const response = await api.get("/admin/albums");
        return response.data;
    },

    async getAlbum(id) {
        const response = await api.get(`/admin/albums/${id}`);
        return response.data;
    },

    async createAlbum(data) {
        const response = await api.post("/admin/albums", data);
        return response.data;
    },

    async updateAlbum(id, data) {
        const response = await api.patch(`/admin/albums/${id}`, data);
        return response.data;
    },

    async deleteAlbum(id) {
        const response = await api.delete(`/admin/albums/${id}`);
        return response.data;
    },

    async addItems(id, mediaIds) {
        const response = await api.post(`/admin/albums/${id}/items`, { mediaIds });
        return response.data;
    },

    async removeItems(id, mediaIds) {
        const response = await api.post(`/admin/albums/${id}/items/remove`, { mediaIds });
        return response.data;
    },

    async saveGallery(id, data) {
        const response = await api.put(`/admin/albums/${id}/gallery`, data);
        return response.data;
    },

    async publish(id, rotate = false) {
        const response = await api.post(`/admin/albums/${id}/publish`, { rotate });
        return response.data;
    },

    async unpublish(id) {
        const response = await api.post(`/admin/albums/${id}/unpublish`);
        return response.data;
    },

    async getPicks(id) {
        const response = await api.get(`/admin/albums/${id}/picks`);
        return response.data;
    },
};

export default albumService;
