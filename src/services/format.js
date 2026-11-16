const LOCALE = "vi-VN";

export const formatVND = (n) =>
    new Intl.NumberFormat(LOCALE, { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n ?? 0);

export const formatVNDShort = (n) => {
    if (n >= 1e9) return `${(n / 1e9).toLocaleString(LOCALE, { maximumFractionDigits: 1 })} tỷ`;
    if (n >= 1e6) return `${(n / 1e6).toLocaleString(LOCALE, { maximumFractionDigits: 1 })} tr`;
    if (n >= 1e3) return `${Math.round(n / 1e3)}k`;
    return String(n);
};

export const formatDate = (value) => (value ? new Date(value).toLocaleDateString(LOCALE) : "");

export const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString(LOCALE, { dateStyle: "medium", timeStyle: "short" }) : "";

export const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

export const ORDER_STATUS_LABEL = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    PROCESSING: "Đang thực hiện",
    DELIVERING: "Đang giao",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã huỷ",
};

export const ORDER_TRANSITIONS = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["DELIVERING", "COMPLETED", "CANCELLED"],
    DELIVERING: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
};

export const stockLabel = (product) => {
    if (product.status !== "ACTIVE") return { text: "Ngừng bán", tone: "muted" };
    if (product.stock <= 0) return { text: product.type === "SERVICE" ? "Hết suất" : "Hết hàng", tone: "danger" };
    if (product.stock <= 3) return { text: `Chỉ còn ${product.stock}`, tone: "warning" };
    return { text: product.type === "SERVICE" ? `Còn ${product.stock} suất` : "Còn hàng", tone: "success" };
};

export const isPurchasable = (product) => product.status === "ACTIVE" && product.stock > 0;
