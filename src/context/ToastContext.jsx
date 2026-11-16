import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from "react-icons/fa";

const ToastContext = createContext();

const ICONS = {
    success: <FaCheckCircle />,
    error: <FaExclamationCircle />,
    info: <FaInfoCircle />,
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

    const show = useCallback(
        (type, message, action) => {
            const id = crypto.randomUUID();
            setToasts((list) => [...list.slice(-3), { id, type, message, action }]);
            setTimeout(() => dismiss(id), action ? 7000 : 4000);
        },
        [dismiss]
    );

    const toast = useMemo(
        () => ({
            success: (message, action) => show("success", message, action),
            error: (message) => show("error", message),
            info: (message, action) => show("info", message, action),
        }),
        [show]
    );

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="toast-container" aria-live="polite">
                {toasts.map((t) => (
                    <div key={t.id} className={`toast toast-${t.type}`} role={t.type === "error" ? "alert" : "status"}>
                        <span className="toast-icon">{ICONS[t.type]}</span>
                        <span className="toast-message">{t.message}</span>
                        {t.action && (
                            <button
                                className="toast-action"
                                onClick={() => {
                                    t.action.onClick();
                                    dismiss(t.id);
                                }}
                            >
                                {t.action.label}
                            </button>
                        )}
                        <button className="toast-close" aria-label="Đóng" onClick={() => dismiss(t.id)}>
                            <FaTimes />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
