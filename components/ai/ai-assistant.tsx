"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Trash2, Bot } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const QUICK_QUESTIONS = [
  "What were my top 5 products this week?",
  "Which staff made the most sales today?",
  "What's my profit margin this month?",
  "Which products are selling slower than last month?",
  "How does this week compare to last week?",
];

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || streaming) return;
    setInput("");

    const userMsg: Message = { role: "user", content, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setStreaming(true);

    // Placeholder for streaming response
    const assistantMsg: Message = { role: "assistant", content: "", timestamp: new Date().toISOString() };
    setMessages([...newMessages, assistantMsg]);

    try {
      const res = await fetch("/api/ai/insights/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          chatId,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.delta) {
              accumulated += data.delta;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...assistantMsg, content: accumulated };
                return updated;
              });
            }
            if (data.error) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...assistantMsg, content: "AI temporarily unavailable. Please try again." };
                return updated;
              });
            }
          } catch { /* skip malformed chunks */ }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...assistantMsg, content: "AI temporarily unavailable. Please try again." };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 40,
          width: 52, height: 52, borderRadius: "50%",
          background: "var(--accent)", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "var(--shadow-accent)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        title="AI Business Assistant"
      >
        <Bot size={22} style={{ color: "var(--accent-fg)" }} />
      </button>

      {/* Slide-over panel */}
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 41, background: "transparent" }}
          />
          <div style={{
            position: "fixed", right: 0, top: 0, bottom: 0, zIndex: 42,
            width: 400, maxWidth: "100vw",
            background: "var(--bg-card)", borderLeft: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
            display: "flex", flexDirection: "column",
            animation: "slideInRight 0.22s ease-out both",
          }}>
            <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

            {/* Header */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent-sub)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bot size={16} style={{ color: "var(--accent)" }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: 0 }}>AI Assistant</p>
                  <p style={{ fontSize: 11, color: "var(--text-3)", margin: 0 }}>Powered by Claude</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => { setMessages([]); setChatId(undefined); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex", padding: 6, borderRadius: 6 }}
                  title="Clear conversation"
                >
                  <Trash2 size={15} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex", padding: 6, borderRadius: 6 }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.length === 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <p style={{ fontSize: 13, color: "var(--text-2)", textAlign: "center", marginBottom: 8 }}>
                    Ask anything about your business
                  </p>
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      style={{
                        padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)",
                        background: "var(--bg-input)", color: "var(--text-2)", fontSize: 12,
                        cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                      }}
                      className="quick-chip"
                    >
                      {q}
                    </button>
                  ))}
                  <style>{`.quick-chip:hover{background:var(--bg-card-2)!important;border-color:var(--border-2)!important;color:var(--text)!important}`}</style>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "85%", padding: "10px 13px", borderRadius: 12,
                    background: msg.role === "user" ? "var(--accent)" : "var(--bg-input)",
                    color: msg.role === "user" ? "var(--accent-fg)" : "var(--text)",
                    fontSize: 13, lineHeight: 1.6,
                    borderBottomRightRadius: msg.role === "user" ? 4 : 12,
                    borderBottomLeftRadius: msg.role === "assistant" ? 4 : 12,
                  }}>
                    {msg.content || (streaming && i === messages.length - 1 ? (
                      <Loader2 size={14} className="animate-spin" style={{ opacity: 0.5 }} />
                    ) : "…")}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a business question…"
                  rows={2}
                  className="uni-input"
                  style={{ resize: "none", flex: 1, fontSize: 13 }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || streaming}
                  className="uni-btn uni-btn-primary"
                  style={{ flexShrink: 0, padding: "8px 12px" }}
                >
                  {streaming ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                </button>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6, marginBottom: 0 }}>
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
