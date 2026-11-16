import { Link, Navigate, useNavigate } from "react-router-dom";
import { FaExclamationTriangle, FaMinus, FaPlus, FaTrash } from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";
import { useToast } from "../../../context/ToastContext";
import { getErrorMessage } from "../../../services/api";
import { formatVND } from "../../../services/format";
import { ProductImage } from "../ProductCard/ProductCard";
import "./Cart.css";

export function CartSummary({ cart, children }) {
    return (
        <aside className="cart-summary">
            <h3>Tóm tắt</h3>
            <div className="cart-summary-row">
                <span>Tạm tính</span>
                <span>{formatVND(cart.subtotal)}</span>
            </div>
            <div className="cart-summary-row">
                <span>Phí giao hàng</span>
                <span>{cart.shippingFee ? formatVND(cart.shippingFee) : "Miễn phí"}</span>
            </div>
            <div className="cart-summary-row cart-summary-total">
                <span>Tổng cộng</span>
                <span>{formatVND(cart.total)}</span>
            </div>
            {children}
        </aside>
    );
}

function Cart() {
    const navigate = useNavigate();
    const toast = useToast();
    const { isLogin } = useAuth();
    const { cart, updateQuantity, removeFromCart } = useCart();

    if (!isLogin) return <Navigate to="/login" state={{ from: "/cart" }} replace />;

    const handleQuantity = async (productId, quantity) => {
        try {
            await updateQuantity(productId, quantity);
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const handleRemove = async (productId) => {
        try {
            await removeFromCart(productId);
            toast.success("Đã xoá khỏi giỏ hàng");
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    if (cart.lines.length === 0) {
        return (
            <div className="state-box">
                <h3>Giỏ hàng trống</h3>
                <p>Khám phá các gói chụp và sản phẩm in của studio.</p>
                <Link to="/products" className="btn">
                    Xem sản phẩm
                </Link>
            </div>
        );
    }

    const blocked = cart.lines.some((line) => !line.available);

    return (
        <div className="container cart-page">
            <h1 className="page-title">Giỏ hàng ({cart.itemCount})</h1>

            <div className="cart-layout">
                <ul className="cart-lines">
                    {cart.lines.map((line) => {
                        const max = Math.max(1, Math.min(99, line.product.stock));
                        return (
                            <li key={line.product.id} className={`cart-line ${line.available ? "" : "unavailable"}`}>
                                <ProductImage product={line.product} className="cart-line-image" />
                                <div className="cart-line-info">
                                    <Link to={`/products/${line.product.slug}`}>{line.product.name}</Link>
                                    <p className="text-muted">{formatVND(line.product.price)}</p>
                                    {!line.available && (
                                        <p className="error">
                                            <FaExclamationTriangle />{" "}
                                            {line.product.status === "ACTIVE" && line.product.stock > 0
                                                ? `Chỉ còn ${line.product.stock} — hãy giảm số lượng`
                                                : "Sản phẩm đã hết hàng hoặc ngừng bán — hãy xoá khỏi giỏ"}
                                        </p>
                                    )}
                                    <div className="cart-line-actions">
                                        <div className="quantity">
                                            <button
                                                onClick={() => handleQuantity(line.product.id, line.quantity - 1)}
                                                disabled={line.quantity <= 1}
                                                aria-label="Giảm"
                                            >
                                                <FaMinus />
                                            </button>
                                            <input type="number" value={line.quantity} readOnly aria-label="Số lượng" />
                                            <button
                                                onClick={() => handleQuantity(line.product.id, line.quantity + 1)}
                                                disabled={line.quantity >= max}
                                                aria-label="Tăng"
                                            >
                                                <FaPlus />
                                            </button>
                                        </div>
                                        <button className="icon-btn" onClick={() => handleRemove(line.product.id)} aria-label={`Xoá ${line.product.name}`}>
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                                <strong className="cart-line-total">{formatVND(line.lineTotal)}</strong>
                            </li>
                        );
                    })}
                </ul>

                <CartSummary cart={cart}>
                    {blocked && <p className="error">Có sản phẩm không thể đặt, vui lòng điều chỉnh.</p>}
                    <button className="btn btn-lg btn-block mt-10" disabled={blocked} onClick={() => navigate("/checkout")}>
                        Tiến hành đặt hàng
                    </button>
                </CartSummary>
            </div>
        </div>
    );
}

export default Cart;
