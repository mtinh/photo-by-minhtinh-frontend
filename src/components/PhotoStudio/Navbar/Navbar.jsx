import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { IoIosCart } from "react-icons/io";
import { FaChevronDown, FaImages, FaBoxOpen, FaSignOutAlt, FaUser, FaTachometerAlt, FaRegMoon, FaRegSun } from "react-icons/fa";

import productService from "../../../services/productService";
import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";
import { useTheme } from "../../../context/ThemeContext";

import "./Navbar.css";

function Navbar() {

    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [categories, setCategories] = useState([]);

    const categoryRef = useRef(null);
    const userRef = useRef(null);
    const navigate = useNavigate();

    const { user, isLogin, isAdmin, logout } = useAuth();
    const { cart, canUseCart } = useCart();
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        productService
            .getCategories()
            .then((res) => setCategories(res.data ?? []))
            .catch((err) => console.error("Lỗi tải danh mục:", err));
    }, []);

    useEffect(() => {

        const handleClickOutside = (event) => {
            if (categoryRef.current && !categoryRef.current.contains(event.target)) {
                setIsCategoryOpen(false);
            }
            if (userRef.current && !userRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };

    }, []);

    const handleCategoryClick = (slug) => {
        navigate(`/category/${slug}`);

        setIsCategoryOpen(false);
        setIsMobileMenuOpen(false);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
        setIsCategoryOpen(false);
    };

    const goTo = (path) => {
        setIsUserMenuOpen(false);
        navigate(path);
    };

    const handleLogout = async () => {
        setIsUserMenuOpen(false);
        await logout();
        navigate("/");
    };

    return (
        <header className="navbar">

            <div className="navbar-container">

                <div className="navbar-left">

                    <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
                        <span className="logo-icon">P</span>
                        <span className="logo-text">Photos by MinhTinh</span>
                    </Link>

                    <nav className={`navbar-menu ${isMobileMenuOpen ? "active" : ""}`}>

                        <NavLink to="/products" className="navbar-link" onClick={closeMobileMenu}>
                            Sản phẩm
                        </NavLink>

                        <div className="navbar-dropdown" ref={categoryRef}>

                            <button
                                className={`navbar-link category-button ${isCategoryOpen ? "active" : ""}`}
                                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                aria-expanded={isCategoryOpen}
                            >
                                Danh mục
                                <span className="dropdown-arrow">
                                    <FaChevronDown />
                                </span>
                            </button>

                            {isCategoryOpen && (
                                <div className="dropdown-menu">
                                    {categories.map((category) => (
                                        <button key={category.id} onClick={() => handleCategoryClick(category.slug)}>
                                            {category.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                        </div>

                        <NavLink to="/about" className="navbar-link" onClick={closeMobileMenu}>
                            Giới thiệu
                        </NavLink>

                    </nav>

                </div>

                <div className="navbar-right">

                    <button
                        className="navbar-icon-button"
                        onClick={toggleTheme}
                        aria-label={theme === "light" ? "Chuyển sang Dark Mode" : "Chuyển sang Light Mode"}
                    >
                        {theme === "light" ? <FaRegMoon /> : <FaRegSun />}
                    </button>

                    {!isAdmin && (
                        <Link to="/cart" className="navbar-icon-button" aria-label={`Giỏ hàng, ${cart.itemCount} sản phẩm`}>
                            <IoIosCart className="navbar-cart-icon" />
                            {canUseCart && cart.itemCount > 0 && <span className="cart-badge">{cart.itemCount}</span>}
                        </Link>
                    )}

                    {isLogin ? (
                        <div className="navbar-user" ref={userRef}>
                            <button className="navbar-avatar" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} aria-label="Tài khoản">
                                {user.name?.charAt(0).toUpperCase()}
                            </button>

                            {isUserMenuOpen && (
                                <div className="dropdown-menu user-dropdown">
                                    <div className="user-dropdown-name">
                                        <strong>{user.name}</strong>
                                        <small>{user.email}</small>
                                    </div>
                                    {isAdmin ? (
                                        <button onClick={() => goTo("/dashboard")}>
                                            <FaTachometerAlt /> Trang quản trị
                                        </button>
                                    ) : (
                                        <>
                                            <button onClick={() => goTo("/orders")}>
                                                <FaBoxOpen /> Đơn hàng của tôi
                                            </button>
                                            <button onClick={() => goTo("/my-photos")}>
                                                <FaImages /> Ảnh của tôi
                                            </button>
                                        </>
                                    )}
                                    <button onClick={() => goTo("/profile")}>
                                        <FaUser /> Tài khoản
                                    </button>
                                    <button className="logout" onClick={handleLogout}>
                                        <FaSignOutAlt /> Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className="navbar-login">
                            Đăng nhập
                        </Link>
                    )}

                    <button
                        className="mobile-menu-button"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Mở menu"
                        aria-expanded={isMobileMenuOpen}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>

                </div>

            </div>

        </header>
    );
}

export default Navbar;
