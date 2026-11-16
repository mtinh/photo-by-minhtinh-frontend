import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaChevronDown, FaChevronUp, FaRedo, FaTimes, FaTimesCircle } from "react-icons/fa";
import { useUpload } from "../../../context/UploadContext";
import { formatBytes } from "../../../services/format";
import "./UploadPanel.css";

function UploadRow({ task, onCancel, onRetry }) {
    const preview = useMemo(() => URL.createObjectURL(task.file), [task.file]);

    useEffect(() => () => URL.revokeObjectURL(preview), [preview]);

    const statusText = {
        queued: "Đang chờ...",
        uploading: `${Math.round(task.progress * 100)}% · ${formatBytes(task.file.size)}`,
        done: formatBytes(task.file.size),
        error: task.error,
        canceled: "Đã huỷ",
    }[task.status];

    return (
        <li className="upload-row">
            <img src={preview} alt="" loading="lazy" />
            <div className="upload-row-info">
                <p>{task.file.name}</p>
                <small className={task.status === "error" ? "error" : ""}>{statusText}</small>
                {task.status === "uploading" && (
                    <div className="upload-row-bar">
                        <div style={{ width: `${task.progress * 100}%` }} />
                    </div>
                )}
            </div>
            {task.status === "done" && <FaCheckCircle className="upload-ok" />}
            {task.status === "error" && (
                <>
                    <FaTimesCircle className="upload-fail" />
                    <button className="icon-btn" onClick={onRetry} title="Thử lại">
                        <FaRedo />
                    </button>
                </>
            )}
            {(task.status === "queued" || task.status === "uploading") && (
                <button className="icon-btn" onClick={onCancel} title="Huỷ">
                    <FaTimes />
                </button>
            )}
        </li>
    );
}

function UploadPanel() {
    const { tasks, cancel, retry, clearFinished } = useUpload();
    const [collapsed, setCollapsed] = useState(false);

    if (tasks.length === 0) return null;

    const active = tasks.filter((t) => t.status === "queued" || t.status === "uploading").length;
    const done = tasks.filter((t) => t.status === "done").length;
    const failed = tasks.filter((t) => t.status === "error").length;
    const totalBytes = tasks.reduce((sum, t) => sum + t.file.size, 0) || 1;
    const sentBytes = tasks.reduce((sum, t) => sum + t.file.size * (t.status === "done" ? 1 : t.progress), 0);

    const title = active > 0 ? `Đang tải lên ${tasks.length - active}/${tasks.length}` : failed > 0 ? `Đã tải ${done}, lỗi ${failed}` : `Đã tải lên ${done} ảnh`;

    return (
        <section className="upload-panel" aria-live="polite">
            <header>
                <strong>{title}</strong>
                <button className="icon-btn" onClick={() => setCollapsed(!collapsed)} aria-label="Thu gọn">
                    {collapsed ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {active === 0 && (
                    <button className="icon-btn" onClick={clearFinished} aria-label="Đóng">
                        <FaTimes />
                    </button>
                )}
            </header>
            {active > 0 && (
                <div className="upload-total">
                    <div style={{ width: `${(sentBytes / totalBytes) * 100}%` }} />
                </div>
            )}
            {!collapsed && (
                <ul>
                    {tasks.map((task) => (
                        <UploadRow key={task.id} task={task} onCancel={() => cancel(task.id)} onRetry={() => retry(task.id)} />
                    ))}
                </ul>
            )}
        </section>
    );
}

export default UploadPanel;
