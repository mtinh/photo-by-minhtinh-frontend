import { Link } from "react-router-dom";
import { FaCamera, FaPrint } from "react-icons/fa";
import { formatVND, stockLabel } from "../../../services/format";
import "./ProductCard.css";

export function ProductImage({ product, className = "" }) {
    if (!product.imageUrl) {
        return (
            <div className={`product-image-placeholder ${className}`}>
                {product.type === "SERVICE" ? <FaCamera /> : <FaPrint />}
            </div>
        );
    }
    return <img src={product.imageUrl} alt={product.name} loading="lazy" className={`product-image ${className}`} />;
}

export function StockBadge({ product }) {
    const label = stockLabel(product);
    const tone = { success: "badge-success", warning: "badge-warning", danger: "badge-danger", muted: "" }[label.tone];
    return <span className={`badge ${tone}`}>{label.text}</span>;
}

function ProductCard({ product }) {
    return (
        <article className="product-card">
            <Link to={`/products/${product.slug}`} className="product-card-link">
                <ProductImage product={product} className="product-card-image" />
                <div className="product-card-body">
                    <p className="product-card-category">{product.categoryName}</p>
                    <h3>{product.name}</h3>
                    <p className="product-card-summary">{product.summary}</p>
                    <div className="product-card-footer">
                        <span className="product-card-price">{formatVND(product.price)}</span>
                        <StockBadge product={product} />
                    </div>
                </div>
            </Link>
        </article>
    );
}

export default ProductCard;
