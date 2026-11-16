import { API_BASE_URL } from "./api";

export const chatService = {
    async sendMessage(messages, onDelta, signal) {
        const token = localStorage.getItem("accessToken");
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
            body: JSON.stringify({ messages }),
            signal,
        });

        if (!response.ok || !response.body) {
            const body = await response.json().catch(() => null);
            throw new Error(body?.message ?? "Không kết nối được trợ lý");
        }

        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = "";
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += value;
            let index;
            while ((index = buffer.indexOf("\n\n")) !== -1) {
                const chunk = buffer.slice(0, index);
                buffer = buffer.slice(index + 2);
                const event = /^event: (.+)$/m.exec(chunk)?.[1];
                const data = /^data: (.+)$/m.exec(chunk)?.[1];
                if (event === "delta" && data) onDelta(JSON.parse(data).text ?? "");
            }
        }
    },
};

export default chatService;
