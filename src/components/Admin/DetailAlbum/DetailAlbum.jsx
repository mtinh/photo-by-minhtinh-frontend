import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaCopy, FaHeart, FaImages, FaShareAlt, FaTrash, FaUpload } from "react-icons/fa";
import albumService from "../../../services/albumService";
import { getErrorMessage } from "../../../services/api";
import { useToast } from "../../../context/ToastContext";
import { useUpload } from "../../../context/UploadContext";
import Photos from "../Photos/Photos";
import GalleryShare from "../GalleryShare/GalleryShare";
import "./DetailAlbum.css";

function DetailAlbum() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { openPicker, version } = useUpload();

    const [album, setAlbum] = useState(null);
    const [error, setError] = useState("");
    const [tab, setTab] = useState("all");
    const [picks, setPicks] = useState([]);
    const [shareOpen, setShareOpen] = useState(false);

    useEffect(() => {
        albumService
            .getAlbum(id)
            .then((res) => setAlbum(res.data))
            .catch((err) => setError(getErrorMessage(err, "Không tìm thấy album")));
    }, [id, version]);

    useEffect(() => {
        if (tab !== "picks") return;
        albumService
            .getPicks(id)
            .then((res) => setPicks(res.data ?? []))
            .catch(() => setPicks([]));
    }, [id, tab]);

    const pickedIds = useMemo(() => new Set(picks.flatMap((p) => p.mediaIds)), [picks]);

    const rename = async (value) => {
        const title = value.trim();
        if (!title || title === album.title) return;
        try {
            const res = await albumService.updateAlbum(album.id, { title });
            setAlbum(res.data);
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const remove = async () => {
        if (!window.confirm(`Xoá album "${album.title}"?\nẢnh vẫn còn trong thư viện. Link chia sẻ ngừng hoạt động.`)) return;
        try {
            await albumService.deleteAlbum(album.id);
            toast.success("Đã xoá album");
            navigate("/list-album");
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    if (error) return <div className="state-box">{error}</div>;

    if (!album) {
        return (
            <div className="state-box">
                <span className="spinner" />
            </div>
        );
    }

    return (
        <div className="detail-album">
            <div className="detail-album-header">
                <button className="icon-btn" onClick={() => navigate("/list-album")} aria-label="Quay lại">
                    <FaArrowLeft />
                </button>
                <div className="detail-album-title">
                    <input
                        key={album.title}
                        defaultValue={album.title}
                        aria-label="Tên album"
                        onBlur={(e) => rename(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                    />
                    <div className="detail-album-badges">
                        <span>{album.itemCount} ảnh</span>
                        {album.slug ? (
                            <span className="badge badge-primary">
                                Đã chia sẻ{album.hasPassword ? " · có mật khẩu" : ""}
                                {album.hasDownloadPin ? " · có PIN" : ""}
                            </span>
                        ) : (
                            <span className="badge">Riêng tư</span>
                        )}
                        {album.customerName && <span className="badge badge-success">Khách: {album.customerName}</span>}
                    </div>
                </div>
                <div className="detail-album-actions">
                    <button className="btn" onClick={() => setShareOpen(true)}>
                        <FaShareAlt /> Chia sẻ cho khách
                    </button>
                    <button className="btn btn-outline" onClick={() => openPicker(album.id)}>
                        <FaUpload /> Tải ảnh lên
                    </button>
                    <button className="icon-btn" onClick={remove} title="Xoá album">
                        <FaTrash />
                    </button>
                </div>
            </div>

            <div className="detail-album-tabs">
                <button className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>
                    <FaImages /> Tất cả ({album.itemCount})
                </button>
                <button className={tab === "picks" ? "active" : ""} onClick={() => setTab("picks")}>
                    <FaHeart /> Khách đã chọn ({album.clientPickCount})
                </button>
            </div>

            {tab === "all" ? (
                <Photos key="all" filter="all" albumId={album.id} embedded emptyText="Album trống — tải ảnh lên hoặc thêm ảnh từ thư viện" />
            ) : picks.length === 0 ? (
                <div className="state-box">
                    <h3>Khách chưa chọn ảnh nào</h3>
                    <p>Khi khách thả tim ảnh trong gallery, danh sách sẽ hiện ở đây để bạn retouch.</p>
                </div>
            ) : (
                <>
                    <ul className="detail-album-picks">
                        {picks.map((p) => (
                            <li key={p.email}>
                                <strong>{p.email}</strong>
                                <span>{p.mediaIds.length} ảnh</span>
                                <button
                                    className="btn btn-sm btn-outline"
                                    onClick={() => navigator.clipboard.writeText(p.mediaIds.join("\n")).then(() => toast.success("Đã chép danh sách mã ảnh"))}
                                >
                                    <FaCopy /> Chép danh sách
                                </button>
                            </li>
                        ))}
                    </ul>
                    <Photos key="picks" filter="all" albumId={album.id} filterIds={pickedIds} embedded />
                </>
            )}

            {shareOpen && <GalleryShare album={album} onClose={() => setShareOpen(false)} onChange={setAlbum} />}
        </div>
    );
}

export default DetailAlbum;
