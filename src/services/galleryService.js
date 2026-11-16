import api from "./api";

const tokenKey = (slug) => `gallery_${slug}`;

export const getGalleryToken = (slug) => localStorage.getItem(tokenKey(slug));

const saveToken = (slug, token) => token && localStorage.setItem(tokenKey(slug), token);

const config = (slug, extra = {}) => {
    const token = getGalleryToken(slug);
    return { ...extra, headers: { ...(extra.headers ?? {}), ...(token && { "X-Gallery-Token": token }) } };
};

export const galleryService = {
    async getGallery(slug) {
        const response = await api.get(`/gallery/${slug}`, config(slug));
        return response.data;
    },

    async getMedia(slug, cursor) {
        const response = await api.get(`/gallery/${slug}/media`, config(slug, { params: { cursor } }));
        return response.data;
    },

    async unlock(slug, password) {
        const response = await api.post(`/gallery/${slug}/unlock`, { password }, config(slug));
        saveToken(slug, response.data.data?.token);
        return response.data;
    },

    async downloadAccess(slug, pin) {
        const response = await api.post(`/gallery/${slug}/download-access`, { pin }, config(slug));
        saveToken(slug, response.data.data?.token);
        return response.data;
    },

    async identify(slug, email) {
        const response = await api.post(`/gallery/${slug}/identify`, { email }, config(slug));
        saveToken(slug, response.data.data?.token);
        return response.data;
    },

    async toggleFavorite(slug, id, value) {
        const response = await api.post(`/gallery/${slug}/media/${id}/favorite`, { value }, config(slug));
        saveToken(slug, response.data.data?.token);
        return response.data;
    },
};

export default galleryService;
