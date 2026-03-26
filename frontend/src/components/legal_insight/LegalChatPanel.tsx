"use client";

import { useState } from "react";
import api from "@/app/lib/api";
import axios from "axios";

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
        `I am your ${stateCode} compliance copilot. Ask about permit order, blockers, timelines, or cross-state comparisons. I will ground answers in your ${stateCode} profile + retrieved legal excerpts with citations.`,
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

        const res = await api.post("/ai/chat/", {
          message:
            `Legal Insight context:\n` +
            `- State: ${stateCode}\n` +
            `- Unified profile JSON: ${JSON.stringify(unified_profile)}\n\n` +
            `User question: ${text}`,
        });

        const aiMsg: ChatMessage = {
          id: `a_${Date.now() + 1}`,
          role: "ai",
          content: res.data?.message || "No response received.",
          createdAt: Date.now() + 1,
        };

        setMessages((prev) => [...prev, aiMsg]);
      } catch (error: unknown) {
        let errorMessage = "Unable to reach AI chat right now.";
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const backendError =
            (error.response?.data as { error?: string; message?: string } | undefined)?.error ||
            (error.response?.data as { error?: string; message?: string } | undefined)?.message;
          if (status === 401) errorMessage = "Session expired. Please log in again.";
          else if (status === 403) errorMessage = "You do not have permission for this chat endpoint.";
          else if (backendError) errorMessage = backendError;
          else if (status) errorMessage = `Chat request failed (HTTP ${status}).`;
        }

        const aiMsg: ChatMessage = {
          id: `a_${Date.now() + 1}`,
          role: "ai",
          content:
            `${errorMessage}\n\n` +
            "Fallback answer (local template):\n" +
            buildPlaceholderLegalResponse(text),
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontWeight: 800, color: "#111827" }}>State-Aware Legal Assistant</div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            padding: "4px 8px",
            borderRadius: 999,
            backgroundColor: "#fff1f2",
            color: "#9f1239",
            border: "1px solid #fecdd3",
          }}
        >
          {stateCode}
        </span>
      </div>
      <div style={{ color: "#6b7280", fontSize: 12, backgroundColor: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: 10 }}>
        Ask targeted regulatory questions for {stateCode}. I use your saved profile and only broaden to other states when you explicitly ask to compare.
      </div>

      <div
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 14,
          padding: 12,
          backgroundColor: "#fffafc",
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
                  backgroundColor: m.role === "user" ? "#be123c" : "#fff1f2",
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
          placeholder={`e.g., What is blocking my ${stateCode} brand registration right now?`}
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

