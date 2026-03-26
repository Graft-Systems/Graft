"use client";

import { useEffect, useState } from "react";
import api from "@/app/lib/api";
import axios from "axios";

type Step = {
  id: string;
  title: string;
  dependsOn?: string[];
  completed?: boolean;
};

export default function FormAutomatorPanel({ stateCode }: { stateCode: string }) {
  const storageProfileKey = `legal_insight_unified_profile_${stateCode}`;
  const storageCompletionKey = `legal_insight_completion_${stateCode}`;

  const [steps, setSteps] = useState<Step[]>([]);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [draftPacketPreview, setDraftPacketPreview] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const total = steps.length;
  const doneCount = steps.filter((s) => completed[s.id]).length;

  const syncFromBackend = async () => {
    setLoading(true);
    setErrorText(null);
    try {
      const raw = localStorage.getItem(storageProfileKey);
      const unified_profile = raw ? JSON.parse(raw) : {};

      const res = await api.post("/legal-insight/form-automator/generate/", {
        state_code: stateCode,
        unified_profile,
      });

      const nextSteps: Step[] = res.data?.steps ?? [];
      const nextDraft = res.data?.draft_packet_preview ?? null;

      const nextCompleted: Record<string, boolean> = {};
      for (const s of nextSteps) nextCompleted[s.id] = !!s.completed;

      setSteps(nextSteps);
      setDraftPacketPreview(nextDraft);
      setCompleted(nextCompleted);

      localStorage.setItem(
        storageCompletionKey,
        JSON.stringify({
          state_code: stateCode,
          steps: nextSteps,
          draft_packet_preview: nextDraft,
        })
      );
    } catch (error: unknown) {
      let message = "Unable to generate draft packet from backend.";
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const backendError =
          (error.response?.data as { error?: string } | undefined)?.error || error.message;
        if (status === 401) message = "Session expired. Please log in again.";
        else if (status) message = `${backendError} (HTTP ${status})`;
        else message = backendError;
      }
      setErrorText(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncFromBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateCode]);

  return (
    <div className="space-y-4">
      <div style={{ color: "#374151", fontSize: 13 }}>
        Generate draft packets from your state profile + unified interview data.
      </div>

      <div style={{ fontWeight: 800, color: "#111827", backgroundColor: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 10, padding: "8px 10px" }}>
        Draft pipeline progress: {doneCount}/{total} {loading ? "(syncing…)" : ""}
      </div>
      {errorText ? (
        <div
          style={{
            border: "1px solid #fecaca",
            backgroundColor: "#fff1f2",
            color: "#9f1239",
            borderRadius: 10,
            padding: "8px 10px",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {errorText}
        </div>
      ) : null}

      <div className="space-y-2">
        {steps.map((s) => {
          const isDone = !!completed[s.id];
          return (
            <label
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #fecdd3",
                backgroundColor: isDone ? "#fff1f2" : "#fff",
              }}
            >
              <span style={{ color: "#111827", fontWeight: 650, fontSize: 13 }}>{s.title}</span>
              <input
                type="checkbox"
                checked={isDone}
                onChange={(e) => setCompleted((prev) => ({ ...prev, [s.id]: e.target.checked }))}
              />
            </label>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #be123c",
            backgroundColor: "#be123c",
            color: "#fff",
            fontWeight: 800,
          }}
          onClick={syncFromBackend}
        >
          Generate Draft Packet
        </button>
        <button
          type="button"
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #fecdd3",
            backgroundColor: "#fff1f2",
            color: "#111827",
            fontWeight: 650,
          }}
          onClick={() => setCompleted({})}
        >
          Reset
        </button>
      </div>

      {draftPacketPreview ? (
        <details>
          <summary style={{ cursor: "pointer", color: "#9f1239", fontWeight: 900, fontSize: 13 }}>
            Preview mapped form payload (JSON)
          </summary>
          <pre
            style={{
              marginTop: 10,
              backgroundColor: "#f7f7f7",
              border: "1px solid #e5e5e5",
              borderRadius: 10,
              padding: 12,
              overflow: "auto",
              color: "#111827",
              fontSize: 12,
              lineHeight: 1.4,
            }}
          >
            {JSON.stringify(draftPacketPreview, null, 2)}
          </pre>
        </details>
      ) : null}
    </div>
  );
}

