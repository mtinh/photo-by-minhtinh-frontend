import { useEffect, useRef, useState } from "react";
import { FaCommentDots, FaPaperPlane, FaRobot, FaTimes } from "react-icons/fa";
import chatService from "../../../services/chatService";
import "./ChatBot.css";

const GREETING = {
    role: "assistant",
    content: "Xin chào! Mình là trợ lý của Photos by MinhTinh. Mình có thể tư vấn gói chụp, sản phẩm in và giải đáp chính sách đổi trả. Bạn cần gì ạ?",
};

const SUGGESTIONS = ["Tư vấn gói chụp cưới dưới 10 triệu", "Chính sách đổi trả, hoàn tiền?", "Khi nào tôi nhận được ảnh gốc?"];

function ChatBot() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState(() => JSON.parse(sessionStorage.getItem("chatHistory") ?? "[]"));
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const listRef = useRef(null);
    const abortRef = useRef(null);

    useEffect(() => {
        sessionStorage.setItem("chatHistory", JSON.stringify(messages.slice(-20)));
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    useEffect(() => () => abortRef.current?.abort(), []);

    const send = async (text) => {
        const content = text.trim();
        if (!content || busy) return;
        const history = [...messages, { role: "user", content }];
        setMessages([...history, { role: "assistant", content: "" }]);
        setInput("");
        setBusy(true);
        abortRef.current = new AbortController();
        try {
            await chatService.sendMessage(
                history.slice(-12),
                (delta) =>
                    setMessages((list) => {
                        const copy = [...list];
                        copy[copy.length - 1] = { ...copy[copy.length - 1], content: copy[copy.length - 1].content + delta };
                        return copy;
                    }),
                abortRef.current.signal
            );
        } catch (err) {
            if (err.name !== "AbortError") {
                setMessages((list) => [...list.slice(0, -1), { role: "assistant", content: `⚠️ ${err.message}` }]);
            }
        } finally {
            setBusy(false);
        }
    };

    if (!open) {
        return (
            <button className="chatbot-launcher" onClick={() => setOpen(true)} aria-label="Mở trợ lý tư vấn">
                <FaCommentDots />
            </button>
        );
    }

    const shown = messages.length ? messages : [GREETING];

    return (
        <section className="chatbot" role="dialog" aria-label="Trợ lý tư vấn">
            <header className="chatbot-header">
                <FaRobot />
                <div>
                    <strong>Trợ lý Photos by MinhTinh</strong>
                    <small>Tư vấn gói chụp · Hỗ trợ đổi trả</small>
                </div>
                {messages.length > 0 && (
                    <button className="chatbot-reset" onClick={() => setMessages([])}>
                        Làm mới
                    </button>
                )}
                <button className="chatbot-close" onClick={() => setOpen(false)} aria-label="Đóng">
                    <FaTimes />
                </button>
            </header>

            <div className="chatbot-messages" ref={listRef} aria-live="polite">
                {shown.map((message, index) => (
                    <div key={index} className={`chatbot-message ${message.role}`}>
                        <p>{message.content || <span className="chatbot-typing">Đang trả lời...</span>}</p>
                    </div>
                ))}
                {messages.length === 0 && (
                    <div className="chatbot-suggestions">
                        {SUGGESTIONS.map((s) => (
                            <button key={s} onClick={() => send(s)}>
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <form
                className="chatbot-input"
                onSubmit={(e) => {
                    e.preventDefault();
                    send(input);
                }}
            >
                <textarea
                    rows={1}
                    value={input}
                    maxLength={2000}
                    placeholder="Nhập câu hỏi..."
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                            e.preventDefault();
                            send(input);
                        }
                    }}
                />
                <button type="submit" disabled={busy || !input.trim()} aria-label="Gửi">
                    <FaPaperPlane />
                </button>
            </form>
        </section>
    );
}

export default ChatBot;
