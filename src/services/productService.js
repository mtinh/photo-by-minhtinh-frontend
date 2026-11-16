import api from "./api";

export const productService = {
    async getProducts(params) {
        const response = await api.get("/products", { params });
        return response.data;
    },

    async getProductDetail(slug) {
        const response = await api.get(`/products/${encodeURIComponent(slug)}`);
        return response.data;
    },

    async getCategories() {
        const response = await api.get("/categories");
        return response.data;
    },

    async getAdminProducts(params) {
        const response = await api.get("/admin/products", { params });
        return response.data;
    },

    async createProduct(data) {
        const response = await api.post("/admin/products", data);
        return response.data;
    },

    async updateProduct(id, data) {
        const response = await api.put(`/admin/products/${id}`, data);
        return response.data;
    },

    async deleteProduct(id) {
        const response = await api.delete(`/admin/products/${id}`);
        return response.data;
    },

    async uploadImage(file) {
        const form = new FormData();
        form.append("file", file);
        const response = await api.post("/admin/products/image", form, { headers: { "Content-Type": "multipart/form-data" } });
        return response.data;
    },
};

export default productService;
