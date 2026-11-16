import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { formatVND, formatVNDShort } from "../../../services/format";
import "./RevenueChart.css";

const HEIGHT = 260;
const PAD = { top: 16, right: 8, bottom: 28, left: 56 };
const MAX_BAR = 24;

function niceTicks(max) {
    if (max <= 0) return [0, 1e6, 2e6, 3e6, 4e6];
    const raw = max / 4;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
    return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
}

function periodLabel(period, granularity) {
    if (granularity === "month") {
        const [y, m] = period.split("-");
        return { short: `T${Number(m)}`, long: `Tháng ${Number(m)}/${y}` };
    }
    const [, m, d] = period.split("-");
    return { short: `${Number(d)}/${Number(m)}`, long: `Ngày ${Number(d)}/${Number(m)}` };
}

function columnPath(x, y, w, h, r) {
    if (h <= 0) return "";
    const rr = Math.min(r, h, w / 2);
    return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

function RevenueChart({ data, granularity, title }) {
    const wrapRef = useRef(null);
    const [width, setWidth] = useState(0);
    const [active, setActive] = useState(null);
    const [showTable, setShowTable] = useState(false);

    useLayoutEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        setWidth(el.clientWidth);
        const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
        observer.observe(el);
        return () => observer.disconnect();
    }, [showTable]);

    const ticks = useMemo(() => niceTicks(Math.max(...data.map((d) => d.revenue), 0)), [data]);
    const yMax = ticks.at(-1);
    const plotW = Math.max(0, width - PAD.left - PAD.right);
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    const band = data.length ? plotW / data.length : 0;
    const barW = Math.min(MAX_BAR, Math.max(2, band * 0.6));
    const y = (v) => PAD.top + plotH - (v / yMax) * plotH;
    const labelEvery = Math.max(1, Math.ceil(36 / Math.max(band, 1)));
    const total = data.reduce((sum, d) => sum + d.revenue, 0);
    const point = active !== null ? data[active] : null;

    return (
        <figure className="revenue-chart card">
            <div className="revenue-chart-header">
                <figcaption>
                    <strong>{title}</strong>
                    <small>Tổng {formatVND(total)} · chỉ tính đơn đã hoàn thành</small>
                </figcaption>
                <button className="btn btn-sm btn-ghost" onClick={() => setShowTable(!showTable)}>
                    {showTable ? "Xem biểu đồ" : "Xem dạng bảng"}
                </button>
            </div>

            {showTable ? (
                <div className="revenue-chart-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Kỳ</th>
                                <th>Doanh thu</th>
                                <th>Số đơn</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((d) => (
                                <tr key={d.period}>
                                    <td>{periodLabel(d.period, granularity).long}</td>
                                    <td>{formatVND(d.revenue)}</td>
                                    <td>{d.orders}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div ref={wrapRef} className="revenue-chart-plot" onMouseLeave={() => setActive(null)}>
                    {width > 0 && (
                        <svg width={width} height={HEIGHT} role="img" aria-label={`${title}. Tổng ${formatVND(total)}`}>
                            {ticks.map((t) => (
                                <g key={t}>
                                    <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className="chart-grid" />
                                    <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="chart-label">
                                        {formatVNDShort(t)}
                                    </text>
                                </g>
                            ))}

                            {data.map((d, i) => {
                                const cx = PAD.left + band * i + band / 2;
                                const h = (d.revenue / yMax) * plotH;
                                const label = periodLabel(d.period, granularity);
                                return (
                                    <g key={d.period}>
                                        {active === i && <rect x={PAD.left + band * i} y={PAD.top} width={band} height={plotH} className="chart-hover" />}
                                        <path
                                            d={columnPath(cx - barW / 2, y(d.revenue), barW, h, 4)}
                                            className={`chart-bar ${active !== null && active !== i ? "dim" : ""}`}
                                        />
                                        {(i % labelEvery === 0 || i === data.length - 1) && (
                                            <text x={cx} y={HEIGHT - 8} textAnchor="middle" className="chart-label">
                                                {label.short}
                                            </text>
                                        )}
                                        <rect
                                            x={PAD.left + band * i}
                                            y={PAD.top}
                                            width={band}
                                            height={plotH}
                                            fill="transparent"
                                            tabIndex={0}
                                            aria-label={`${label.long}: ${formatVND(d.revenue)}, ${d.orders} đơn`}
                                            onMouseEnter={() => setActive(i)}
                                            onFocus={() => setActive(i)}
                                            onBlur={() => setActive(null)}
                                        />
                                    </g>
                                );
                            })}
                            <line x1={PAD.left} x2={width - PAD.right} y1={y(0)} y2={y(0)} className="chart-baseline" />
                        </svg>
                    )}

                    {point && (
                        <div
                            className="chart-tooltip"
                            style={{
                                left: Math.min(Math.max(PAD.left + band * active + band / 2, 70), width - 70),
                                top: Math.max(0, y(point.revenue) - 70),
                            }}
                        >
                            <strong>{periodLabel(point.period, granularity).long}</strong>
                            <span>
                                <i className="chart-swatch" /> {formatVND(point.revenue)}
                            </span>
                            <small>{point.orders} đơn hoàn thành</small>
                        </div>
                    )}
                </div>
            )}
        </figure>
    );
}

export default RevenueChart;
