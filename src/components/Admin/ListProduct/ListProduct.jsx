import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import productService from "../../../services/productService";
import categoryService from "../../../services/categoryService";
import { getErrorMessage } from "../../../services/api";
import { formatVND } from "../../../services/format";
import { useToast } from "../../../context/ToastContext";
import Pagination from "../../PhotoStudio/Pagination/Pagination";
import { ProductImage, StockBadge } from "../../PhotoStudio/ProductCard/ProductCard";
import "./ListProduct.css";

const PAGE_SIZE = 10;

function ListProduct() {
    const navigate = useNavigate();
    const toast = useToast();

    const [products, setProducts] = useState([]);
    const [meta, setMeta] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reload, setReload] = useState(0);

    const [keyword, setKeyword] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [type, setType] = useState("");
    const [status, setStatus] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        categoryService.getCategories({ all: 1 }).then((res) => setCategories(res.data ?? [])).catch(() => {});
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchKeyword(keyword.trim());
            setCurrentPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [keyword]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError("");
                const res = await productService.getAdminProducts({
                    page: currentPage,
                    limit: PAGE_SIZE,
                    q: searchKeyword || undefined,
                    categoryId: categoryId || undefined,
                    type: type || undefined,
                    status: status || undefined,
                });
                setProducts(res.data ?? []);
                setMeta(res.meta);
            } catch (err) {
                setError(getErrorMessage(err, "Không thể tải danh sách sản phẩm."));
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [currentPage, searchKeyword, categoryId, type, status, reload]);

    const handleDelete = async (product) => {
        if (!window.confirm(`Xoá sản phẩm "${product.name}"?\nSản phẩm đã có đơn hàng sẽ không thể xoá.`)) return;
        try {
            await productService.deleteProduct(product.id);
            toast.success("Đã xoá sản phẩm");
            setReload((r) => r + 1);
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const changeFilter = (setter) => (e) => {
        setter(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="list-product">
            <div className="page-header">
                <h2>Quản lý sản phẩm</h2>
                <button className="btn" onClick={() => navigate("/insert-product")}>
                    <FaPlus /> Thêm sản phẩm
                </button>
            </div>

            <div className="filter-product">
                <input type="search" placeholder="Tìm theo tên sản phẩm, danh mục..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />

                <select value={categoryId} onChange={changeFilter(setCategoryId)}>
                    <option value="">Tất cả danh mục</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>

                <select value={type} onChange={changeFilter(setType)}>
                    <option value="">Tất cả loại</option>
                    <option value="SERVICE">Gói chụp</option>
                    <option value="PRINT">Sản phẩm in</option>
                </select>

                <select value={status} onChange={changeFilter(setStatus)}>
                    <option value="">Tất cả trạng thái</option>
                    <option value="ACTIVE">Đang bán</option>
                    <option value="INACTIVE">Ngừng bán</option>
                </select>
            </div>

            {error ? (
                <div className="state-box">{error}</div>
            ) : (
                <div className={`table-wrapper ${loading ? "is-loading" : ""}`}>
                    <table>
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Loại</th>
                                <th>Giá</th>
                                <th>Tồn kho</th>
                                <th>Trạng thái</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length > 0 ? (
                                products.map((product) => (
                                    <tr key={product.id}>
                                        <td>
                                            <div className="list-product-name">
                                                <ProductImage product={product} className="list-product-thumb" />
                                                <div>
                                                    <strong>{product.name}</strong>
                                                    <small>{product.categoryName}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{product.type === "SERVICE" ? "Gói chụp" : "In ấn"}</td>
                                        <td>{formatVND(product.price)}</td>
                                        <td>{product.stock}</td>
                                        <td>
                                            <StockBadge product={product} />
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="icon-btn" title="Sửa" onClick={() => navigate(`/detail-product/${product.id}/edit`)}>
                                                    <FaEdit />
                                                </button>
                                                <button className="icon-btn" title="Xoá" onClick={() => handleDelete(product)}>
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center">
                                        {loading ? "Đang tải..." : "Không tìm thấy sản phẩm nào"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <Pagination meta={meta} onChange={setCurrentPage} />
        </div>
    );
}

export default ListProduct;
