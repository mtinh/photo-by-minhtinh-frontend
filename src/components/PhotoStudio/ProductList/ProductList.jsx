import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import productService from "../../../services/productService";
import { getErrorMessage } from "../../../services/api";
import ProductCard from "../ProductCard/ProductCard";
import Pagination from "../Pagination/Pagination";
import "./ProductList.css";

const PAGE_SIZE = 12;

function ProductList({ categorySlug, title = "Sản phẩm & dịch vụ" }) {
    const [params, setParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [meta, setMeta] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [keyword, setKeyword] = useState(params.get("q") ?? "");

    const page = Number(params.get("page") ?? 1);
    const q = params.get("q") ?? "";
    const type = params.get("type") ?? "";
    const sort = params.get("sort") ?? "newest";
    const category = categorySlug ?? params.get("category") ?? "";

    const updateParams = (changes) => {
        const next = new URLSearchParams(params);
        Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
        if (!("page" in changes)) next.delete("page");
        setParams(next, { replace: true });
    };

    useEffect(() => {
        productService.getCategories().then((res) => setCategories(res.data ?? [])).catch(() => {});
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (keyword !== q) updateParams({ q: keyword });
        }, 400);
        return () => clearTimeout(timer);
    });

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError("");
                const res = await productService.getProducts({
                    page,
                    limit: PAGE_SIZE,
                    q: q || undefined,
                    type: type || undefined,
                    sort,
                    categorySlug: category || undefined,
                });
                setProducts(res.data ?? []);
                setMeta(res.meta);
            } catch (err) {
                setError(getErrorMessage(err, "Không tải được danh sách sản phẩm."));
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [page, q, type, sort, category]);

    return (
        <div className="container product-list">
            <h1 className="page-title">{title}</h1>

            <div className="filter-product">
                <input type="search" placeholder="Tìm gói chụp, photobook..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />

                {!categorySlug && (
                    <select value={category} onChange={(e) => updateParams({ category: e.target.value })}>
                        <option value="">Tất cả danh mục</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.slug}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                )}

                <select value={type} onChange={(e) => updateParams({ type: e.target.value })}>
                    <option value="">Tất cả loại</option>
                    <option value="SERVICE">Gói chụp</option>
                    <option value="PRINT">Sản phẩm in</option>
                </select>

                <select value={sort} onChange={(e) => updateParams({ sort: e.target.value })}>
                    <option value="newest">Mới nhất</option>
                    <option value="price_asc">Giá tăng dần</option>
                    <option value="price_desc">Giá giảm dần</option>
                    <option value="name">Tên A–Z</option>
                </select>
            </div>

            {loading && products.length === 0 ? (
                <div className="state-box">
                    <span className="spinner" />
                </div>
            ) : error ? (
                <div className="state-box">
                    <h3>{error}</h3>
                </div>
            ) : products.length === 0 ? (
                <div className="state-box">
                    <h3>Không tìm thấy sản phẩm</h3>
                    <p>Thử từ khoá khác hoặc bỏ bớt bộ lọc.</p>
                </div>
            ) : (
                <div className={loading ? "product-list-loading" : ""}>
                    <div className="product-grid">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                    <Pagination
                        meta={meta}
                        onChange={(p) => {
                            updateParams({ page: String(p) });
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                    />
                </div>
            )}
        </div>
    );
}

export default ProductList;
