import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHeart, FaImages, FaLock, FaPlus, FaShareAlt } from "react-icons/fa";
import albumService from "../../../services/albumService";
import { getErrorMessage } from "../../../services/api";
import { useToast } from "../../../context/ToastContext";
import Modal from "../../PhotoStudio/Modal/Modal";
import "./ListAlbum.css";

function ListAlbum() {
    const navigate = useNavigate();
    const toast = useToast();
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [title, setTitle] = useState("");
    const [clientName, setClientName] = useState("");

    useEffect(() => {
        albumService
            .getAlbums()
            .then((res) => setAlbums(res.data ?? []))
            .catch((err) => toast.error(getErrorMessage(err)))
            .finally(() => setLoading(false));
    }, [toast]);

    const createAlbum = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        try {
            const res = await albumService.createAlbum({ title: title.trim(), clientName: clientName.trim() });
            toast.success("Đã tạo album");
            navigate(`/detail-album/${res.data.id}`);
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    return (
        <div className="list-album">
            <div className="page-header">
                <div>
                    <h2>Album & gallery khách</h2>
                    <p className="text-muted">Mỗi album có thể chia sẻ cho một khách: link riêng, mật khẩu xem, mã PIN tải ảnh gốc.</p>
                </div>
                <button className="btn" onClick={() => setCreating(true)}>
                    <FaPlus /> Album mới
                </button>
            </div>

            {loading ? (
                <div className="state-box">
                    <span className="spinner" />
                </div>
            ) : albums.length === 0 ? (
                <div className="state-box">
                    <FaImages size={40} />
                    <h3 className="mt-10">Chưa có album</h3>
                    <p>Tạo album cho từng buổi chụp rồi chia sẻ cho khách.</p>
                    <button className="btn" onClick={() => setCreating(true)}>
                        Tạo album
                    </button>
                </div>
            ) : (
                <div className="album-grid">
                    {albums.map((album) => (
                        <Link key={album.id} to={`/detail-album/${album.id}`} className="album-card">
                            <div className="album-cover">
                                {album.coverUrl ? <img src={album.coverUrl} alt="" loading="lazy" /> : <FaImages />}
                                {album.slug && (
                                    <span className="album-shared">
                                        {album.hasPassword ? <FaLock /> : <FaShareAlt />} Đã chia sẻ
                                    </span>
                                )}
                            </div>
                            <h3>{album.title}</h3>
                            <p className="text-muted">
                                {album.itemCount} ảnh
                                {(album.customerName || album.clientName) && ` · ${album.customerName || album.clientName}`}
                                {album.clientPickCount > 0 && (
                                    <>
                                        {" · "}
                                        <FaHeart /> {album.clientPickCount}
                                    </>
                                )}
                            </p>
                        </Link>
                    ))}
                </div>
            )}

            <Modal open={creating} title="Album mới" size="sm" onClose={() => setCreating(false)}>
                <form onSubmit={createAlbum}>
                    <div className="form-group">
                        <label>Tên album</label>
                        <input className="form-control" autoFocus placeholder="Ví dụ: Cưới Apple & Tường Vi" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Tên khách hàng (tuỳ chọn)</label>
                        <input className="form-control" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                    </div>
                    <button className="btn btn-block" disabled={!title.trim()}>
                        Tạo album
                    </button>
                </form>
            </Modal>
        </div>
    );
}

export default ListAlbum;
