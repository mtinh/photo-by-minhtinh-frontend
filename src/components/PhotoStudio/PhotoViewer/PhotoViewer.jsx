import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FaArrowLeft, FaChevronLeft, FaChevronRight, FaSearchMinus, FaSearchPlus } from "react-icons/fa";
import "./PhotoViewer.css";

function ZoomView({ src, alt, onExit }) {
    const ref = useRef(null);
    const drag = useRef(null);
    const [loaded, setLoaded] = useState(false);

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el || !loaded) return;
        el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
        el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
    }, [loaded]);

    return (
        <div
            ref={ref}
            className="viewer-zoom"
            onMouseDown={(e) => {
                drag.current = { x: e.clientX, y: e.clientY, left: ref.current.scrollLeft, top: ref.current.scrollTop, moved: false };
            }}
            onMouseMove={(e) => {
                const d = drag.current;
                if (!d) return;
                if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 4) d.moved = true;
                ref.current.scrollLeft = d.left - (e.clientX - d.x);
                ref.current.scrollTop = d.top - (e.clientY - d.y);
            }}
            onMouseUp={() => {
                const moved = drag.current?.moved;
                drag.current = null;
                if (moved === false) onExit();
            }}
        >
            {!loaded && <span className="spinner viewer-spinner" />}
            <div className="viewer-zoom-inner">
                <img src={src} alt={alt} draggable={false} onLoad={() => setLoaded(true)} />
            </div>
        </div>
    );
}

function PhotoViewer({ item, prev, next, onNavigate, onClose, actions, sidePanel, zoomSrc, onKey }) {
    const [loadedSrc, setLoadedSrc] = useState(null);
    const [zoomId, setZoomId] = useState(null);
    const touch = useRef(null);
    const [dx, setDx] = useState(0);

    const zoom = zoomId === item.id;
    const setZoom = (value) => setZoomId((current) => ((typeof value === "function" ? value(current === item.id) : value) ? item.id : null));

    useEffect(() => {
        const handler = (e) => {
            if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
            if (e.key === "Escape") return zoom ? setZoomId(null) : onClose();
            if (e.key === "ArrowLeft" && prev && !zoom) return onNavigate(prev);
            if (e.key === "ArrowRight" && next && !zoom) return onNavigate(next);
            if (e.key.toLowerCase() === "z" && zoomSrc) return setZoomId(zoom ? null : item.id);
            onKey?.(e);
        };
        document.addEventListener("keydown", handler);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handler);
            document.body.style.overflow = "";
        };
    }, [prev, next, zoom, zoomSrc, onClose, onNavigate, onKey, item.id]);

    useEffect(() => {
        [prev, next].forEach((n) => {
            if (n) new Image().src = n.urls.preview;
        });
    }, [prev, next]);

    const loaded = loadedSrc === item.urls.preview;

    return (
        <div className="viewer" role="dialog" aria-modal="true" aria-label={item.filename}>
            <div className="viewer-stage-wrap">
                {zoom && zoomSrc ? (
                    <ZoomView src={zoomSrc} alt={item.filename} onExit={() => setZoom(false)} />
                ) : (
                    <div
                        className="viewer-stage"
                        onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
                        onTouchMove={(e) => {
                            if (!touch.current) return;
                            const moveX = e.touches[0].clientX - touch.current.x;
                            if (Math.abs(moveX) > Math.abs(e.touches[0].clientY - touch.current.y)) setDx(moveX);
                        }}
                        onTouchEnd={() => {
                            if (dx < -60 && next) onNavigate(next);
                            if (dx > 60 && prev) onNavigate(prev);
                            touch.current = null;
                            setDx(0);
                        }}
                    >
                        <div className="viewer-image" style={{ transform: dx ? `translateX(${dx}px)` : undefined }}>
                            {!loaded && <img src={item.urls.thumb} alt="" className="viewer-placeholder" />}
                            <img
                                key={item.urls.preview}
                                src={item.urls.preview}
                                alt={item.description || item.filename}
                                draggable={false}
                                onLoad={() => setLoadedSrc(item.urls.preview)}
                                onDoubleClick={() => zoomSrc && setZoom(true)}
                                className={loaded ? "viewer-main loaded" : "viewer-main"}
                            />
                            {!loaded && <span className="spinner viewer-spinner" />}
                        </div>
                    </div>
                )}

                <div className="viewer-topbar">
                    <button className="viewer-btn" onClick={onClose} title="Quay lại (Esc)" aria-label="Quay lại">
                        <FaArrowLeft />
                    </button>
                    <span className="viewer-title">{item.filename}</span>
                    {zoomSrc && (
                        <button className="viewer-btn" onClick={() => setZoom((z) => !z)} title="Xem ảnh gốc 100% (Z)" aria-label="Phóng to">
                            {zoom ? <FaSearchMinus /> : <FaSearchPlus />}
                        </button>
                    )}
                    {actions}
                </div>

                {!zoom && prev && (
                    <button className="viewer-nav viewer-prev" onClick={() => onNavigate(prev)} aria-label="Ảnh trước">
                        <FaChevronLeft />
                    </button>
                )}
                {!zoom && next && (
                    <button className="viewer-nav viewer-next" onClick={() => onNavigate(next)} aria-label="Ảnh tiếp">
                        <FaChevronRight />
                    </button>
                )}
            </div>

            {sidePanel && <aside className="viewer-side">{sidePanel}</aside>}
        </div>
    );
}

export default PhotoViewer;
