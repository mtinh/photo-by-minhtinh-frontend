import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaImage, FaTimes } from "react-icons/fa";
import productService from "../../../services/productService";
import categoryService from "../../../services/categoryService";
import { getErrorMessage, getFieldErrors } from "../../../services/api";
import { useToast } from "../../../context/ToastContext";
import "./DetailProductEdit.css";

const DetailProductEdit = () => {
    const { id } = useParams();
    const isEdit = !!id;
    const navigate = useNavigate();
    const toast = useToast();

    const [categories, setCategories] = useState([]);
    const [imageUrl, setImageUrl] = useState("");
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState("");

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: "",
            categoryId: "",
            type: "SERVICE",
            price: "",
            stock: 0,
            status: "ACTIVE",
            summary: "",
            description: "",
        },
    });

    useEffect(() => {
        categoryService.getCategories({ all: 1 }).then((res) => setCategories(res.data ?? [])).catch(() => {});
    }, []);

    useEffect(() => {
        if (!isEdit) return;
        productService
            .getProductDetail(id)
            .then((res) => {
                const p = res.data.product;
                reset({
                    name: p.name,
                    categoryId: p.categoryId,
                    type: p.type,
                    price: p.price,
                    stock: p.stock,
                    status: p.status,
                    summary: p.summary,
                    description: p.description,
                });
                setImageUrl(p.imageUrl ?? "");
            })
            .catch((err) => setServerError(getErrorMessage(err, "Không tìm thấy sản phẩm")))
            .finally(() => setLoading(false));
    }, [id, isEdit, reset]);

    const handleImage = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setUploading(true);
        try {
            const res = await productService.uploadImage(file);
            setImageUrl(res.data.url);
        } catch (err) {
            toast.error(getErrorMessage(err, "Tải ảnh thất bại"));
        } finally {
            setUploading(false);
        }
    };

    const onSubmit = async (data) => {
        setSaving(true);
        setServerError("");
        const body = { ...data, price: Number(data.price), stock: Number(data.stock), imageUrl };
        try {
            if (isEdit) await productService.updateProduct(id, body);
            else await productService.createProduct(body);
            toast.success(isEdit ? "Đã cập nhật sản phẩm" : "Đã thêm sản phẩm");
            navigate("/list-product");
        } catch (err) {
            Object.entries(getFieldErrors(err)).forEach(([field, message]) => setError(field, { message }));
            setServerError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="state-box">
                <span className="spinner" />
            </div>
        );
    }

    return (
        <div className="detail-product">
            <div className="page-header">
                <h2>{isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h2>
                <button className="btn btn-outline" onClick={() => navigate("/list-product")}>
                    <FaArrowLeft /> Quay lại
                </button>
            </div>

            {serverError && <p className="alert alert-error">{serverError}</p>}

            <form className="detail-product-form card" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="detail-product-image">
                    <label>Ảnh sản phẩm</label>
                    <div className="detail-product-preview">
                        {imageUrl ? (
                            <>
                                <img src={imageUrl} alt="Thumbnail preview" />
                                <button type="button" className="detail-product-remove" onClick={() => setImageUrl("")} aria-label="Xoá ảnh">
                                    <FaTimes />
                                </button>
                            </>
                        ) : (
                            <label className="detail-product-upload">
                                {uploading ? <span className="spinner" /> : <FaImage />}
                                <span>{uploading ? "Đang tải..." : "Chọn ảnh"}</span>
                                <input type="file" accept="image/*" hidden onChange={handleImage} />
                            </label>
                        )}
                    </div>
                </div>

                <div className="detail-product-fields">
                    <div className="form-group">
                        <label>Tên sản phẩm</label>
                        <input className="form-control" {...register("name", { required: "Vui lòng nhập tên sản phẩm", minLength: { value: 2, message: "Tên quá ngắn" } })} />
                        {errors.name && <p className="error">{errors.name.message}</p>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Danh mục</label>
                            <select className="form-control" {...register("categoryId", { required: "Vui lòng chọn danh mục" })}>
                                <option value="">— Chọn danh mục —</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.status !== "ACTIVE" ? "(tạm ẩn)" : ""}
                                    </option>
                                ))}
                            </select>
                            {errors.categoryId && <p className="error">{errors.categoryId.message}</p>}
                        </div>
                        <div className="form-group">
                            <label>Loại</label>
                            <select className="form-control" {...register("type")}>
                                <option value="SERVICE">Gói chụp (dịch vụ)</option>
                                <option value="PRINT">Sản phẩm in</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Giá (VND)</label>
                            <input
                                type="number"
                                step="1000"
                                className="form-control"
                                {...register("price", { required: "Vui lòng nhập giá", min: { value: 0, message: "Giá không được âm" } })}
                            />
                            {errors.price && <p className="error">{errors.price.message}</p>}
                        </div>
                        <div className="form-group">
                            <label>Tồn kho / số suất</label>
                            <input
                                type="number"
                                className="form-control"
                                {...register("stock", { required: "Vui lòng nhập tồn kho", min: { value: 0, message: "Tồn kho không được âm" } })}
                            />
                            {errors.stock && <p className="error">{errors.stock.message}</p>}
                        </div>
                        <div className="form-group">
                            <label>Trạng thái</label>
                            <select className="form-control" {...register("status")}>
                                <option value="ACTIVE">Đang bán</option>
                                <option value="INACTIVE">Ngừng bán</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Mô tả ngắn</label>
                        <input className="form-control" {...register("summary")} />
                    </div>

                    <div className="form-group">
                        <label>Mô tả chi tiết</label>
                        <textarea className="form-control" rows={6} {...register("description")} />
                    </div>

                    <button type="submit" className="btn" disabled={saving || uploading}>
                        {saving ? "Đang lưu..." : "Lưu sản phẩm"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DetailProductEdit;
