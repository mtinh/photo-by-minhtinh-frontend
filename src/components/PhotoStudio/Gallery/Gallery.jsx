import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaArrowDown, FaDownload, FaHeart, FaImages, FaLock } from "react-icons/fa";
import { useToast } from "../../../context/ToastContext";
import { getErrorMessage } from "../../../services/api";
import { formatDate } from "../../../services/format";
import galleryService from "../../../services/galleryService";
import Modal from "../Modal/Modal";
import PhotoGrid from "../PhotoGrid/PhotoGrid";
import PhotoViewer from "../PhotoViewer/PhotoViewer";
import "./Gallery.css";

function triggerDownload(url) {
    const a = document.createElement("a");
    a.href = url;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
}

function GalleryLock({ gallery, onUnlocked }) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!password) return setError("Vui lòng nhập mật khẩu");
        setLoading(true);
        try {
            await galleryService.unlock(gallery.slug, password);
            onUnlocked();
        } catch (err) {
            setError(getErrorMessage(err, "Mật khẩu không đúng"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="gallery-lock">
            {gallery.coverUrl && <img src={gallery.coverUrl} alt="" className="gallery-lock-bg" />}
            <form className="gallery-lock-card" onSubmit={handleSubmit}>
                <span className="gallery-lock-icon">
                    <FaLock />
                </span>
                <p className="gallery-eyebrow">{gallery.studioName}</p>
                <h1>{gallery.title}</h1>
                {gallery.clientName && <p className="gallery-lock-client">{gallery.clientName}</p>}
                <p className="gallery-lock-text">Gallery này được bảo vệ. Nhập mật khẩu studio đã gửi cho bạn.</p>
                <input
                    type="password"
                    placeholder="Mật khẩu"
                    autoFocus
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                    }}
                />
                {error && <p className="gallery-lock-error">{error}</p>}
                <button type="submit" disabled={loading}>
                    {loading ? "Đang kiểm tra..." : "Xem ảnh"}
                </button>
            </form>
        </div>
    );
}

function Gallery() {
    const { slug } = useParams();
    const toast = useToast();
    const gridRef = useRef(null);
    const pending = useRef(null);

    const [gallery, setGallery] = useState(null);
    const [error, setError] = useState("");
    const [items, setItems] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [onlyFavorites, setOnlyFavorites] = useState(false);
    const [openIndex, setOpenIndex] = useState(-1);
    const [pinOpen, setPinOpen] = useState(false);
    const [pin, setPin] = useState("");
    const [emailOpen, setEmailOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [modalError, setModalError] = useState("");

    const [reloadKey, setReloadKey] = useState(0);

    const loadGallery = useCallback(async () => {
        try {
            const res = await galleryService.getGallery(slug);
            setGallery(res.data);
            return res.data;
        } catch (err) {
            setError(getErrorMessage(err, "Không tìm thấy gallery"));
            return null;
        }
    }, [slug]);

    const loadMedia = useCallback(
        async (nextCursor = null) => {
            setLoadingMore(true);
            try {
                const res = await galleryService.getMedia(slug, nextCursor ?? undefined);
                setItems((prev) => (nextCursor ? [...prev, ...res.data.items] : res.data.items));
                setCursor(res.data.nextCursor);
            } catch (err) {
                toast.error(getErrorMessage(err));
            } finally {
                setLoadingMore(false);
            }
        },
        [slug, toast]
    );

    const refresh = () => setReloadKey((k) => k + 1);

    useEffect(() => {
        let cancelled = false;
        const fetchGallery = async () => {
            try {
                const res = await galleryService.getGallery(slug);
                if (cancelled) return;
                setGallery(res.data);
                if (!res.data.unlocked) return;
                const media = await galleryService.getMedia(slug);
                if (cancelled) return;
                setItems(media.data.items);
                setCursor(media.data.nextCursor);
            } catch (err) {
                if (!cancelled) setError(getErrorMessage(err, "Không tìm thấy gallery"));
            }
        };
        fetchGallery();
        return () => {
            cancelled = true;
        };
    }, [slug, reloadKey]);

    const shown = onlyFavorites ? items.filter((i) => i.isFavorite) : items;
    const current = openIndex >= 0 ? shown[openIndex] : null;

    const toggleFavorite = async (item) => {
        if (!gallery.clientEmail) {
            pending.current = { kind: "fav", item };
            setEmailOpen(true);
            return;
        }
        setItems((list) => list.map((i) => (i.id === item.id ? { ...i, isFavorite: !item.isFavorite } : i)));
        try {
            await galleryService.toggleFavorite(slug, item.id, !item.isFavorite);
        } catch (err) {
            setItems((list) => list.map((i) => (i.id === item.id ? { ...i, isFavorite: item.isFavorite } : i)));
            toast.error(getErrorMessage(err));
        }
    };

    const download = (kind, item) => {
        if (!gallery.canDownload) {
            pending.current = { kind, item };
            setPinOpen(true);
            return;
        }
        if (kind === "zip") {
            toast.info("Đang chuẩn bị tệp ZIP ảnh gốc...");
            triggerDownload(gallery.zipUrl);
        } else {
            triggerDownload(item.urls.download);
        }
    };

    const resume = async () => {
        const meta = await loadGallery();
        await loadMedia();
        const action = pending.current;
        pending.current = null;
        if (!action || !meta) return;
        if (action.kind === "fav") {
            await galleryService.toggleFavorite(slug, action.item.id, true);
            setItems((list) => list.map((i) => (i.id === action.item.id ? { ...i, isFavorite: true } : i)));
        } else if (action.kind === "zip") {
            triggerDownload(meta.zipUrl);
        }
    };

    const submitPin = async (e) => {
        e.preventDefault();
        try {
            await galleryService.downloadAccess(slug, pin);
            setPinOpen(false);
            setPin("");
            setModalError("");
            toast.success("Đã mở quyền tải ảnh gốc");
            await resume();
        } catch (err) {
            setModalError(getErrorMessage(err, "Mã PIN không đúng"));
        }
    };

    const submitEmail = async (e) => {
        e.preventDefault();
        try {
            await galleryService.identify(slug, email);
            setEmailOpen(false);
            setModalError("");
            await resume();
        } catch (err) {
            setModalError(getErrorMessage(err, "Email không hợp lệ"));
        }
    };

    if (error) {
        return (
            <div className="gallery-error">
                <h2>{error}</h2>
                <Link to="/" className="btn">
                    Về trang chủ
                </Link>
            </div>
        );
    }

    if (!gallery) {
        return (
            <div className="gallery-error">
                <span className="spinner" />
            </div>
        );
    }

    if (!gallery.unlocked) return <GalleryLock gallery={gallery} onUnlocked={refresh} />;

    const favoriteCount = items.filter((i) => i.isFavorite).length;

    return (
        <div className="gallery-page">
            <header className="gallery-cover">
                {gallery.coverUrl && <img src={gallery.coverUrl} alt="" />}
                <div className="gallery-cover-content">
                    <p className="gallery-eyebrow">{gallery.studioName}</p>
                    <h1>{gallery.title}</h1>
                    <p>{[gallery.clientName, formatDate(gallery.createdAt), `${gallery.itemCount} ảnh`].filter(Boolean).join(" · ")}</p>
                    <button className="btn btn-hero-outline" onClick={() => gridRef.current?.scrollIntoView({ behavior: "smooth" })}>
                        Xem ảnh <FaArrowDown />
                    </button>
                </div>
            </header>

            <div className="gallery-toolbar" ref={gridRef}>
                <div className="gallery-toolbar-inner">
                    <div className="gallery-tabs">
                        <button className={!onlyFavorites ? "active" : ""} onClick={() => setOnlyFavorites(false)}>
                            <FaImages /> Tất cả
                        </button>
                        {gallery.allowFavorites && (
                            <button className={onlyFavorites ? "active" : ""} onClick={() => setOnlyFavorites(true)}>
                                <FaHeart /> Đã chọn {favoriteCount > 0 && `(${favoriteCount})`}
                            </button>
                        )}
                    </div>
                    {gallery.downloadEnabled && (
                        <button className={`btn btn-sm ${gallery.canDownload ? "" : "btn-outline"}`} onClick={() => download("zip")}>
                            {gallery.canDownload ? <FaDownload /> : <FaLock />} Tải tất cả (ảnh gốc)
                        </button>
                    )}
                </div>
            </div>

            <main className="gallery-content">
                {shown.length === 0 && !loadingMore ? (
                    <div className="state-box">
                        <h3>{onlyFavorites ? "Chưa chọn ảnh nào" : "Gallery đang trống"}</h3>
                        <p>{onlyFavorites ? "Bấm biểu tượng trái tim trên ảnh để chọn ảnh bạn thích." : "Studio chưa thêm ảnh vào gallery này."}</p>
                    </div>
                ) : (
                    <PhotoGrid
                        items={shown}
                        groupByDay={false}
                        favoriteIcon="heart"
                        onOpen={(_, index) => setOpenIndex(index)}
                        hasMore={!!cursor}
                        loadingMore={loadingMore}
                        onLoadMore={() => loadMedia(cursor)}
                    />
                )}
            </main>

            <footer className="gallery-footer">
                {gallery.expiresAt && <p>Gallery có hiệu lực đến {formatDate(gallery.expiresAt)}.</p>}
                <p>© {gallery.studioName}</p>
            </footer>

            {current && (
                <PhotoViewer
                    item={current}
                    prev={openIndex > 0 ? shown[openIndex - 1] : null}
                    next={shown[openIndex + 1] ?? null}
                    onNavigate={(item) => setOpenIndex(shown.findIndex((i) => i.id === item.id))}
                    onClose={() => setOpenIndex(-1)}
                    zoomSrc={current.urls.original}
                    onKey={(e) => e.key.toLowerCase() === "f" && gallery.allowFavorites && toggleFavorite(current)}
                    actions={
                        <>
                            {gallery.allowFavorites && (
                                <button
                                    className={`viewer-btn heart ${current.isFavorite ? "active" : ""}`}
                                    onClick={() => toggleFavorite(current)}
                                    title="Chọn ảnh (F)"
                                    aria-label="Chọn ảnh"
                                >
                                    <FaHeart />
                                </button>
                            )}
                            {gallery.downloadEnabled && (
                                <button className="viewer-btn" onClick={() => download("one", current)} title="Tải ảnh gốc" aria-label="Tải ảnh gốc">
                                    <FaDownload />
                                </button>
                            )}
                        </>
                    }
                />
            )}

            <Modal open={pinOpen} title="Nhập mã PIN tải ảnh" size="sm" onClose={() => setPinOpen(false)}>
                <form onSubmit={submitPin}>
                    <p className="text-muted">Mã PIN do studio cung cấp cho bạn.</p>
                    <input
                        className="form-control gallery-pin-input"
                        inputMode="numeric"
                        autoFocus
                        maxLength={8}
                        value={pin}
                        onChange={(e) => {
                            setPin(e.target.value.replace(/\D/g, ""));
                            setModalError("");
                        }}
                    />
                    {modalError && <p className="error">{modalError}</p>}
                    <button type="submit" className="btn btn-block mt-10" disabled={pin.length < 4}>
                        Xác nhận
                    </button>
                </form>
            </Modal>

            <Modal open={emailOpen} title="Lưu ảnh bạn yêu thích" size="sm" onClose={() => setEmailOpen(false)}>
                <form onSubmit={submitEmail}>
                    <p className="text-muted">Nhập email để lưu danh sách ảnh đã chọn. Studio sẽ thấy các ảnh này để chỉnh sửa cho bạn.</p>
                    <input
                        className="form-control mt-10"
                        type="email"
                        autoFocus
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setModalError("");
                        }}
                    />
                    {modalError && <p className="error">{modalError}</p>}
                    <button type="submit" className="btn btn-block mt-10">
                        Tiếp tục
                    </button>
                </form>
            </Modal>
        </div>
    );
}

export default Gallery;
