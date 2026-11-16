import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import orderService from "../../../services/orderService";
import albumService from "../../../services/albumService";
import { getErrorMessage } from "../../../services/api";
import { ORDER_STATUS_LABEL, ORDER_TRANSITIONS } from "../../../services/format";
import { useToast } from "../../../context/ToastContext";
import { OrderInfo } from "../../PhotoStudio/OrderDetail/OrderDetail";
import Modal from "../../PhotoStudio/Modal/Modal";
import "./DetailOrder.css";

function DetailOrder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [order, setOrder] = useState(null);
    const [albums, setAlbums] = useState([]);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState("");
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState("");

    useEffect(() => {
        orderService
            .getOrder(id)
            .then((res) => setOrder(res.data))
            .catch((err) => setError(getErrorMessage(err, "Không tìm thấy đơn hàng")));
        albumService
            .getAlbums()
            .then((res) => setAlbums(res.data ?? []))
            .catch(() => setAlbums([]));
    }, [id]);

    const changeStatus = async (status, extra = {}) => {
        if (status === "COMPLETED" && !window.confirm("Hoàn thành đơn hàng? Sau khi hoàn thành, đơn sẽ không thể thay đổi.")) return;
        setSaving(status);
        try {
            const res = await orderService.updateStatus(id, { status, ...extra });
            setOrder(res.data);
            toast.success(`Đã chuyển sang "${ORDER_STATUS_LABEL[status]}"`);
            setCancelOpen(false);
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setSaving("");
        }
    };

    const attachGallery = async (albumId) => {
        try {
            const res = await orderService.attachGallery(id, albumId || null);
            setOrder(res.data);
            toast.success(albumId ? "Đã gắn gallery — khách xem trong Ảnh của tôi" : "Đã gỡ gallery");
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    if (error) return <div className="state-box">{error}</div>;

    if (!order) {
        return (
            <div className="state-box">
                <span className="spinner" />
            </div>
        );
    }

    const transitions = ORDER_TRANSITIONS[order.status];
    const isFinal = transitions.length === 0;

    return (
        <div className="detail-order">
            <div className="page-header">
                <button className="btn btn-outline" onClick={() => navigate("/list-order")}>
                    <FaArrowLeft /> Danh sách đơn
                </button>
            </div>

            <section className="card detail-order-actions">
                <h3>Xử lý đơn</h3>
                {isFinal ? (
                    <p className="text-muted">Đơn đã {ORDER_STATUS_LABEL[order.status].toLowerCase()} — không thể thay đổi trạng thái hoặc xoá.</p>
                ) : (
                    <>
                        <div className="detail-order-buttons">
                            {transitions
                                .filter((s) => s !== "CANCELLED")
                                .map((s) => (
                                    <button key={s} className="btn" disabled={!!saving} onClick={() => changeStatus(s)}>
                                        {saving === s ? "Đang lưu..." : `Chuyển sang "${ORDER_STATUS_LABEL[s]}"`}
                                    </button>
                                ))}
                            {transitions.includes("CANCELLED") && (
                                <button className="btn btn-danger" onClick={() => setCancelOpen(true)}>
                                    Huỷ đơn
                                </button>
                            )}
                        </div>

                        <div className="form-group detail-order-gallery">
                            <label>Gallery ảnh giao cho khách</label>
                            <div>
                                <select className="form-control" value={order.gallery?.albumId ?? ""} onChange={(e) => attachGallery(e.target.value)}>
                                    <option value="">— Chưa gắn —</option>
                                    {albums.map((album) => (
                                        <option key={album.id} value={album.id}>
                                            {album.title} ({album.itemCount} ảnh)
                                        </option>
                                    ))}
                                </select>
                                {order.gallery && (
                                    <Link to={`/detail-album/${order.gallery.albumId}`} className="btn btn-ghost">
                                        Mở album
                                    </Link>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </section>

            <OrderInfo order={order} showEmail />

            <Modal
                open={cancelOpen}
                title={`Huỷ đơn ${order.code}`}
                size="sm"
                onClose={() => setCancelOpen(false)}
                footer={
                    <>
                        <button className="btn btn-ghost" onClick={() => setCancelOpen(false)}>
                            Đóng
                        </button>
                        <button className="btn btn-danger" disabled={!cancelReason.trim() || !!saving} onClick={() => changeStatus("CANCELLED", { cancelReason: cancelReason.trim() })}>
                            Huỷ đơn
                        </button>
                    </>
                }
            >
                <p className="text-muted">Tồn kho sẽ được hoàn lại. Thao tác này không thể hoàn tác.</p>
                <div className="form-group mt-10">
                    <label>Lý do huỷ</label>
                    <textarea className="form-control" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} autoFocus />
                </div>
            </Modal>
        </div>
    );
}

export default DetailOrder;
