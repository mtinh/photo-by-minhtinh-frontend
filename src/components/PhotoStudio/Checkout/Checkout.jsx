import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";
import { useToast } from "../../../context/ToastContext";
import { getErrorMessage } from "../../../services/api";
import { formatVND } from "../../../services/format";
import orderService from "../../../services/orderService";
import { CartSummary } from "../Cart/Cart";
import "./Checkout.css";

function Checkout() {
    const navigate = useNavigate();
    const toast = useToast();
    const { user, isLogin } = useAuth();
    const { cart, reloadCart } = useCart();
    const [serverError, setServerError] = useState("");
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            customerName: user?.name ?? "",
            phone: user?.phone ?? "",
            address: user?.address ?? "",
            shootDate: "",
            note: "",
            paymentMethod: "COD",
        },
    });

    if (!isLogin) return <Navigate to="/login" state={{ from: "/checkout" }} replace />;

    if (cart.lines.length === 0) {
        return (
            <div className="state-box">
                <h3>Giỏ hàng trống</h3>
                <Link to="/products" className="btn">
                    Xem sản phẩm
                </Link>
            </div>
        );
    }

    const hasService = cart.lines.some((line) => line.product.type === "SERVICE");
    const hasPrint = cart.lines.some((line) => line.product.type === "PRINT");
    const today = new Date().toISOString().slice(0, 10);

    const onSubmit = async (data) => {
        setLoading(true);
        setServerError("");
        try {
            const res = await orderService.placeOrder({ ...data, shootDate: hasService ? data.shootDate : null });
            await reloadCart();
            toast.success(`Đặt hàng thành công! Mã đơn ${res.data.code}`);
            navigate(`/orders/${res.data.code}`, { replace: true });
        } catch (err) {
            setServerError(getErrorMessage(err, "Đặt hàng thất bại."));
            if (err.response?.status === 409) reloadCart();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container checkout-page">
            <h1 className="page-title">Đặt hàng</h1>

            <form className="checkout-layout" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="checkout-form">
                    {serverError && <p className="alert alert-error">{serverError}</p>}

                    <div className="card">
                        <h3>Thông tin liên hệ</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Họ tên</label>
                                <input className="form-control" {...register("customerName", { required: "Vui lòng nhập họ tên.", minLength: { value: 2, message: "Họ tên quá ngắn." } })} />
                                {errors.customerName && <p className="error">{errors.customerName.message}</p>}
                            </div>
                            <div className="form-group">
                                <label>Số điện thoại</label>
                                <input
                                    className="form-control"
                                    {...register("phone", {
                                        required: "Vui lòng nhập số điện thoại.",
                                        pattern: { value: /^(0|\+84)\d{9,10}$/, message: "Số điện thoại không hợp lệ." },
                                    })}
                                />
                                {errors.phone && <p className="error">{errors.phone.message}</p>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{hasPrint ? "Địa chỉ nhận hàng" : "Địa chỉ (tuỳ chọn)"}</label>
                            <input className="form-control" {...register("address", { required: hasPrint ? "Vui lòng nhập địa chỉ nhận hàng." : false })} />
                            {errors.address && <p className="error">{errors.address.message}</p>}
                        </div>

                        {hasService && (
                            <div className="form-group">
                                <label>Ngày chụp mong muốn</label>
                                <input
                                    type="date"
                                    min={today}
                                    className="form-control"
                                    {...register("shootDate", {
                                        required: "Vui lòng chọn ngày chụp.",
                                        validate: (v) => v >= today || "Ngày chụp phải từ hôm nay trở đi.",
                                    })}
                                />
                                {errors.shootDate && <p className="error">{errors.shootDate.message}</p>}
                                <p className="text-muted mt-10">Studio sẽ gọi xác nhận lịch trong 24 giờ.</p>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Ghi chú (tuỳ chọn)</label>
                            <textarea className="form-control" placeholder="Ý tưởng concept, số người, địa điểm..." {...register("note")} />
                        </div>
                    </div>

                    <div className="card">
                        <h3>Thanh toán</h3>
                        <label className="payment-option">
                            <input type="radio" value="COD" {...register("paymentMethod")} />
                            Thanh toán khi nhận hàng / tại buổi chụp
                        </label>
                        <label className="payment-option">
                            <input type="radio" value="BANK_TRANSFER" {...register("paymentMethod")} />
                            Chuyển khoản ngân hàng (studio gửi thông tin sau khi xác nhận)
                        </label>
                    </div>
                </div>

                <CartSummary cart={cart}>
                    <ul className="checkout-items">
                        {cart.lines.map((line) => (
                            <li key={line.product.id}>
                                <span>
                                    {line.product.name} × {line.quantity}
                                </span>
                                <span>{formatVND(line.lineTotal)}</span>
                            </li>
                        ))}
                    </ul>
                    <button type="submit" className="btn btn-lg btn-block mt-10" disabled={loading || cart.lines.some((l) => !l.available)}>
                        {loading ? "Đang đặt hàng..." : "Xác nhận đặt hàng"}
                    </button>
                </CartSummary>
            </form>
        </div>
    );
}

export default Checkout;
