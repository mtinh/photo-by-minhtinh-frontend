import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    FaDownload,
    FaFolderMinus,
    FaFolderPlus,
    FaPlus,
    FaSlidersH,
    FaStar,
    FaTimes,
    FaTrash,
    FaTrashRestore,
    FaUndo,
    FaUpload,
} from "react-icons/fa";
import mediaService from "../../../services/mediaService";
import albumService from "../../../services/albumService";
import { getErrorMessage } from "../../../services/api";
import { formatBytes, formatDateTime } from "../../../services/format";
import { useToast } from "../../../context/ToastContext";
import { useUpload } from "../../../context/UploadContext";
import PhotoGrid from "../../PhotoStudio/PhotoGrid/PhotoGrid";
import PhotoViewer from "../../PhotoStudio/PhotoViewer/PhotoViewer";
import Modal from "../../PhotoStudio/Modal/Modal";
import PhotoEditor from "../PhotoEditor/PhotoEditor";
import "./Photos.css";

const TITLES = { all: "Tất cả ảnh", favorites: "Yêu thích", trash: "Thùng rác", search: "Kết quả tìm kiếm" };

function downloadFiles(items) {
    items.forEach((item, i) => {
        setTimeout(() => {
            const a = document.createElement("a");
            a.href = item.urls.download;
            document.body.appendChild(a);
            a.click();
            a.remove();
        }, i * 300);
    });
}

function InfoPanel({ item, onClose, onSaved }) {
    const toast = useToast();
    const [description, setDescription] = useState(item.description);

    const save = async () => {
        if (description === item.description) return;
        try {
            const res = await mediaService.updateMedia(item.id, { description });
            onSaved(res.data);
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    return (
        <div className="photo-info">
            <div className="photo-info-header">
                <h3>Thông tin</h3>
                <button className="icon-btn" onClick={onClose} aria-label="Đóng">
                    <FaTimes />
                </button>
            </div>
            <div className="form-group">
                <label>Mô tả</label>
                <textarea className="form-control" value={description} placeholder="Thêm mô tả..." onChange={(e) => setDescription(e.target.value)} onBlur={save} />
            </div>
            <dl>
                <dt>Ngày chụp</dt>
                <dd>{formatDateTime(item.takenAt)}</dd>
                <dt>Tệp</dt>
                <dd>
                    {item.filename}
                    <small>{item.mimeType}</small>
                </dd>
                <dt>Kích thước</dt>
                <dd>
                    {item.width} × {item.height}
                    <small>{((item.width * item.height) / 1e6).toFixed(1)} MP</small>
                </dd>
                <dt>Dung lượng</dt>
                <dd>
                    {formatBytes(item.sizeBytes)}
                    {item.hasBackup && <small>Đã chỉnh sửa · còn bản gốc</small>}
                </dd>
            </dl>
        </div>
    );
}

function AlbumPicker({ mediaIds, onClose, onDone }) {
    const toast = useToast();
    const [albums, setAlbums] = useState(null);
    const [title, setTitle] = useState("");

    useEffect(() => {
        albumService
            .getAlbums()
            .then((res) => setAlbums(res.data ?? []))
            .catch(() => setAlbums([]));
    }, []);

    const addTo = async (album) => {
        try {
            const res = await albumService.addItems(album.id, mediaIds);
            toast.success(res.data.affected ? `Đã thêm ${res.data.affected} ảnh vào "${album.title}"` : `Các ảnh đã có trong "${album.title}"`);
            onDone();
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const createAlbum = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        try {
            await albumService.createAlbum({ title: title.trim(), mediaIds });
            toast.success(`Đã tạo album "${title.trim()}"`);
            onDone();
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    return (
        <Modal open title="Thêm vào album" size="sm" onClose={onClose}>
            <form className="album-picker-new" onSubmit={createAlbum}>
                <input className="form-control" placeholder="Tên album mới..." value={title} onChange={(e) => setTitle(e.target.value)} />
                <button className="btn" disabled={!title.trim()}>
                    <FaPlus /> Tạo
                </button>
            </form>
            {albums === null ? (
                <div className="state-box">
                    <span className="spinner" />
                </div>
            ) : (
                <ul className="album-picker-list">
                    {albums.map((album) => (
                        <li key={album.id}>
                            <button onClick={() => addTo(album)}>
                                {album.coverUrl ? <img src={album.coverUrl} alt="" /> : <span className="album-picker-empty" />}
                                <span>
                                    <strong>{album.title}</strong>
                                    <small>{album.itemCount} ảnh</small>
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </Modal>
    );
}

function Photos({ filter = "all", albumId = null, filterIds = null, embedded = false, emptyText }) {
    const navigate = useNavigate();
    const toast = useToast();
    const { addFiles, openPicker, version } = useUpload();
    const [params] = useSearchParams();
    const q = filter === "search" ? params.get("q") ?? "" : "";

    const [items, setItems] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selected, setSelected] = useState(new Set());
    const [openId, setOpenId] = useState(null);
    const [showInfo, setShowInfo] = useState(false);
    const [editing, setEditing] = useState(null);
    const [pickerIds, setPickerIds] = useState(null);
    const [keyword, setKeyword] = useState(q);
    const [dragging, setDragging] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const anchor = useRef(null);

    const query = useCallback(
        (nextCursor) => ({
            filter: filter === "search" ? "all" : filter,
            albumId: albumId ?? undefined,
            q: q || undefined,
            cursor: nextCursor ?? undefined,
            limit: filterIds ? 500 : undefined,
        }),
        [filter, albumId, q, filterIds]
    );

    const loadFirst = () => setReloadKey((k) => k + 1);

    useEffect(() => {
        let cancelled = false;
        const fetchMedia = async () => {
            setLoading(true);
            setSelected(new Set());
            try {
                const res = await mediaService.getMedia(query());
                if (cancelled) return;
                setItems(res.data.items);
                setCursor(res.data.nextCursor);
                setTotal(res.data.total);
            } catch (err) {
                if (!cancelled) toast.error(getErrorMessage(err));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchMedia();
        return () => {
            cancelled = true;
        };
    }, [query, toast, version, reloadKey]);

    const loadMore = useCallback(async () => {
        if (!cursor || loadingMore) return;
        setLoadingMore(true);
        try {
            const res = await mediaService.getMedia(query(cursor));
            setItems((prev) => [...prev, ...res.data.items]);
            setCursor(res.data.nextCursor);
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setLoadingMore(false);
        }
    }, [cursor, loadingMore, query, toast]);

    useEffect(() => {
        if (filter === "trash") return;
        const hasFiles = (e) => e.dataTransfer?.types.includes("Files");
        let depth = 0;
        const onEnter = (e) => {
            if (!hasFiles(e)) return;
            e.preventDefault();
            depth += 1;
            setDragging(true);
        };
        const onOver = (e) => hasFiles(e) && e.preventDefault();
        const onLeave = () => {
            depth = Math.max(0, depth - 1);
            if (depth === 0) setDragging(false);
        };
        const onDrop = (e) => {
            if (!hasFiles(e)) return;
            e.preventDefault();
            depth = 0;
            setDragging(false);
            addFiles(e.dataTransfer.files, albumId);
        };
        window.addEventListener("dragenter", onEnter);
        window.addEventListener("dragover", onOver);
        window.addEventListener("dragleave", onLeave);
        window.addEventListener("drop", onDrop);
        return () => {
            window.removeEventListener("dragenter", onEnter);
            window.removeEventListener("dragover", onOver);
            window.removeEventListener("dragleave", onLeave);
            window.removeEventListener("drop", onDrop);
        };
    }, [filter, albumId, addFiles]);

    const shown = filterIds ? items.filter((i) => filterIds.has(i.id)) : items;
    const openIndex = shown.findIndex((i) => i.id === openId);
    const current = openIndex >= 0 ? shown[openIndex] : null;
    const selectedItems = shown.filter((i) => selected.has(i.id));
    const isTrash = filter === "trash";

    const replaceItem = (updated) => setItems((list) => list.map((i) => (i.id === updated.id ? updated : i)));
    const removeItems = (ids) => {
        setItems((list) => list.filter((i) => !ids.includes(i.id)));
        setTotal((t) => Math.max(0, t - ids.length));
        setSelected(new Set());
    };

    const toggle = (item, index, range) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (range && anchor.current !== null) {
                const [a, b] = [anchor.current, index].sort((x, y) => x - y);
                for (let i = a; i <= b; i++) next.add(shown[i].id);
            } else if (next.has(item.id)) next.delete(item.id);
            else next.add(item.id);
            return next;
        });
        anchor.current = index;
    };

    const toggleMany = (ids, value) =>
        setSelected((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => (value ? next.add(id) : next.delete(id)));
            return next;
        });

    const runBulk = async (ids, action, message) => {
        try {
            await mediaService.bulk(ids, action);
            if (message) toast.success(message);
            return true;
        } catch (err) {
            toast.error(getErrorMessage(err));
            return false;
        }
    };

    const setFavorite = async (ids, value) => {
        setItems((list) => list.map((i) => (ids.includes(i.id) ? { ...i, isFavorite: value } : i)));
        const ok = await runBulk(ids, { type: "favorite", value });
        if (!ok) loadFirst();
        else if (filter === "favorites" && !value) removeItems(ids);
    };

    const moveToTrash = async (ids) => {
        if (!(await runBulk(ids, { type: "trash" }))) return;
        removeItems(ids);
        toast.success(`Đã chuyển ${ids.length} ảnh vào thùng rác`, {
            label: "Hoàn tác",
            onClick: async () => {
                await runBulk(ids, { type: "restore" });
                loadFirst();
            },
        });
    };

    const restore = async (ids) => {
        if (await runBulk(ids, { type: "restore" }, `Đã khôi phục ${ids.length} ảnh`)) removeItems(ids);
    };

    const deleteForever = async (ids) => {
        if (!window.confirm(`Xoá vĩnh viễn ${ids.length} ảnh? Không thể khôi phục.`)) return;
        if (await runBulk(ids, { type: "deletePermanently" }, `Đã xoá vĩnh viễn ${ids.length} ảnh`)) removeItems(ids);
    };

    const removeFromAlbum = async (ids) => {
        try {
            await albumService.removeItems(albumId, ids);
            toast.success(`Đã xoá ${ids.length} ảnh khỏi album`);
            removeItems(ids);
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const emptyTrash = async () => {
        if (!window.confirm(`Dọn sạch thùng rác (${total} ảnh)? Không thể khôi phục.`)) return;
        try {
            const res = await mediaService.emptyTrash();
            toast.success(`Đã xoá vĩnh viễn ${res.data.affected} ảnh`);
            loadFirst();
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const revert = async (item) => {
        try {
            const res = await mediaService.revertMedia(item.id);
            replaceItem(res.data);
            toast.success("Đã khôi phục ảnh gốc");
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const navigateAfterRemove = (item) => {
        const index = shown.findIndex((i) => i.id === item.id);
        const neighbour = shown[index + 1] ?? shown[index - 1];
        setOpenId(neighbour ? neighbour.id : null);
    };

    const ids = [...selected];

    return (
        <div className="photos-page">
            {!embedded && (
                <div className="page-header">
                    <h2>
                        {TITLES[filter]}
                        {filter === "search" && q && ` cho "${q}"`}
                        <small className="photos-count">{total} ảnh</small>
                    </h2>
                    <div className="photos-actions">
                        <form
                            className="photos-search"
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (keyword.trim()) navigate(`/photos/search?q=${encodeURIComponent(keyword.trim())}`);
                            }}
                        >
                            <input type="search" className="form-control" placeholder="Tìm theo tên tệp, mô tả, ngày (2026-05)..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                        </form>
                        {isTrash ? (
                            total > 0 && (
                                <button className="btn btn-danger" onClick={emptyTrash}>
                                    <FaTrash /> Dọn sạch thùng rác
                                </button>
                            )
                        ) : (
                            <button className="btn" onClick={() => openPicker(albumId)}>
                                <FaUpload /> Tải ảnh lên
                            </button>
                        )}
                    </div>
                </div>
            )}

            {isTrash && !embedded && <p className="photos-note">Ảnh trong thùng rác sẽ bị xoá vĩnh viễn sau 30 ngày.</p>}

            {selected.size > 0 && (
                <div className="selection-bar" role="toolbar">
                    <button className="icon-btn" onClick={() => setSelected(new Set())} aria-label="Bỏ chọn">
                        <FaTimes />
                    </button>
                    <strong>Đã chọn {selected.size}</strong>
                    <div className="selection-actions">
                        {isTrash ? (
                            <>
                                <button className="btn btn-sm btn-ghost" onClick={() => restore(ids)}>
                                    <FaTrashRestore /> Khôi phục
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => deleteForever(ids)}>
                                    <FaTrash /> Xoá vĩnh viễn
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="btn btn-sm btn-ghost" onClick={() => setFavorite(ids, !selectedItems.every((i) => i.isFavorite))}>
                                    <FaStar /> {selectedItems.every((i) => i.isFavorite) ? "Bỏ yêu thích" : "Yêu thích"}
                                </button>
                                <button className="btn btn-sm btn-ghost" onClick={() => setPickerIds(ids)}>
                                    <FaFolderPlus /> Thêm vào album
                                </button>
                                {albumId && (
                                    <button className="btn btn-sm btn-ghost" onClick={() => removeFromAlbum(ids)}>
                                        <FaFolderMinus /> Xoá khỏi album
                                    </button>
                                )}
                                <button className="btn btn-sm btn-ghost" onClick={() => downloadFiles(selectedItems)}>
                                    <FaDownload /> Tải ảnh gốc
                                </button>
                                <button className="btn btn-sm btn-ghost" onClick={() => moveToTrash(ids)}>
                                    <FaTrash /> Thùng rác
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {loading ? (
                <div className="state-box">
                    <span className="spinner" />
                </div>
            ) : shown.length === 0 ? (
                <div className="state-box">
                    <h3>{emptyText ?? (isTrash ? "Thùng rác trống" : filter === "favorites" ? "Chưa có ảnh yêu thích" : "Chưa có ảnh nào")}</h3>
                    {!isTrash && filter !== "favorites" && (
                        <>
                            <p>Kéo thả ảnh vào đây hoặc bấm Tải ảnh lên. Ảnh gốc được giữ nguyên 100% chất lượng.</p>
                            <button className="btn" onClick={() => openPicker(albumId)}>
                                <FaUpload /> Tải ảnh lên
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <PhotoGrid
                    items={shown}
                    groupByDay={!isTrash && !filterIds}
                    selectable
                    selectedIds={selected}
                    onToggle={toggle}
                    onToggleMany={toggleMany}
                    onOpen={(item) => setOpenId(item.id)}
                    hasMore={!!cursor}
                    loadingMore={loadingMore}
                    onLoadMore={loadMore}
                />
            )}

            {dragging && (
                <div className="drop-overlay">
                    <div>
                        <FaUpload />
                        <strong>Thả ảnh để tải lên</strong>
                        <span>Giữ nguyên chất lượng gốc — không nén, không giảm độ phân giải</span>
                    </div>
                </div>
            )}

            {current && !editing && (
                <PhotoViewer
                    item={current}
                    prev={openIndex > 0 ? shown[openIndex - 1] : null}
                    next={shown[openIndex + 1] ?? null}
                    onNavigate={(item) => setOpenId(item.id)}
                    onClose={() => {
                        setOpenId(null);
                        setShowInfo(false);
                    }}
                    zoomSrc={current.urls.original}
                    onKey={(e) => {
                        const key = e.key.toLowerCase();
                        if (key === "i") setShowInfo((v) => !v);
                        if (isTrash) return;
                        if (key === "f") setFavorite([current.id], !current.isFavorite);
                        if (key === "e") setEditing(current);
                        if (e.key === "Delete") {
                            navigateAfterRemove(current);
                            moveToTrash([current.id]);
                        }
                    }}
                    sidePanel={showInfo && <InfoPanel key={current.id} item={current} onClose={() => setShowInfo(false)} onSaved={replaceItem} />}
                    actions={
                        isTrash ? (
                            <>
                                <button
                                    className="viewer-btn"
                                    title="Khôi phục"
                                    onClick={() => {
                                        navigateAfterRemove(current);
                                        restore([current.id]);
                                    }}
                                >
                                    <FaTrashRestore />
                                </button>
                                <button className="viewer-btn" title="Xoá vĩnh viễn" onClick={() => deleteForever([current.id])}>
                                    <FaTrash />
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="viewer-btn" title="Chỉnh sửa (E)" onClick={() => setEditing(current)}>
                                    <FaSlidersH />
                                </button>
                                <button
                                    className={`viewer-btn ${current.isFavorite ? "active" : ""}`}
                                    title="Yêu thích (F)"
                                    onClick={() => setFavorite([current.id], !current.isFavorite)}
                                >
                                    <FaStar />
                                </button>
                                <button className="viewer-btn" title="Thêm vào album" onClick={() => setPickerIds([current.id])}>
                                    <FaFolderPlus />
                                </button>
                                <button className="viewer-btn" title="Tải ảnh gốc" onClick={() => downloadFiles([current])}>
                                    <FaDownload />
                                </button>
                                {current.hasBackup && (
                                    <button className="viewer-btn" title="Khôi phục bản gốc" onClick={() => revert(current)}>
                                        <FaUndo />
                                    </button>
                                )}
                                <button
                                    className="viewer-btn"
                                    title="Chuyển vào thùng rác (Delete)"
                                    onClick={() => {
                                        navigateAfterRemove(current);
                                        moveToTrash([current.id]);
                                    }}
                                >
                                    <FaTrash />
                                </button>
                            </>
                        )
                    }
                />
            )}


            {editing && (
                <PhotoEditor
                    item={editing}
                    onClose={() => setEditing(null)}
                    onSaved={(saved, mode) => {
                        setEditing(null);
                        if (mode === "replace") replaceItem(saved);
                        else {
                            loadFirst();
                            setOpenId(saved.id);
                        }
                    }}
                />
            )}

            {pickerIds && (
                <AlbumPicker
                    mediaIds={pickerIds}
                    onClose={() => setPickerIds(null)}
                    onDone={() => {
                        setPickerIds(null);
                        setSelected(new Set());
                    }}
                />
            )}

        </div>
    );
}

export default Photos;
