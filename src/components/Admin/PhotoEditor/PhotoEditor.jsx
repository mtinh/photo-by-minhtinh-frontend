import { useEffect, useId, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import { FaRedo, FaUndo, FaTimes } from "react-icons/fa";
import { MdFlip, MdRotateLeft, MdRotateRight } from "react-icons/md";
import mediaService from "../../../services/mediaService";
import { getErrorMessage } from "../../../services/api";
import { useToast } from "../../../context/ToastContext";
import "./PhotoEditor.css";

const IDENTITY = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

function multiply(a, b) {
    const out = new Array(20).fill(0);
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 5; c++) {
            let v = c === 4 ? a[r * 5 + 4] : 0;
            for (let k = 0; k < 4; k++) v += a[r * 5 + k] * b[k * 5 + c];
            out[r * 5 + c] = v;
        }
    }
    return out;
}

const compose = (...matrices) => matrices.reduce((acc, m) => multiply(m, acc), IDENTITY);
const brightness = (b) => [b, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, 1, 0];
const contrast = (c) => {
    const o = 0.5 - 0.5 * c;
    return [c, 0, 0, 0, o, 0, c, 0, 0, o, 0, 0, c, 0, o, 0, 0, 0, 1, 0];
};
const saturate = (s) => [
    0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s, 0, 0,
    0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s, 0, 0,
    0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s, 0, 0,
    0, 0, 0, 1, 0,
];
const sepia = (amount) => {
    const a = 1 - amount;
    return [
        0.393 + 0.607 * a, 0.769 - 0.769 * a, 0.189 - 0.189 * a, 0, 0,
        0.349 - 0.349 * a, 0.686 + 0.314 * a, 0.168 - 0.168 * a, 0, 0,
        0.272 - 0.272 * a, 0.534 - 0.534 * a, 0.131 + 0.869 * a, 0, 0,
        0, 0, 0, 1, 0,
    ];
};
const warmth = (w) => [1 + 0.12 * w, 0, 0, 0, 0.03 * w, 0, 1 + 0.02 * w, 0, 0, 0, 0, 0, 1 - 0.12 * w, 0, -0.03 * w, 0, 0, 0, 1, 0];
const fade = (f) => {
    const k = 1 - 0.18 * f;
    const o = 0.09 * f;
    return [k, 0, 0, 0, o, 0, k, 0, 0, o, 0, 0, k, 0, o, 0, 0, 0, 1, 0];
};

const PRESETS = {
    none: { label: "Gốc", matrix: IDENTITY },
    vivid: { label: "Rực rỡ", matrix: compose(saturate(1.35), contrast(1.1)) },
    warm: { label: "Ấm", matrix: compose(warmth(0.7), saturate(1.1)) },
    cool: { label: "Lạnh", matrix: compose(warmth(-0.7), brightness(1.03)) },
    mono: { label: "Đen trắng", matrix: compose(saturate(0), contrast(1.15)) },
    vintage: { label: "Cổ điển", matrix: compose(sepia(0.55), fade(0.6), contrast(0.95)) },
    fade: { label: "Phai", matrix: compose(fade(1), saturate(0.8)) },
    drama: { label: "Kịch tính", matrix: compose(contrast(1.35), saturate(0.85), brightness(0.95)) },
};

const ADJUSTMENTS = [
    ["brightness", "Độ sáng"],
    ["contrast", "Tương phản"],
    ["saturation", "Độ bão hoà"],
    ["warmth", "Nhiệt độ màu"],
];

const ASPECTS = [
    ["Tự do", null],
    ["Gốc", "original"],
    ["1:1", 1],
    ["4:3", 4 / 3],
    ["3:4", 3 / 4],
    ["16:9", 16 / 9],
    ["9:16", 9 / 16],
];

const FULL = { x: 0, y: 0, w: 1, h: 1 };
const INITIAL = { turns: 0, flipH: false, flipV: false, crop: FULL, aspect: null, preset: "none", adjust: { brightness: 0, contrast: 0, saturation: 0, warmth: 0 } };

const buildMatrix = (s) =>
    compose(
        PRESETS[s.preset].matrix,
        brightness(1 + (s.adjust.brightness / 100) * 0.6),
        contrast(1 + (s.adjust.contrast / 100) * 0.6),
        saturate(1 + s.adjust.saturation / 100),
        warmth(s.adjust.warmth / 100)
    );

const isPristine = (s) =>
    s.turns === 0 && !s.flipH && !s.flipV && s.crop.w === 1 && s.crop.h === 1 && s.preset === "none" && Object.values(s.adjust).every((v) => v === 0);

function historyReducer(h, action) {
    switch (action.type) {
        case "apply":
            return { past: [...h.past, h.base ?? h.present].slice(-50), present: { ...h.present, ...action.patch }, future: [], base: null };
        case "live":
            return { ...h, present: { ...h.present, ...action.patch }, base: h.base ?? h.present };
        case "commit":
            if (!h.base) return h;
            return { past: [...h.past, h.base].slice(-50), present: h.present, future: [], base: null };
        case "undo":
            if (!h.past.length) return h;
            return { past: h.past.slice(0, -1), present: h.past.at(-1), future: [h.present, ...h.future], base: null };
        case "redo":
            if (!h.future.length) return h;
            return { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1), base: null };
        case "reset":
            return { past: [...h.past, h.present], present: INITIAL, future: [], base: null };
        default:
            return h;
    }
}

function fitAspect(ratio, imageAspect) {
    if (!ratio) return FULL;
    const n = ratio / imageAspect;
    const w = n >= 1 ? 1 : n;
    const h = n >= 1 ? 1 / n : 1;
    return { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
}

function drawPreview(canvas, img, s, crop, maxSide) {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const rotW = s.turns % 2 ? h : w;
    const rotH = s.turns % 2 ? w : h;
    const c = crop ? s.crop : FULL;
    const outW = rotW * c.w;
    const outH = rotH * c.h;
    const scale = Math.min(1, maxSide / Math.max(outW, outH));
    canvas.width = Math.max(1, Math.round(outW * scale));
    canvas.height = Math.max(1, Math.round(outH * scale));
    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.translate(-c.x * rotW, -c.y * rotH);
    ctx.translate(rotW / 2, rotH / 2);
    ctx.scale(s.flipH ? -1 : 1, s.flipV ? -1 : 1);
    ctx.rotate((s.turns * Math.PI) / 2);
    ctx.drawImage(img, -w / 2, -h / 2);
}

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

function resizeRect(start, handle, dx, dy, aspect) {
    if (handle === "move") return { ...start, x: clamp(start.x + dx, 0, 1 - start.w), y: clamp(start.y + dy, 0, 1 - start.h) };
    let { x, y, w, h } = start;
    const right = x + w;
    const bottom = y + h;
    if (handle.includes("e")) w = clamp(w + dx, 0.05, 1 - x);
    if (handle.includes("w")) {
        const nx = clamp(x + dx, 0, right - 0.05);
        w = right - nx;
        x = nx;
    }
    if (handle.includes("s")) h = clamp(h + dy, 0.05, 1 - y);
    if (handle.includes("n")) {
        const ny = clamp(y + dy, 0, bottom - 0.05);
        h = bottom - ny;
        y = ny;
    }
    if (aspect) {
        h = w / aspect;
        const maxH = handle.includes("n") ? bottom : 1 - y;
        if (h > maxH) {
            h = maxH;
            w = h * aspect;
            if (handle.includes("w")) x = right - w;
        }
        if (handle.includes("n")) y = bottom - h;
    }
    return { x, y, w, h };
}

function CropBox({ rect, aspect, onChange, onCommit }) {
    const overlayRef = useRef(null);
    const drag = useRef(null);
    const handles = aspect ? ["nw", "ne", "sw", "se"] : ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

    const begin = (handle, e) => {
        e.preventDefault();
        e.stopPropagation();
        e.target.setPointerCapture(e.pointerId);
        drag.current = { handle, x: e.clientX, y: e.clientY, start: rect };
    };

    return (
        <div
            ref={overlayRef}
            className="crop-overlay"
            onPointerMove={(e) => {
                const d = drag.current;
                const box = overlayRef.current?.getBoundingClientRect();
                if (!d || !box) return;
                onChange(resizeRect(d.start, d.handle, (e.clientX - d.x) / box.width, (e.clientY - d.y) / box.height, aspect));
            }}
            onPointerUp={() => {
                if (drag.current) onCommit();
                drag.current = null;
            }}
        >
            <div
                className="crop-box"
                tabIndex={0}
                aria-label="Vùng cắt — dùng phím mũi tên để di chuyển"
                onPointerDown={(e) => begin("move", e)}
                onKeyDown={(e) => {
                    const step = { ArrowLeft: [-0.01, 0], ArrowRight: [0.01, 0], ArrowUp: [0, -0.01], ArrowDown: [0, 0.01] }[e.key];
                    if (!step) return;
                    e.preventDefault();
                    onChange(resizeRect(rect, e.shiftKey ? "se" : "move", step[0], step[1], aspect));
                    onCommit();
                }}
                style={{ left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.w * 100}%`, height: `${rect.h * 100}%` }}
            >
                <span className="crop-grid" />
                {handles.map((h) => (
                    <span key={h} className={`crop-handle crop-${h}`} onPointerDown={(e) => begin(h, e)} />
                ))}
            </div>
        </div>
    );
}

function PhotoEditor({ item, onClose, onSaved }) {
    const toast = useToast();
    const filterId = useId().replace(/:/g, "");
    const [history, dispatch] = useReducer(historyReducer, { past: [], present: INITIAL, future: [], base: null });
    const s = history.present;
    const [tab, setTab] = useState("filters");
    const [image, setImage] = useState(null);
    const [saving, setSaving] = useState("");
    const stageRef = useRef(null);
    const canvasRef = useRef(null);
    const [stage, setStage] = useState({ w: 0, h: 0 });

    useEffect(() => {
        const img = new Image();
        img.onload = () => setImage(img);
        img.onerror = () => toast.error("Không tải được ảnh để chỉnh sửa");
        img.src = item.urls.preview;
    }, [item.urls.preview, toast]);

    useLayoutEffect(() => {
        const el = stageRef.current;
        if (!el) return;
        const observer = new ResizeObserver(() => setStage({ w: el.clientWidth, h: el.clientHeight }));
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const cropping = tab === "crop";
    const rotW = image ? (s.turns % 2 ? image.naturalHeight : image.naturalWidth) : 1;
    const rotH = image ? (s.turns % 2 ? image.naturalWidth : image.naturalHeight) : 1;
    const imageAspect = rotW / rotH;
    const shownW = cropping ? rotW : rotW * s.crop.w;
    const shownH = cropping ? rotH : rotH * s.crop.h;
    const fit = Math.min((stage.w - 32) / shownW, (stage.h - 32) / shownH, 1.5);
    const displayW = Math.max(1, Math.floor(shownW * fit));
    const displayH = Math.max(1, Math.floor(shownH * fit));

    useEffect(() => {
        if (image && canvasRef.current && stage.w) drawPreview(canvasRef.current, image, s, !cropping, Math.max(displayW, displayH) * devicePixelRatio);
    }, [image, s, cropping, displayW, displayH, stage.w]);

    const matrix = useMemo(() => buildMatrix(s), [s]);
    const dirty = !isPristine(s);

    useEffect(() => {
        const onKey = (e) => {
            if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
            e.preventDefault();
            dispatch({ type: e.shiftKey ? "redo" : "undo" });
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    const close = () => {
        if (saving) return;
        if (dirty && !window.confirm("Huỷ các thay đổi chưa lưu?")) return;
        onClose();
    };

    const save = async (mode) => {
        setSaving(mode);
        try {
            const res = await mediaService.editMedia(item.id, mode, { turns: s.turns, flipH: s.flipH, flipV: s.flipV, crop: s.crop, matrix });
            toast.success(mode === "replace" ? "Đã lưu thay đổi (vẫn giữ ảnh gốc)" : "Đã lưu bản sao");
            onSaved(res.data, mode);
        } catch (err) {
            toast.error(getErrorMessage(err, "Không lưu được ảnh"));
        } finally {
            setSaving("");
        }
    };

    const rotate = (delta) => dispatch({ type: "apply", patch: { turns: (s.turns + delta + 4) % 4, crop: FULL, aspect: null } });

    return (
        <div className="photo-editor" role="dialog" aria-modal="true" aria-label={`Chỉnh sửa ${item.filename}`}>
            <svg className="photo-editor-filters" aria-hidden>
                <filter id={`${filterId}-live`} colorInterpolationFilters="sRGB">
                    <feColorMatrix type="matrix" values={matrix.map((v) => v.toFixed(5)).join(" ")} />
                </filter>
                {Object.entries(PRESETS).map(([key, preset]) => (
                    <filter key={key} id={`${filterId}-${key}`} colorInterpolationFilters="sRGB">
                        <feColorMatrix type="matrix" values={preset.matrix.map((v) => v.toFixed(5)).join(" ")} />
                    </filter>
                ))}
            </svg>

            <header className="photo-editor-header">
                <button className="viewer-btn" onClick={close} aria-label="Đóng">
                    <FaTimes />
                </button>
                <button className="viewer-btn" onClick={() => dispatch({ type: "undo" })} disabled={!history.past.length} title="Hoàn tác (Ctrl+Z)">
                    <FaUndo />
                </button>
                <button className="viewer-btn" onClick={() => dispatch({ type: "redo" })} disabled={!history.future.length} title="Làm lại (Ctrl+Shift+Z)">
                    <FaRedo />
                </button>
                <div className="photo-editor-spacer" />
                <button className="btn btn-sm btn-ghost photo-editor-reset" disabled={!dirty || !!saving} onClick={() => dispatch({ type: "reset" })}>
                    Đặt lại
                </button>
                <button className="btn btn-sm btn-outline photo-editor-copy" disabled={!dirty || !!saving} onClick={() => save("copy")}>
                    {saving === "copy" ? "Đang lưu..." : "Lưu bản sao"}
                </button>
                <button className="btn btn-sm" disabled={!dirty || !!saving} onClick={() => save("replace")}>
                    {saving === "replace" ? "Đang lưu..." : "Lưu"}
                </button>
            </header>

            <div className="photo-editor-body">
                <div ref={stageRef} className="photo-editor-stage">
                    {!image ? (
                        <span className="spinner" />
                    ) : (
                        <div className="photo-editor-canvas" style={{ width: displayW, height: displayH }}>
                            <canvas ref={canvasRef} style={{ filter: `url(#${filterId}-live)` }} />
                            {cropping && (
                                <CropBox
                                    rect={s.crop}
                                    aspect={s.aspect ? s.aspect / imageAspect : null}
                                    onChange={(crop) => dispatch({ type: "live", patch: { crop } })}
                                    onCommit={() => dispatch({ type: "commit" })}
                                />
                            )}
                        </div>
                    )}
                    {saving && (
                        <div className="photo-editor-saving">
                            <span className="spinner" />
                            <p>Đang xử lý ảnh ở độ phân giải gốc...</p>
                        </div>
                    )}
                </div>

                <aside className="photo-editor-panel">
                    <div className="photo-editor-tabs">
                        {[
                            ["filters", "Bộ lọc"],
                            ["adjust", "Điều chỉnh"],
                            ["crop", "Cắt & xoay"],
                        ].map(([key, label]) => (
                            <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {tab === "filters" && (
                        <div className="photo-editor-presets">
                            {Object.entries(PRESETS).map(([key, preset]) => (
                                <button key={key} className={s.preset === key ? "active" : ""} onClick={() => dispatch({ type: "apply", patch: { preset: key } })}>
                                    <img src={item.urls.thumb} alt="" style={{ filter: `url(#${filterId}-${key})` }} />
                                    <span>{preset.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {tab === "adjust" && (
                        <div className="photo-editor-sliders">
                            {ADJUSTMENTS.map(([key, label]) => (
                                <label key={key}>
                                    <span>
                                        {label}
                                        <output>{s.adjust[key] > 0 ? `+${s.adjust[key]}` : s.adjust[key]}</output>
                                    </span>
                                    <input
                                        type="range"
                                        min="-100"
                                        max="100"
                                        value={s.adjust[key]}
                                        onChange={(e) => dispatch({ type: "live", patch: { adjust: { ...s.adjust, [key]: Number(e.target.value) } } })}
                                        onPointerUp={() => dispatch({ type: "commit" })}
                                        onKeyUp={() => dispatch({ type: "commit" })}
                                    />
                                </label>
                            ))}
                        </div>
                    )}

                    {tab === "crop" && (
                        <div className="photo-editor-crop">
                            <div className="photo-editor-tools">
                                <button className="viewer-btn" onClick={() => rotate(-1)} title="Xoay trái">
                                    <MdRotateLeft />
                                </button>
                                <button className="viewer-btn" onClick={() => rotate(1)} title="Xoay phải">
                                    <MdRotateRight />
                                </button>
                                <button
                                    className={`viewer-btn ${s.flipH ? "active" : ""}`}
                                    onClick={() => dispatch({ type: "apply", patch: { flipH: !s.flipH, crop: FULL } })}
                                    title="Lật ngang"
                                >
                                    <MdFlip />
                                </button>
                                <button
                                    className={`viewer-btn ${s.flipV ? "active" : ""}`}
                                    onClick={() => dispatch({ type: "apply", patch: { flipV: !s.flipV, crop: FULL } })}
                                    title="Lật dọc"
                                >
                                    <MdFlip style={{ transform: "rotate(90deg)" }} />
                                </button>
                            </div>
                            <p>Tỉ lệ khung hình</p>
                            <div className="photo-editor-aspects">
                                {ASPECTS.map(([label, value]) => {
                                    const ratio = value === "original" ? imageAspect : value;
                                    return (
                                        <button
                                            key={label}
                                            className={s.aspect === ratio ? "active" : ""}
                                            onClick={() => dispatch({ type: "apply", patch: { aspect: ratio, crop: fitAspect(ratio, imageAspect) } })}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}

export default PhotoEditor;
