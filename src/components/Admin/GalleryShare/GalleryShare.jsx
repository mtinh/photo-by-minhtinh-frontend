import { useState } from "react";
import { FaCopy, FaExternalLinkAlt, FaGlobe, FaKey, FaLink, FaSyncAlt, FaUnlink } from "react-icons/fa";
import albumService from "../../../services/albumService";
import { getErrorMessage } from "../../../services/api";
import { useToast } from "../../../context/ToastContext";
import Modal from "../../PhotoStudio/Modal/Modal";
import "./GalleryShare.css";

const randomPin = () => Array.from(crypto.getRandomValues(new Uint32Array(6)), (n) => n % 10).join("");

function GalleryShare({ album, onClose, onChange }) {
    const toast = useToast();
    const [clientName, setClientName] = useState(album.clientName);
    const [customerEmail, setCustomerEmail] = useState("");
    const [password, setPassword] = useState("");
    const [pin, setPin] = useState("");
    const [expires, setExpires] = useState(album.expiresAt?.slice(0, 10) ?? "");
    const [revealed, setRevealed] = useState({});
    const [saving, setSaving] = useState(false);

    const url = album.slug ? `${window.location.origin}/g/${album.slug}` : null;

    const run = async (action, message) => {
        try {
            const res = await action();
            onChange(res.data);
            if (message) toast.success(message);
            return true;
        } catch (err) {
            toast.error(getErrorMessage(err));
            return false;
        }
    };

    const copy = async (text, message = "Đã chép") => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(message);
        } catch {
            toast.error("Không sao chép được, hãy chọn và chép thủ công");
        }
    };

    const save = async (e) => {
        e.preventDefault();
        if (password && password.length < 4) return toast.error("Mật khẩu tối thiểu 4 ký tự");
        if (pin && !/^\d{4,8}$/.test(pin)) return toast.error("PIN gồm 4–8 chữ số");
        setSaving(true);
        const ok = await run(
            () =>
                albumService.saveGallery(album.id, {
                    clientName,
                    customerEmail: customerEmail.trim() || undefined,
                    password: password || undefined,
                    downloadPin: pin || undefined,
                    expiresAt: expires ? new Date(`${expires}T23:59:59`).toISOString() : null,
                }),
            "Đã lưu thiết lập gallery"
        );
        setSaving(false);
        if (ok) {
            setRevealed((r) => ({ password: password || r.password, pin: pin || r.pin }));
            setPassword("");
            setPin("");
            setCustomerEmail("");
        }
    };

    const shareText = [
        `Gallery ảnh "${album.title}"${album.clientName ? ` của ${album.clientName}` : ""}:`,
        url,
        revealed.password && `Mật khẩu xem: ${revealed.password}`,
        revealed.pin && `Mã PIN tải ảnh: ${revealed.pin}`,
    ]
        .filter(Boolean)
        .join("\n");

    return (
        <Modal open title="Chia sẻ cho khách" size="md" onClose={onClose}>
            <section className="share-link">
                <div className="share-link-head">
                    <span className={`share-link-icon ${url ? "on" : ""}`}>
                        <FaGlobe />
                    </span>
                    <div>
                        <strong>{url ? "Đang chia sẻ bằng link" : "Chưa chia sẻ"}</strong>
                        <small>{url ? "Chỉ người có link (và mật khẩu, nếu đặt) mới xem được." : "Tạo link riêng để gửi cho khách."}</small>
                    </div>
                    {!url && (
                        <button className="btn btn-sm" onClick={() => run(() => albumService.publish(album.id), "Đã tạo link chia sẻ")}>
                            <FaLink /> Tạo link
                        </button>
                    )}
                </div>

                {url && (
                    <>
                        <div className="share-link-row">
                            <input className="form-control" readOnly value={url} onFocus={(e) => e.target.select()} />
                            <button className="btn btn-outline" onClick={() => copy(url, "Đã chép link")}>
                                <FaCopy /> Chép
                            </button>
                        </div>
                        <div className="share-link-actions">
                            <a className="btn btn-sm btn-ghost" href={url} target="_blank" rel="noreferrer">
                                <FaExternalLinkAlt /> Xem như khách
                            </a>
                            {(revealed.password || revealed.pin) && (
                                <button className="btn btn-sm btn-ghost" onClick={() => copy(shareText, "Đã chép tin nhắn gửi khách")}>
                                    <FaCopy /> Chép tin nhắn gửi khách
                                </button>
                            )}
                            <button
                                className="btn btn-sm btn-ghost"
                                onClick={() => window.confirm("Đổi link mới? Link cũ sẽ ngừng hoạt động ngay.") && run(() => albumService.publish(album.id, true), "Đã đổi link mới")}
                            >
                                <FaSyncAlt /> Đổi link
                            </button>
                            <button
                                className="btn btn-sm btn-ghost share-danger"
                                onClick={() => window.confirm("Ngừng chia sẻ? Khách sẽ không truy cập được nữa.") && run(() => albumService.unpublish(album.id), "Đã ngừng chia sẻ")}
                            >
                                <FaUnlink /> Ngừng chia sẻ
                            </button>
                        </div>
                    </>
                )}
            </section>

            <form onSubmit={save} className="share-form">
                <div className="form-group">
                    <label>Tên khách hàng</label>
                    <input className="form-control" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ví dụ: Apple & Tường Vi" />
                </div>

                <div className="form-group">
                    <label>{album.customerName ? `Tài khoản khách: ${album.customerName} (${album.customerEmail})` : "Gắn với tài khoản khách (tuỳ chọn)"}</label>
                    <input
                        className="form-control"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder={album.customerName ? "Nhập email khác để đổi" : "Email khách đã đăng ký"}
                    />
                    <small className="text-muted">Khách đăng nhập sẽ thấy gallery trong "Ảnh của tôi" mà không cần mật khẩu xem.</small>
                    {album.customerId && (
                        <button
                            type="button"
                            className="share-link-btn share-danger"
                            onClick={() => run(() => albumService.saveGallery(album.id, { customerEmail: null }), "Đã gỡ liên kết tài khoản")}
                        >
                            Gỡ liên kết tài khoản
                        </button>
                    )}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>{album.hasPassword ? "Đổi mật khẩu xem" : "Mật khẩu xem (tuỳ chọn)"}</label>
                        <input className="form-control" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={album.hasPassword ? "•••••• (đã đặt)" : "Không đặt = ai có link đều xem"} />
                        {album.hasPassword && (
                            <button type="button" className="share-link-btn share-danger" onClick={() => run(() => albumService.saveGallery(album.id, { password: null }), "Đã bỏ mật khẩu")}>
                                Bỏ mật khẩu
                            </button>
                        )}
                    </div>
                    <div className="form-group">
                        <label>{album.hasDownloadPin ? "Đổi mã PIN tải ảnh" : "Mã PIN tải ảnh"}</label>
                        <div className="share-pin">
                            <input
                                className="form-control"
                                inputMode="numeric"
                                autoComplete="off"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                                placeholder={album.hasDownloadPin ? "•••• (đã đặt)" : "4–8 chữ số"}
                            />
                            <button type="button" className="btn btn-outline" title="Tạo PIN ngẫu nhiên" onClick={() => setPin(randomPin())}>
                                <FaKey />
                            </button>
                        </div>
                        {album.hasDownloadPin && (
                            <button type="button" className="share-link-btn share-danger" onClick={() => run(() => albumService.saveGallery(album.id, { downloadPin: null }), "Đã bỏ PIN")}>
                                Bỏ PIN
                            </button>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label>Hết hạn (tuỳ chọn)</label>
                    <input type="date" className="form-control" min={new Date().toISOString().slice(0, 10)} value={expires} onChange={(e) => setExpires(e.target.value)} />
                </div>

                {(revealed.password || revealed.pin) && (
                    <p className="alert alert-success">
                        {revealed.password && (
                            <>
                                Mật khẩu: <strong>{revealed.password}</strong>.{" "}
                            </>
                        )}
                        {revealed.pin && (
                            <>
                                PIN tải: <strong>{revealed.pin}</strong>.{" "}
                            </>
                        )}
                        Hãy gửi cho khách ngay — vì lý do bảo mật, hệ thống không hiển thị lại.
                    </p>
                )}

                <button className="btn btn-block" disabled={saving}>
                    {saving ? "Đang lưu..." : "Lưu thiết lập"}
                </button>
            </form>

            <div className="share-toggles">
                <label>
                    <input
                        type="checkbox"
                        checked={album.downloadEnabled}
                        onChange={(e) => run(() => albumService.saveGallery(album.id, { downloadEnabled: e.target.checked }))}
                    />
                    <span>
                        <strong>Cho phép tải ảnh gốc</strong>
                        <small>Ảnh tải về giữ nguyên 100% chất lượng và độ phân giải.</small>
                    </span>
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={album.allowFavorites}
                        onChange={(e) => run(() => albumService.saveGallery(album.id, { allowFavorites: e.target.checked }))}
                    />
                    <span>
                        <strong>Cho khách chọn ảnh yêu thích</strong>
                        <small>Khách thả tim để chọn ảnh — xem trong tab "Khách đã chọn".</small>
                    </span>
                </label>
            </div>
        </Modal>
    );
}

export default GalleryShare;
