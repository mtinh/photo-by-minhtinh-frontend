import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { FaChevronRight, FaImages } from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { getErrorMessage } from "../../../services/api";
import { formatDate, formatDateTime, formatVND, ORDER_STATUS_LABEL } from "../../../services/format";
import orderService from "../../../services/orderService";
import { OrderStatusBadge } from "../Orders/Orders";
import "./OrderDetail.css";

export function OrderInfo({ order, showEmail = false }) {
    return (
        <div className="order-info">
            <div className="order-info-title">
                <h2>Đơn {order.code}</h2>
                <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-muted">Đặt lúc {formatDateTime(order.createdAt)}</p>
            {order.status === "CANCELLED" && order.cancelReason && <p className="alert alert-error mt-10">Lý do huỷ: {order.cancelReason}</p>}

            <div className="table-wrapper mt-10">
                <table>
                    <thead>
                        <tr>
                            <th>Sản phẩm</th>
                            <th>Đơn giá</th>
                            <th>SL</th>
                            <th>Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    {item.productName} <span className="text-muted">({item.productType === "SERVICE" ? "Gói chụp" : "In ấn"})</span>
                                </td>
                                <td>{formatVND(item.unitPrice)}</td>
                                <td>{item.quantity}</td>
                                <td>{formatVND(item.lineTotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="3">Tạm tính</td>
                            <td>{formatVND(order.subtotal)}</td>
                        </tr>
                        <tr>
                            <td colSpan="3">Phí giao hàng</td>
                            <td>{formatVND(order.shippingFee)}</td>
                        </tr>
                        <tr className="order-total">
                            <td colSpan="3">Tổng cộng</td>
                            <td>{formatVND(order.total)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="order-info-grid">
                <div className="card">
                    <h4>Thông tin nhận hàng</h4>
                    <p>{order.customerName}</p>
                    <p>{order.phone}</p>
                    {showEmail && <p className="text-muted">{order.customerEmail}</p>}
                    {order.address && <p className="text-muted">{order.address}</p>}
                    {order.shootDate && (
                        <p>
                            Ngày chụp: <strong>{formatDate(order.shootDate)}</strong>
                        </p>
                    )}
                    <p className="text-muted">Thanh toán: {order.paymentMethod === "COD" ? "Khi nhận hàng / tại buổi chụp" : "Chuyển khoản"}</p>
                    {order.note && <p className="order-note">“{order.note}”</p>}
                </div>
                <div className="card">
                    <h4>Lịch sử trạng thái</h4>
                    <ol className="order-history">
                        {order.history.map((h, i) => (
                            <li key={i}>
                                <strong>{ORDER_STATUS_LABEL[h.toStatus]}</strong>
                                <small>
                                    {formatDateTime(h.createdAt)}
                                    {h.changedByName && ` · ${h.changedByName}`}
                                </small>
                                {h.note && <span>{h.note}</span>}
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </div>
    );
}

function OrderDetail() {
    const { code } = useParams();
    const toast = useToast();
    const { isLogin } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isLogin) return;
        orderService
            .getMyOrder(code)
            .then((res) => setOrder(res.data))
            .catch((err) => setError(getErrorMessage(err, "Không tìm thấy đơn hàng.")))
            .finally(() => setLoading(false));
    }, [code, isLogin]);

    if (!isLogin) return <Navigate to="/login" state={{ from: `/orders/${code}` }} replace />;

    const handleCancel = async () => {
        if (!window.confirm(`Huỷ đơn ${order.code}? Thao tác này không thể hoàn tác.`)) return;
        try {
            const res = await orderService.cancelMyOrder(order.code);
            setOrder(res.data);
            toast.success("Đã huỷ đơn hàng");
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    if (loading) {
        return (
            <div className="state-box">
                <span className="spinner" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="state-box">
                <h3>{error}</h3>
                <Link to="/orders" className="btn">
                    Về danh sách đơn
                </Link>
            </div>
        );
    }

    return (
        <div className="container order-detail-page">
            <nav className="breadcrumb">
                <Link to="/orders">Đơn hàng</Link>
                <FaChevronRight />
                <span>{order.code}</span>
            </nav>

            <OrderInfo order={order} />

            <div className="order-detail-actions">
                {order.gallery?.slug && (
                    <Link to={`/g/${order.gallery.slug}`} className="btn">
                        <FaImages /> Xem ảnh đã giao
                    </Link>
                )}
                {order.status === "PENDING" && (
                    <button className="btn btn-outline" onClick={handleCancel}>
                        Huỷ đơn
                    </button>
                )}
            </div>
        </div>
    );
}

export default OrderDetail;
