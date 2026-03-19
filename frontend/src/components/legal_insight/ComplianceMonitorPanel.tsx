"use client";

import { useMemo, useState } from "react";

type MonitorStep = {
  id: string;
  label: string;
  locked?: boolean;
};

type StoredCompletionStep = {
  id?: string | number;
  title?: string;
  completed?: boolean;
};

export default function ComplianceMonitorPanel({ stateCode }: { stateCode: string }) {
  const storageCompletionKey = `legal_insight_completion_${stateCode}`;

  const steps: MonitorStep[] = useMemo(
    () => [
      { id: "federal_basic", label: "Federal Basic Permit (Pending)" },
      { id: "cola", label: "Label Approval (Locked until Step 1 complete)", locked: true },
      { id: "state_brand", label: "State Brand Registration (Locked)", locked: true },
    ],
    []
  );

  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(storageCompletionKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      const storedSteps = Array.isArray(parsed?.steps) ? (parsed.steps as StoredCompletionStep[]) : [];
      const nextDone: Record<string, boolean> = {};
      for (const s of storedSteps) nextDone[String(s.id)] = !!s.completed;
      return nextDone;
    } catch {
      return {};
    }
  });

  const resolvedSteps = useMemo(() => {
    try {
      const raw = localStorage.getItem(storageCompletionKey);
      if (!raw) return steps;
      const parsed = JSON.parse(raw);
      const storedSteps = Array.isArray(parsed?.steps) ? (parsed.steps as StoredCompletionStep[]) : [];
      if (!storedSteps.length) return steps;
      return storedSteps.map((s) => ({
        id: String(s.id),
        label: String(s.title || s.id || "Step"),
        locked: false,
      })) as MonitorStep[];
    } catch {
      return steps;
    }
  }, [storageCompletionKey, steps]);

  return (
    <div className="space-y-3">
      <div style={{ fontWeight: 800, color: "#111827" }}>Compliance Monitor (Dashboard)</div>
      <div style={{ color: "#6b7280", fontSize: 12 }}>Progress tracker driven by generated workflow steps.</div>

      <div style={{ border: "1px solid #e5e5e5", borderRadius: 14, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontWeight: 700, color: "#111827" }}>Step completion</div>
          <div style={{ fontWeight: 800, color: "#111827" }}>
            {resolvedSteps.filter((s) => done[s.id]).length}/{resolvedSteps.length}
          </div>
        </div>

        <div style={{ height: 10, borderRadius: 999, backgroundColor: "#f3f4f6", overflow: "hidden" }}>
          <div
            style={{
              height: 10,
              width: `${resolvedSteps.length ? (resolvedSteps.filter((s) => done[s.id]).length / resolvedSteps.length) * 100 : 0}%`,
              backgroundColor: "#9f1239",
            }}
          />
        </div>

        <div className="space-y-2" style={{ marginTop: 12 }}>
          {resolvedSteps.map((s) => {
            const isDone = !!done[s.id];
            const isLocked = !!s.locked && !isDone;
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
                  border: "1px solid #e5e5e5",
                  backgroundColor: isDone ? "#fff1f2" : "#fff",
                  opacity: isLocked ? 0.7 : 1,
                  cursor: isLocked ? "not-allowed" : "pointer",
                }}
              >
                <span style={{ fontWeight: 650, color: "#111827", fontSize: 13 }}>{s.label}</span>
                <input
                  type="checkbox"
                  checked={isDone}
                  disabled={isLocked}
                  onChange={(e) => setDone((prev) => ({ ...prev, [s.id]: e.target.checked }))}
                />
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

