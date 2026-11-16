import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { FaClock, FaImages } from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext";
import { getErrorMessage } from "../../../services/api";
import { formatDate } from "../../../services/format";
import orderService from "../../../services/orderService";
import "./MyPhotos.css";

function MyPhotos() {
    const { isLogin } = useAuth();
    const [galleries, setGalleries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isLogin) return;
        orderService
            .getMyGalleries()
            .then((res) => setGalleries(res.data ?? []))
            .catch((err) => setError(getErrorMessage(err)))
            .finally(() => setLoading(false));
    }, [isLogin]);

    if (!isLogin) return <Navigate to="/login" state={{ from: "/my-photos" }} replace />;

    return (
        <div className="container my-photos">
            <h1 className="page-title">Ảnh của tôi</h1>
            <p className="text-muted my-photos-desc">
                Gallery studio đã giao cho bạn. Ảnh gốc giữ nguyên chất lượng, tải bằng mã PIN studio cung cấp.
            </p>

            {loading ? (
                <div className="state-box">
                    <span className="spinner" />
                </div>
            ) : error ? (
                <div className="state-box">
                    <h3>{error}</h3>
                </div>
            ) : galleries.length === 0 ? (
                <div className="state-box">
                    <FaImages size={40} />
                    <h3 className="mt-10">Chưa có gallery nào</h3>
                    <p>Sau buổi chụp, studio sẽ giao ảnh vào đây và trong chi tiết đơn hàng.</p>
                </div>
            ) : (
                <div className="my-photos-grid">
                    {galleries.map((gallery) => (
                        <Link key={gallery.slug} to={`/g/${gallery.slug}`} className="my-photos-card">
                            <div className="my-photos-cover">{gallery.coverUrl && <img src={gallery.coverUrl} alt="" loading="lazy" />}</div>
                            <div className="my-photos-body">
                                <h3>{gallery.title}</h3>
                                <p className="text-muted">{gallery.itemCount} ảnh</p>
                                {gallery.expiresAt && (
                                    <p className="text-muted my-photos-expire">
                                        <FaClock /> Hết hạn {formatDate(gallery.expiresAt)}
                                    </p>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyPhotos;
