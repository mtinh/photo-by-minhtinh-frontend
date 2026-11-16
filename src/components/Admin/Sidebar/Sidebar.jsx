import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { AiOutlineProduct } from "react-icons/ai";
import { FaRegUser } from "react-icons/fa6";
import { MdDashboard, MdOutlinePhotoLibrary, MdOutlineShoppingCart } from "react-icons/md";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

import { useTheme } from "../../../context/ThemeContext";
import mediaService from "../../../services/mediaService";
import { formatBytes } from "../../../services/format";

import "./Sidebar.css";

function Sidebar({ open, onClose }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme } = useTheme();

    const [openProduct, setOpenProduct] = useState(() => /product|category/.test(location.pathname));
    const [openPhoto, setOpenPhoto] = useState(() => /photos|album/.test(location.pathname));
    const [storage, setStorage] = useState(null);

    useEffect(() => {
        mediaService
            .getStorage()
            .then((res) => setStorage(res.data))
            .catch(() => setStorage(null));
    }, [location.pathname]);

    const go = (path) => {
        navigate(path);
        onClose();
    };

    const isActive = (path) => (location.pathname === path ? "active" : "");

    const percent = storage ? Math.min(100, (storage.usedBytes / storage.quotaBytes) * 100) : 0;

    return (
        <>
            {open && <div className="sidebar-backdrop" onClick={onClose} />}

            <aside className={`sidebar ${theme} ${open ? "open" : ""}`}>
                <ul className="menu">

                    <li className={`menu-item ${isActive("/dashboard")}`} onClick={() => go("/dashboard")}>
                        <MdDashboard />
                        <span>Dashboard</span>
                    </li>

                    <li className={`menu-item ${isActive("/list-order") || (location.pathname.startsWith("/detail-order") ? "active" : "")}`} onClick={() => go("/list-order")}>
                        <MdOutlineShoppingCart />
                        <span>Đơn hàng</span>
                    </li>

                    <li>
                        <div className="menu-item" onClick={() => setOpenProduct(!openProduct)}>
                            <AiOutlineProduct />
                            <span className="menu-title">Sản phẩm</span>
                            <span className="menu-arrow">{openProduct ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}</span>
                        </div>

                        {openProduct && (
                            <ul className="submenu">
                                <li className={`submenu-item ${isActive("/list-product")}`} onClick={() => go("/list-product")}>
                                    Danh sách sản phẩm
                                </li>
                                <li className={`submenu-item ${isActive("/insert-product")}`} onClick={() => go("/insert-product")}>
                                    Thêm sản phẩm
                                </li>
                                <li className={`submenu-item ${isActive("/list-category")}`} onClick={() => go("/list-category")}>
                                    Danh mục
                                </li>
                            </ul>
                        )}
                    </li>

                    <li className={`menu-item ${isActive("/users")}`} onClick={() => go("/users")}>
                        <FaRegUser />
                        <span>Người dùng</span>
                    </li>

                    <li>
                        <div className="menu-item" onClick={() => setOpenPhoto(!openPhoto)}>
                            <MdOutlinePhotoLibrary />
                            <span className="menu-title">Thư viện ảnh</span>
                            <span className="menu-arrow">{openPhoto ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}</span>
                        </div>

                        {openPhoto && (
                            <ul className="submenu">
                                <li className={`submenu-item ${isActive("/photos")}`} onClick={() => go("/photos")}>
                                    Tất cả ảnh
                                </li>
                                <li className={`submenu-item ${isActive("/photos/favorites")}`} onClick={() => go("/photos/favorites")}>
                                    Yêu thích
                                </li>
                                <li className={`submenu-item ${isActive("/list-album") || (location.pathname.startsWith("/detail-album") ? "active" : "")}`} onClick={() => go("/list-album")}>
                                    Album & gallery khách
                                </li>
                                <li className={`submenu-item ${isActive("/photos/trash")}`} onClick={() => go("/photos/trash")}>
                                    Thùng rác
                                </li>
                            </ul>
                        )}
                    </li>

                </ul>

                {storage && (
                    <div className="sidebar-storage">
                        <p>Bộ nhớ ảnh</p>
                        <div className="sidebar-storage-bar">
                            <div style={{ width: `${percent}%` }} />
                        </div>
                        <small>
                            {formatBytes(storage.usedBytes)} / {formatBytes(storage.quotaBytes)} · {storage.itemCount} ảnh
                        </small>
                    </div>
                )}
            </aside>
        </>
    );
}

export default Sidebar;
