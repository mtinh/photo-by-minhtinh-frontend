import "./Pagination.css";

function pageList(page, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [...new Set([1, total, page - 1, page, page + 1])].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const result = [];
    pages.forEach((p, i) => {
        if (i > 0 && p - pages[i - 1] > 1) result.push("...");
        result.push(p);
    });
    return result;
}

function Pagination({ meta, onChange }) {
    if (!meta || meta.totalPages <= 1) {
        return meta?.total ? <p className="pagination-info">Tổng: {meta.total}</p> : null;
    }

    const { page, totalPages, total, limit } = meta;
    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);

    return (
        <div className="pagination">
            <span className="pagination-info">
                {from}–{to} / {total}
            </span>

            <div className="pagination-pages">
                <button disabled={page === 1} onClick={() => onChange(page - 1)}>
                    Trước
                </button>

                {pageList(page, totalPages).map((p, i) =>
                    p === "..." ? (
                        <span key={`dots-${i}`} className="pagination-dots">
                            ...
                        </span>
                    ) : (
                        <button key={p} className={p === page ? "active" : ""} onClick={() => onChange(p)} aria-current={p === page ? "page" : undefined}>
                            {p}
                        </button>
                    )
                )}

                <button disabled={page === totalPages} onClick={() => onChange(page + 1)}>
                    Sau
                </button>
            </div>
        </div>
    );
}

export default Pagination;
