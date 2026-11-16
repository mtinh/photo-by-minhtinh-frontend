import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoIosNotifications } from "react-icons/io";
import { FaBars, FaRegMoon, FaRegSun, FaSignOutAlt, FaStore, FaUser } from "react-icons/fa";

import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import orderService from "../../../services/orderService";

import "./Header.css";

function Header({ onToggleSidebar }) {
    const [openNotify, setOpenNotify] = useState(false);
    const [openMenu, setOpenMenu] = useState(false);
    const [pendingOrders, setPendingOrders] = useState([]);

    const notifyRef = useRef(null);
    const menuRef = useRef(null);

    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();

    useEffect(() => {
        orderService
            .getOrders({ status: "PENDING", limit: 5 })
            .then((res) => setPendingOrders(res.data ?? []))
            .catch(() => setPendingOrders([]));
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifyRef.current && !notifyRef.current.contains(e.target)) {
                setOpenNotify(false);
            }

            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className={`header ${theme}`}>

            <div className="header-left">
                <button className="icon-btn header-menu-btn" onClick={onToggleSidebar} aria-label="Mở menu">
                    <FaBars />
                </button>
                <Link to="/dashboard" className="header-brand">
                    <h2>Photos Admin</h2>
                </Link>
            </div>

            <div className="header-right">

                <button
                    className="theme-btn"
                    onClick={toggleTheme}
                    title={theme === "light" ? "Chuyển sang Dark Mode" : "Chuyển sang Light Mode"}
                >
                    {theme === "light" ? <FaRegMoon /> : <FaRegSun />}
                </button>

                <div className="notification-menu" ref={notifyRef}>
                    <button
                        className="icon-btn header-icon"
                        onClick={() => {
                            setOpenNotify(!openNotify);
                            setOpenMenu(false);
                        }}
                        aria-label="Thông báo"
                    >
                        <IoIosNotifications className="notification-icon" />
                        {pendingOrders.length > 0 && <span className="notification-dot" />}
                    </button>

                    {openNotify && (
                        <div className="notification-dropdown">
                            <div className="notification-title">Đơn hàng chờ xác nhận</div>

                            {pendingOrders.length === 0 && <div className="notification-item">Không có đơn mới</div>}

                            {pendingOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="notification-item"
                                    onClick={() => {
                                        setOpenNotify(false);
                                        navigate(`/detail-order/${order.id}`);
                                    }}
                                >
                                    <div className="notify-text">
                                        {order.code} · {order.customerName}
                                    </div>
                                    <small>{new Date(order.createdAt).toLocaleString("vi-VN")}</small>
                                </div>
                            ))}

                            <button
                                className="show-more-btn"
                                onClick={() => {
                                    setOpenNotify(false);
                                    navigate("/list-order?status=PENDING");
                                }}
                            >
                                Xem tất cả
                            </button>
                        </div>
                    )}
                </div>

                <div className="user-menu" ref={menuRef}>
                    <div
                        className="user-info"
                        onClick={() => {
                            setOpenMenu(!openMenu);
                            setOpenNotify(false);
                        }}
                    >
                        <img src="/asset/img/avatar/avatar-circle.png" alt={user?.name} className="avatar" />
                        <span className="username">{user?.name}</span>
                    </div>

                    {openMenu && (
                        <div className="dropdown-menu">
                            <div className="dropdown-item" onClick={() => navigate("/profile")}>
                                <FaUser />
                                <span>Tài khoản</span>
                            </div>

                            <div className="dropdown-item" onClick={() => navigate("/")}>
                                <FaStore />
                                <span>Xem trang khách</span>
                            </div>

                            <div className="dropdown-item logout" onClick={handleLogout}>
                                <FaSignOutAlt />
                                <span>Đăng xuất</span>
                            </div>
                        </div>
                    )}
                </div>

            </div>

        </header>
    );
}

export default Header;
