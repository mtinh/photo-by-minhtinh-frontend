import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FaCheck, FaHeart, FaStar } from "react-icons/fa";
import "./PhotoGrid.css";

const GAP = 4;

const dayKey = (iso) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

function dayLabel(iso) {
    const d = new Date(iso);
    const today = new Date();
    const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diff = Math.round((start(today) - start(d)) / 86400000);
    if (diff === 0) return "Hôm nay";
    if (diff === 1) return "Hôm qua";
    return d.toLocaleDateString("vi-VN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: d.getFullYear() === today.getFullYear() ? undefined : "numeric",
    });
}

const rowHeightFor = (width) => (width < 480 ? 110 : width < 768 ? 150 : width < 1280 ? 200 : 240);

function buildRows(items, width, groupByDay) {
    if (width <= 0) return [];
    const target = rowHeightFor(width);
    const groups = [];
    items.forEach((item, index) => {
        const key = groupByDay ? dayKey(item.takenAt) : "all";
        const last = groups.at(-1);
        if (last && last.key === key) last.items.push({ item, index });
        else groups.push({ key, label: dayLabel(item.takenAt), items: [{ item, index }] });
    });

    return groups.map((group) => {
        const rows = [];
        let pending = [];
        let sum = 0;
        const flush = (isLast) => {
            if (!pending.length) return;
            let height = (width - GAP * (pending.length - 1)) / sum;
            if (isLast && height > target * 1.25) height = target;
            height = Math.round(height);
            rows.push(pending.map((p) => ({ ...p, width: Math.max(1, Math.floor(p.ratio * height)), height })));
            pending = [];
            sum = 0;
        };
        group.items.forEach((entry) => {
            const ratio = Math.min(Math.max(entry.item.width / entry.item.height || 1, 0.5), 3);
            pending.push({ ...entry, ratio });
            sum += ratio;
            if ((width - GAP * (pending.length - 1)) / sum <= target) flush(false);
        });
        flush(true);
        return { ...group, ids: group.items.map((e) => e.item.id), rows };
    });
}

function PhotoTile({ entry, selected, selectionMode, selectable, favoriteIcon, onOpen, onToggle }) {
    const { item, index, width, height } = entry;
    const [loaded, setLoaded] = useState(false);

    const handleClick = (e) => {
        if (selectable && (selectionMode || e.shiftKey || e.metaKey || e.ctrlKey)) onToggle(item, index, e.shiftKey);
        else onOpen?.(item, index);
    };

    return (
        <div className={`photo-tile ${selected ? "selected" : ""}`} style={{ width, height }}>
            <button className="photo-tile-button" onClick={handleClick} aria-label={item.filename}>
                <img
                    src={item.urls.thumb}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    onLoad={() => setLoaded(true)}
                    className={loaded ? "loaded" : ""}
                />
            </button>

            {selectable && (
                <button
                    className={`photo-tile-check ${selectionMode ? "visible" : ""}`}
                    role="checkbox"
                    aria-checked={selected}
                    aria-label={`Chọn ${item.filename}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle(item, index, e.shiftKey);
                    }}
                >
                    <FaCheck />
                </button>
            )}

            {item.isFavorite && !selected && (
                <span className="photo-tile-favorite">{favoriteIcon === "heart" ? <FaHeart /> : <FaStar />}</span>
            )}
        </div>
    );
}

function PhotoGrid({
    items,
    groupByDay = true,
    selectable = false,
    selectedIds = new Set(),
    onToggle,
    onToggleMany,
    onOpen,
    hasMore = false,
    loadingMore = false,
    onLoadMore,
    favoriteIcon = "star",
}) {
    const containerRef = useRef(null);
    const sentinelRef = useRef(null);
    const [width, setWidth] = useState(0);

    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        setWidth(el.clientWidth);
        const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || !hasMore) return;
        const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && !loadingMore && onLoadMore?.(), { rootMargin: "800px" });
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, loadingMore, onLoadMore]);

    const groups = useMemo(() => buildRows(items, width, groupByDay), [items, width, groupByDay]);
    const selectionMode = selectedIds.size > 0;

    return (
        <div ref={containerRef} className="photo-grid">
            {groups.map((group) => {
                const allSelected = selectable && group.ids.every((id) => selectedIds.has(id));
                return (
                    <section key={group.key} className="photo-group">
                        {groupByDay && (
                            <div className="photo-group-header">
                                {selectable && (
                                    <button
                                        className={`photo-group-check ${allSelected ? "checked" : ""} ${selectionMode ? "visible" : ""}`}
                                        role="checkbox"
                                        aria-checked={allSelected}
                                        aria-label={`Chọn tất cả ảnh ${group.label}`}
                                        onClick={() => onToggleMany?.(group.ids, !allSelected)}
                                    >
                                        <FaCheck />
                                    </button>
                                )}
                                <h3>{group.label}</h3>
                            </div>
                        )}
                        {group.rows.map((row) => (
                            <div key={row[0].item.id} className="photo-row">
                                {row.map((entry) => (
                                    <PhotoTile
                                        key={entry.item.id}
                                        entry={entry}
                                        selected={selectedIds.has(entry.item.id)}
                                        selectionMode={selectionMode}
                                        selectable={selectable}
                                        favoriteIcon={favoriteIcon}
                                        onOpen={onOpen}
                                        onToggle={onToggle}
                                    />
                                ))}
                            </div>
                        ))}
                    </section>
                );
            })}
            <div ref={sentinelRef} />
            {loadingMore && (
                <div className="state-box">
                    <span className="spinner" />
                </div>
            )}
        </div>
    );
}

export default PhotoGrid;
