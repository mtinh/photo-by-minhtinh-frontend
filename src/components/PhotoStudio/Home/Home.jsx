import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaCamera, FaDownload, FaLock } from "react-icons/fa";
import productService from "../../../services/productService";
import ProductCard from "../ProductCard/ProductCard";
import "./Home.css";

function Home() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [categoryRes, productRes] = await Promise.all([
                    productService.getCategories(),
                    productService.getProducts({ limit: 8, sort: "newest" }),
                ]);
                setCategories(categoryRes.data ?? []);
                setProducts(productRes.data ?? []);
            } catch (err) {
                console.error("Lỗi tải trang chủ:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="home">
            <section className="home-hero">
                <div className="container">
                    <p className="home-eyebrow">PHOTOS BY MINHTINH</p>
                    <h1>Lưu giữ khoảnh khắc — trọn vẹn từng điểm ảnh.</h1>
                    <p className="home-subtitle">
                        Đặt lịch chụp cưới, kỷ yếu, gia đình và in ảnh cao cấp. Ảnh gốc độ phân giải đầy đủ được giao qua gallery riêng có mật khẩu.
                    </p>
                    <div className="home-actions">
                        <Link to="/products?type=SERVICE" className="btn btn-lg">
                            Xem gói chụp
                        </Link>
                        <Link to="/products?type=PRINT" className="btn btn-lg btn-hero-outline">
                            In ảnh & photobook
                        </Link>
                    </div>
                </div>
            </section>

            <section className="container home-features">
                <div className="home-feature">
                    <FaCamera />
                    <h3>Ekip chuyên nghiệp</h3>
                    <p>Photographer nhiều năm kinh nghiệm, hỗ trợ tạo dáng.</p>
                </div>
                <div className="home-feature">
                    <FaLock />
                    <h3>Gallery riêng tư</h3>
                    <p>Mỗi khách một gallery, mật khẩu xem và mã PIN tải ảnh.</p>
                </div>
                <div className="home-feature">
                    <FaDownload />
                    <h3>Ảnh gốc 100%</h3>
                    <p>Không nén, không giảm độ phân giải — tải ZIP một lần.</p>
                </div>
            </section>

            <section className="container">
                <h2 className="home-section-title">Danh mục</h2>
                <div className="home-categories">
                    {categories.map((category) => (
                        <Link key={category.id} to={`/category/${category.slug}`} className="home-category">
                            {category.name} <span>({category.productCount})</span>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="container">
                <div className="home-section-header">
                    <h2 className="home-section-title">Mới nhất</h2>
                    <Link to="/products">
                        Xem tất cả <FaArrowRight />
                    </Link>
                </div>
                {loading ? (
                    <div className="state-box">
                        <span className="spinner" />
                    </div>
                ) : (
                    <div className="product-grid">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default Home;
