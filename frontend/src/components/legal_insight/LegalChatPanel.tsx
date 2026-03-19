"use client";

import { useState } from "react";
import api from "@/app/lib/api";

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
  createdAt: number;
};

function buildPlaceholderLegalResponse(question: string) {
  const q = question.toLowerCase();
  if (q.includes("tariff")) {
    return (
      "Legal Insight Provider (stub): Tariff details depend on your wine classification and destination state context. " +
      "Next steps: confirm HS/HTS codes, verify any excise/duty considerations, then map outputs to your State Profile logic tree decision path."
    );
  }
  if (q.includes("primary") && q.includes("source")) {
    return (
      "Legal Insight Provider (stub): If your text references 'Primary American Source of Supply', it should map to the 'Primary Source' requirement node in your Logic Tree. " +
      "Next steps: store the requirement in the State Profile, then prompt the Unified Profile engine for the specific confirmation fields."
    );
  }
  return (
    "Legal Insight Provider (stub): I can answer based on your structured Logic Tree and State Profile. " +
    "For now, paste the relevant regulatory excerpt so the scanner can convert it into nodes and fields."
  );
}

export default function LegalChatPanel({ stateCode }: { stateCode: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m0",
      role: "ai",
      content:
        "Ask a niche compliance question (stub). In the real build, this chatbot will use your NY Logic Tree + State Profile to answer with citations and explain decision paths.",
      createdAt: 0,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: text,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    (async () => {
      setLoading(true);
      try {
        const storageKey = `legal_insight_unified_profile_${stateCode}`;
        let unified_profile: Record<string, unknown> = {};
        try {
          const raw = localStorage.getItem(storageKey);
          unified_profile = raw ? JSON.parse(raw) : {};
        } catch {
          unified_profile = {};
        }

        const res = await api.post("/legal-insight/chat/", {
          message: text,
          state_code: stateCode,
          unified_profile,
        });

        const aiMsg: ChatMessage = {
          id: `a_${Date.now() + 1}`,
          role: "ai",
          content: res.data?.message || "No response received.",
          createdAt: Date.now() + 1,
        };

        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        const aiMsg: ChatMessage = {
          id: `a_${Date.now() + 1}`,
          role: "ai",
          content: buildPlaceholderLegalResponse(text),
          createdAt: Date.now() + 1,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className="space-y-4">
      <div style={{ fontWeight: 800, color: "#111827" }}>Niche Chatbot</div>
      <div style={{ color: "#6b7280", fontSize: 12 }}>
        Routing assistant using your saved Unified Profile for the selected state.
      </div>

      <div
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 14,
          padding: 12,
          backgroundColor: "#fff",
          maxHeight: 260,
          overflow: "auto",
        }}
      >
        <div className="space-y-2">
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: 520,
                  padding: "10px 12px",
                  borderRadius: 12,
                  backgroundColor: m.role === "user" ? "#e11d48" : "#f3f4f6",
                  color: m.role === "user" ? "#fff" : "#111827",
                  whiteSpace: "pre-wrap",
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., How do tariffs affect my NY importer application?"
          style={{
            flex: 1,
            borderRadius: 10,
            border: "1px solid #e5e5e5",
            padding: 10,
            outline: "none",
            color: "#111827",
            backgroundColor: "#fff",
          }}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <button
          type="button"
          onClick={send}
          disabled={loading}
          style={{
            borderRadius: 10,
            border: "1px solid #e5e5e5",
            padding: "10px 12px",
            backgroundColor: "#e11d48",
            color: "#fff",
            fontWeight: 800,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Asking…" : "Ask"}
        </button>
      </div>

      <style jsx>{`
        /* Make placeholder readable (browser defaults can look washed out). */
        input::placeholder {
          color: #6b7280;
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

