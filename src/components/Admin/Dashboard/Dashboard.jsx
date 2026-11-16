import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBoxOpen, FaClipboardList, FaMoneyBillWave, FaUsers } from "react-icons/fa";
import orderService from "../../../services/orderService";
import { getErrorMessage } from "../../../services/api";
import { formatVND, ORDER_STATUS_LABEL } from "../../../services/format";
import RevenueChart from "../RevenueChart/RevenueChart";
import "./Dashboard.css";

function Dashboard() {
    const [range, setRange] = useState("12m");
    const [stats, setStats] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        orderService
            .getStats(range)
            .then((res) => setStats(res.data))
            .catch((err) => setError(getErrorMessage(err)));
    }, [range]);

    if (error) return <div className="state-box">{error}</div>;

    if (!stats) {
        return (
            <div className="state-box">
                <span className="spinner" />
            </div>
        );
    }

    const delta = stats.revenueLastMonth > 0 ? ((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth) * 100 : null;
    const maxStatus = Math.max(1, ...Object.values(stats.ordersByStatus));

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>

            <div className="dashboard-hero card">
                <p>Doanh thu tháng này</p>
                <strong>{formatVND(stats.revenueThisMonth)}</strong>
                <small>
                    {delta === null
                        ? "Chưa có dữ liệu tháng trước"
                        : `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta).toFixed(0)}% so với tháng trước (${formatVND(stats.revenueLastMonth)})`}
                </small>
            </div>

            <div className="dashboard-cards">
                <div className="dashboard-card">
                    <div className="dashboard-icon">
                        <FaMoneyBillWave />
                    </div>
                    <div className="dashboard-content">
                        <h3>Tổng doanh thu</h3>
                        <p>{formatVND(stats.revenueTotal)}</p>
                        <small>{stats.completedOrders} đơn hoàn thành</small>
                    </div>
                </div>

                <div className="dashboard-card">
                    <div className="dashboard-icon">
                        <FaClipboardList />
                    </div>
                    <div className="dashboard-content">
                        <h3>Đơn chờ xác nhận</h3>
                        <p>{stats.pendingOrders}</p>
                        <small>
                            <Link to="/list-order?status=PENDING">Xử lý ngay →</Link>
                        </small>
                    </div>
                </div>

                <div className="dashboard-card">
                    <div className="dashboard-icon">
                        <FaUsers />
                    </div>
                    <div className="dashboard-content">
                        <h3>Khách hàng</h3>
                        <p>{stats.customerCount}</p>
                        <small>+{stats.newCustomers30d} trong 30 ngày</small>
                    </div>
                </div>

                <div className="dashboard-card">
                    <div className="dashboard-icon">
                        <FaBoxOpen />
                    </div>
                    <div className="dashboard-content">
                        <h3>Sản phẩm</h3>
                        <p>{stats.productCount}</p>
                        <small>{stats.outOfStockCount} sản phẩm hết hàng</small>
                    </div>
                </div>
            </div>

            <div className="dashboard-range">
                <select className="form-control" value={range} onChange={(e) => setRange(e.target.value)}>
                    <option value="12m">12 tháng gần nhất</option>
                    <option value="30d">30 ngày gần nhất</option>
                </select>
            </div>

            <RevenueChart
                data={stats.revenueSeries}
                granularity={range === "12m" ? "month" : "day"}
                title={range === "12m" ? "Doanh thu theo tháng" : "Doanh thu theo ngày"}
            />

            <div className="dashboard-bottom">
                <section className="card">
                    <h3>Đơn hàng theo trạng thái</h3>
                    <ul className="status-list">
                        {Object.entries(ORDER_STATUS_LABEL).map(([key, label]) => (
                            <li key={key}>
                                <div>
                                    <span>{label}</span>
                                    <span>{stats.ordersByStatus[key]}</span>
                                </div>
                                <div className="status-bar">
                                    <div style={{ width: `${(stats.ordersByStatus[key] / maxStatus) * 100}%` }} />
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="card">
                    <h3>Sản phẩm bán chạy</h3>
                    {stats.topProducts.length === 0 ? (
                        <p className="text-muted">Chưa có dữ liệu.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Sản phẩm</th>
                                    <th>SL</th>
                                    <th>Doanh thu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.topProducts.map((p) => (
                                    <tr key={p.productId}>
                                        <td>{p.name}</td>
                                        <td>{p.quantity}</td>
                                        <td>{formatVND(p.revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            </div>
        </div>
    );
}

export default Dashboard;
