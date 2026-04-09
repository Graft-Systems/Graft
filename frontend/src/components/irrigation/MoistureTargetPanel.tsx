"use client";

import { useEffect, useState } from "react";
import api from "@/app/lib/api";

const emptyTarget = {
    target_min_pct: "",
    target_max_pct: "",
    critical_min_pct: "",
};

export default function MoistureTargetPanel({
    blockId,
    onSaved,
}: {
    blockId: number | null;
    onSaved: () => void;
}) {
    const [form, setForm] = useState(emptyTarget);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchTarget = async () => {
            if (!blockId) {
                setForm(emptyTarget);
                return;
            }
            try {
                const response = await api.get(`/irrigation/targets/${blockId}/`);
                setForm({
                    target_min_pct: String(response.data.target_min_pct ?? ""),
                    target_max_pct: String(response.data.target_max_pct ?? ""),
                    critical_min_pct: String(response.data.critical_min_pct ?? ""),
                });
            } catch (error) {
                console.error("Error loading moisture target:", error);
                setForm(emptyTarget);
            }
        };

        fetchTarget();
    }, [blockId]);

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!blockId) return;
        setSaving(true);
        try {
            await api.put(`/irrigation/targets/${blockId}/`, {
                target_min_pct: parseFloat(form.target_min_pct),
                target_max_pct: parseFloat(form.target_max_pct),
                critical_min_pct: parseFloat(form.critical_min_pct),
            });
            onSaved();
        } catch (error) {
            console.error("Error saving moisture target:", error);
            alert("Unable to save target settings.");
        } finally {
            setSaving(false);
        }
    };

    if (!blockId) {
        return <p className="text-sm" style={{ color: "#6b7280" }}>Select a block to configure target moisture ranges.</p>;
    }

    return (
        <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "#6b7280" }}>
                        Target Min %
                    </label>
                    <input
                        className="rounded-xl border p-3 text-sm"
                        style={{ borderColor: "#e5e7eb", color: "#171717" }}
                        type="number"
                        step="0.1"
                        value={form.target_min_pct}
                        onChange={(event) => setForm({ ...form, target_min_pct: event.target.value })}
                        required
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "#6b7280" }}>
                        Target Max %
                    </label>
                    <input
                        className="rounded-xl border p-3 text-sm"
                        style={{ borderColor: "#e5e7eb", color: "#171717" }}
                        type="number"
                        step="0.1"
                        value={form.target_max_pct}
                        onChange={(event) => setForm({ ...form, target_max_pct: event.target.value })}
                        required
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "#6b7280" }}>
                        Critical Min %
                    </label>
                    <input
                        className="rounded-xl border p-3 text-sm"
                        style={{ borderColor: "#e5e7eb", color: "#171717" }}
                        type="number"
                        step="0.1"
                        value={form.critical_min_pct}
                        onChange={(event) => setForm({ ...form, critical_min_pct: event.target.value })}
                        required
                    />
                </div>
            </div>

            <button
                type="submit"
                className="rounded-xl px-4 py-2 text-sm font-semibold transition"
                style={{ backgroundColor: "#9f1239", color: "#ffffff", opacity: saving ? 0.7 : 1 }}
                disabled={saving}
            >
                {saving ? "Saving..." : "Save Targets"}
            </button>
        </form>
    );
}
