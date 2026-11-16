import api from "./api";

export const mediaService = {
    async getMedia(params) {
        const response = await api.get("/admin/media", { params });
        return response.data;
    },

    async uploadMedia(file, { onProgress, signal } = {}) {
        const form = new FormData();
        form.append("file", file, file.name);
        const response = await api.post("/admin/media", form, {
            params: { takenAt: new Date(file.lastModified).toISOString() },
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (e) => e.total && onProgress?.(e.loaded / e.total),
            signal,
        });
        return response.data;
    },

    async updateMedia(id, data) {
        const response = await api.patch(`/admin/media/${id}`, data);
        return response.data;
    },

    async bulk(ids, action) {
        const response = await api.post("/admin/media/bulk", { ids, action });
        return response.data;
    },

    async editMedia(id, mode, ops) {
        const response = await api.post(`/admin/media/${id}/edit`, { mode, ops });
        return response.data;
    },

    async revertMedia(id) {
        const response = await api.post(`/admin/media/${id}/revert`);
        return response.data;
    },

    async emptyTrash() {
        const response = await api.post("/admin/trash/empty");
        return response.data;
    },

    async getStorage() {
        const response = await api.get("/admin/storage");
        return response.data;
    },
};

export default mediaService;
