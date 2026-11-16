import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { FaChevronRight, FaMinus, FaPlus, FaShieldAlt, FaShoppingBag } from "react-icons/fa";
import productService from "../../../services/productService";
import { getErrorMessage } from "../../../services/api";
import { formatVND, isPurchasable } from "../../../services/format";
import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";
import { useToast } from "../../../context/ToastContext";
import ProductCard, { ProductImage, StockBadge } from "../ProductCard/ProductCard";
import "./ProductDetail.css";

function ProductDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const { isLogin, isAdmin } = useAuth();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [related, setRelated] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError("");
                const res = await productService.getProductDetail(slug);
                setProduct(res.data.product);
                setRelated(res.data.related);
                setQuantity(1);
            } catch (err) {
                setError(getErrorMessage(err, "Không tìm thấy sản phẩm."));
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [slug]);

    const handleAddToCart = async () => {
        if (!isLogin) {
            navigate("/login", { state: { from: location.pathname } });
            return;
        }
        setAdding(true);
        try {
            await addToCart(product.id, quantity);
            toast.success("Đã thêm vào giỏ hàng", { label: "Xem giỏ", onClick: () => navigate("/cart") });
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setAdding(false);
        }
    };

    if (loading) {
        return (
            <div className="state-box">
                <span className="spinner" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="state-box">
                <h3>{error}</h3>
                <Link to="/products" className="btn">
                    Xem sản phẩm khác
                </Link>
            </div>
        );
    }

    const available = isPurchasable(product);
    const maxQuantity = Math.max(1, Math.min(99, product.stock));

    return (
        <div className="container product-detail">
            <nav className="breadcrumb">
                <Link to="/products">Sản phẩm</Link>
                <FaChevronRight />
                <span>{product.name}</span>
            </nav>

            <div className="product-detail-grid">
                <ProductImage product={product} className="product-detail-image" />

                <div className="product-detail-info">
                    <p className="text-muted">
                        {product.categoryName} · {product.type === "SERVICE" ? "Gói chụp" : "Sản phẩm in"}
                    </p>
                    <h1>{product.name}</h1>

                    <div className="product-detail-price">
                        <span>{formatVND(product.price)}</span>
                        <StockBadge product={product} />
                    </div>

                    {product.summary && <p className="product-detail-summary">{product.summary}</p>}

                    {!isAdmin && (
                        <div className="product-detail-actions">
                            <div className="quantity">
                                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={!available || quantity <= 1} aria-label="Giảm">
                                    <FaMinus />
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    max={maxQuantity}
                                    value={quantity}
                                    disabled={!available}
                                    aria-label="Số lượng"
                                    onChange={(e) => setQuantity(Math.max(1, Math.min(maxQuantity, Number(e.target.value) || 1)))}
                                />
                                <button
                                    onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                                    disabled={!available || quantity >= maxQuantity}
                                    aria-label="Tăng"
                                >
                                    <FaPlus />
                                </button>
                            </div>

                            <button className="btn btn-lg" disabled={!available || adding} onClick={handleAddToCart}>
                                <FaShoppingBag />
                                {!available
                                    ? product.status !== "ACTIVE"
                                        ? "Ngừng bán"
                                        : product.type === "SERVICE"
                                          ? "Hết suất"
                                          : "Hết hàng"
                                    : product.type === "SERVICE"
                                      ? "Đặt lịch chụp"
                                      : "Thêm vào giỏ"}
                            </button>
                        </div>
                    )}

                    {product.type === "SERVICE" && available && <p className="text-muted mt-10">Bạn sẽ chọn ngày chụp mong muốn ở bước đặt hàng.</p>}

                    <ul className="product-detail-policy">
                        <li>
                            <FaShieldAlt /> Giao ảnh gốc độ phân giải đầy đủ qua gallery riêng có mật khẩu.
                        </li>
                        <li>
                            <FaShieldAlt />
                            {product.type === "SERVICE" ? " Dời lịch miễn phí 1 lần nếu báo trước 3 ngày." : " Đổi mới miễn phí trong 7 ngày nếu lỗi in."}
                        </li>
                    </ul>

                    {product.description && (
                        <div className="product-detail-description">
                            <h3>Chi tiết</h3>
                            <p>{product.description}</p>
                        </div>
                    )}
                </div>
            </div>

            {related.length > 0 && (
                <section>
                    <h2 className="product-detail-related">Có thể bạn thích</h2>
                    <div className="product-grid">
                        {related.map((item) => (
                            <ProductCard key={item.id} product={item} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

export default ProductDetail;
