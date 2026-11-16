import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getErrorMessage } from "../../../services/api";
import { formatDate, formatVND, ORDER_STATUS_LABEL } from "../../../services/format";
import orderService from "../../../services/orderService";
import Pagination from "../Pagination/Pagination";
import "./Orders.css";

const STATUS_CLASS = {
    PENDING: "badge-warning",
    CONFIRMED: "badge-primary",
    PROCESSING: "badge-primary",
    DELIVERING: "badge-primary",
    COMPLETED: "badge-success",
    CANCELLED: "",
};

export function OrderStatusBadge({ status }) {
    return <span className={`badge ${STATUS_CLASS[status]}`}>{ORDER_STATUS_LABEL[status]}</span>;
}

function Orders() {
    const navigate = useNavigate();
    const { isLogin } = useAuth();
    const [orders, setOrders] = useState([]);
    const [meta, setMeta] = useState(null);
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isLogin) return;
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const res = await orderService.getMyOrders({ page, limit: 10, status: status || undefined });
                setOrders(res.data ?? []);
                setMeta(res.meta);
            } catch (err) {
                setError(getErrorMessage(err, "Không tải được đơn hàng."));
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [isLogin, page, status]);

    if (!isLogin) return <Navigate to="/login" state={{ from: "/orders" }} replace />;

    return (
        <div className="container orders-page">
            <div className="page-header">
                <h2>Đơn hàng của tôi</h2>
                <div className="filter-product">
                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">Tất cả trạng thái</option>
                        {Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading && orders.length === 0 ? (
                <div className="state-box">
                    <span className="spinner" />
                </div>
            ) : error ? (
                <div className="state-box">
                    <h3>{error}</h3>
                </div>
            ) : orders.length === 0 ? (
                <div className="state-box">
                    <h3>Chưa có đơn hàng</h3>
                    <Link to="/products" className="btn">
                        Mua sắm ngay
                    </Link>
                </div>
            ) : (
                <>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Ngày đặt</th>
                                    <th>Số lượng</th>
                                    <th>Tổng tiền</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id} className="clickable" onClick={() => navigate(`/orders/${order.code}`)}>
                                        <td>
                                            <strong>{order.code}</strong>
                                        </td>
                                        <td>{formatDate(order.createdAt)}</td>
                                        <td>{order.itemCount} sản phẩm</td>
                                        <td>{formatVND(order.total)}</td>
                                        <td>
                                            <OrderStatusBadge status={order.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination meta={meta} onChange={setPage} />
                </>
            )}
        </div>
    );
}

export default Orders;
