import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import categoryService from "../../../services/categoryService";
import { getErrorMessage, getFieldErrors } from "../../../services/api";
import { useToast } from "../../../context/ToastContext";
import Modal from "../../PhotoStudio/Modal/Modal";
import Pagination from "../../PhotoStudio/Pagination/Pagination";
import "./ListCategory.css";

const PAGE_SIZE = 10;

function CategoryForm({ category, onClose, onSaved }) {
    const toast = useToast();
    const [serverError, setServerError] = useState("");
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: {
            name: category?.name ?? "",
            description: category?.description ?? "",
            sortOrder: category?.sortOrder ?? 0,
            status: category?.status ?? "ACTIVE",
        },
    });

    const onSubmit = async (data) => {
        setServerError("");
        try {
            const body = { ...data, sortOrder: Number(data.sortOrder) };
            if (category) await categoryService.updateCategory(category.id, body);
            else await categoryService.createCategory(body);
            toast.success(category ? "Đã cập nhật danh mục" : "Đã thêm danh mục");
            onSaved();
        } catch (err) {
            Object.entries(getFieldErrors(err)).forEach(([field, message]) => setError(field, { message }));
            setServerError(getErrorMessage(err));
        }
    };

    return (
        <Modal open title={category ? "Sửa danh mục" : "Thêm danh mục"} onClose={onClose}>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                {serverError && <p className="alert alert-error">{serverError}</p>}
                <div className="form-group">
                    <label>Tên danh mục</label>
                    <input className="form-control" autoFocus {...register("name", { required: "Vui lòng nhập tên danh mục", minLength: { value: 2, message: "Tên quá ngắn" } })} />
                    {errors.name && <p className="error">{errors.name.message}</p>}
                </div>
                <div className="form-group">
                    <label>Mô tả</label>
                    <textarea className="form-control" {...register("description")} />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Thứ tự hiển thị</label>
                        <input type="number" min="0" className="form-control" {...register("sortOrder")} />
                    </div>
                    <div className="form-group">
                        <label>Trạng thái</label>
                        <select className="form-control" {...register("status")}>
                            <option value="ACTIVE">Hoạt động</option>
                            <option value="INACTIVE">Tạm ẩn</option>
                        </select>
                    </div>
                </div>
                <div className="list-category-form-actions">
                    <button type="button" className="btn btn-ghost" onClick={onClose}>
                        Huỷ
                    </button>
                    <button type="submit" className="btn" disabled={isSubmitting}>
                        {isSubmitting ? "Đang lưu..." : "Lưu"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function ListCategory() {
    const toast = useToast();
    const [categories, setCategories] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reload, setReload] = useState(0);
    const [keyword, setKeyword] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [status, setStatus] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [editing, setEditing] = useState(undefined);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchKeyword(keyword.trim());
            setCurrentPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [keyword]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                setError("");
                const res = await categoryService.getCategories({
                    page: currentPage,
                    limit: PAGE_SIZE,
                    q: searchKeyword || undefined,
                    status: status || undefined,
                });
                setCategories(res.data ?? []);
                setMeta(res.meta);
            } catch (err) {
                setError(getErrorMessage(err, "Không thể tải danh mục."));
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, [currentPage, searchKeyword, status, reload]);

    const handleDelete = async (category) => {
        if (category.productCount > 0) {
            toast.error(`Không thể xoá: danh mục đang có ${category.productCount} sản phẩm`);
            return;
        }
        if (!window.confirm(`Xoá danh mục "${category.name}"?`)) return;
        try {
            await categoryService.deleteCategory(category.id);
            toast.success("Đã xoá danh mục");
            setReload((r) => r + 1);
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    return (
        <div className="list-product">
            <div className="page-header">
                <h2>Quản lý danh mục</h2>
                <button className="btn" onClick={() => setEditing(null)}>
                    <FaPlus /> Thêm danh mục
                </button>
            </div>

            <div className="filter-product">
                <input type="search" placeholder="Tìm theo tên hoặc mô tả..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                <select
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value);
                        setCurrentPage(1);
                    }}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Tạm ẩn</option>
                </select>
            </div>

            {error ? (
                <div className="state-box">{error}</div>
            ) : (
                <div className={`table-wrapper ${loading ? "is-loading" : ""}`}>
                    <table>
                        <thead>
                            <tr>
                                <th>Tên danh mục</th>
                                <th>Mô tả</th>
                                <th>Sản phẩm</th>
                                <th>Thứ tự</th>
                                <th>Trạng thái</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.length > 0 ? (
                                categories.map((category) => (
                                    <tr key={category.id}>
                                        <td>
                                            <strong>{category.name}</strong>
                                        </td>
                                        <td className="list-category-desc">{category.description || "—"}</td>
                                        <td>{category.productCount}</td>
                                        <td>{category.sortOrder}</td>
                                        <td>
                                            <span className={`badge ${category.status === "ACTIVE" ? "badge-success" : ""}`}>
                                                {category.status === "ACTIVE" ? "Hoạt động" : "Tạm ẩn"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="icon-btn" title="Sửa" onClick={() => setEditing(category)}>
                                                    <FaEdit />
                                                </button>
                                                <button className="icon-btn" title="Xoá" onClick={() => handleDelete(category)}>
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center">
                                        {loading ? "Đang tải..." : "Không tìm thấy danh mục nào"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <Pagination meta={meta} onChange={setCurrentPage} />

            {editing !== undefined && (
                <CategoryForm
                    category={editing}
                    onClose={() => setEditing(undefined)}
                    onSaved={() => {
                        setEditing(undefined);
                        setReload((r) => r + 1);
                    }}
                />
            )}
        </div>
    );
}

export default ListCategory;
