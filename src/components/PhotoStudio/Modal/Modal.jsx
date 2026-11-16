import { useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import "./Modal.css";

function Modal({ open, title, onClose, children, footer, size = "md" }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-label={title}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="icon-btn" onClick={onClose} aria-label="Đóng">
                        <FaTimes />
                    </button>
                </div>
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

export default Modal;
