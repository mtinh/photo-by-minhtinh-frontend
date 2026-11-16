import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import orderService from "../../../services/orderService";
import { getErrorMessage } from "../../../services/api";
import { formatDateTime, formatVND, ORDER_STATUS_LABEL } from "../../../services/format";
import Pagination from "../../PhotoStudio/Pagination/Pagination";
import { OrderStatusBadge } from "../../PhotoStudio/Orders/Orders";
import "./ListOrder.css";

const PAGE_SIZE = 10;

function ListOrder() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const [orders, setOrders] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [keyword, setKeyword] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [status, setStatus] = useState(params.get("status") ?? "");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchKeyword(keyword.trim());
            setCurrentPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [keyword]);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                setError("");
                const res = await orderService.getOrders({
                    page: currentPage,
                    limit: PAGE_SIZE,
                    q: searchKeyword || undefined,
                    status: status || undefined,
                    from: from || undefined,
                    to: to || undefined,
                });
                setOrders(res.data ?? []);
                setMeta(res.meta);
            } catch (err) {
                setError(getErrorMessage(err, "Không thể tải đơn hàng."));
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [currentPage, searchKeyword, status, from, to]);

    const changeFilter = (setter) => (e) => {
        setter(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="list-product">
            <div className="page-header">
                <h2>Quản lý đơn hàng</h2>
            </div>

            <div className="filter-product">
                <input type="search" placeholder="Mã đơn, tên, SĐT, email..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                <select value={status} onChange={changeFilter(setStatus)}>
                    <option value="">Tất cả trạng thái</option>
                    {Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
                <input type="date" className="list-order-date" value={from} onChange={changeFilter(setFrom)} aria-label="Từ ngày" />
                <input type="date" className="list-order-date" value={to} onChange={changeFilter(setTo)} aria-label="Đến ngày" />
            </div>

            {error ? (
                <div className="state-box">{error}</div>
            ) : (
                <div className={`table-wrapper ${loading ? "is-loading" : ""}`}>
                    <table>
                        <thead>
                            <tr>
                                <th>Mã đơn</th>
                                <th>Khách hàng</th>
                                <th>Ngày đặt</th>
                                <th>Tổng tiền</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length > 0 ? (
                                orders.map((order) => (
                                    <tr key={order.id} className="clickable" onClick={() => navigate(`/detail-order/${order.id}`)}>
                                        <td>
                                            <strong>{order.code}</strong>
                                        </td>
                                        <td>
                                            {order.customerName}
                                            <br />
                                            <small className="text-muted">{order.phone}</small>
                                        </td>
                                        <td>{formatDateTime(order.createdAt)}</td>
                                        <td>{formatVND(order.total)}</td>
                                        <td>
                                            <OrderStatusBadge status={order.status} />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center">
                                        {loading ? "Đang tải..." : "Không có đơn hàng"}
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

export default ListOrder;
