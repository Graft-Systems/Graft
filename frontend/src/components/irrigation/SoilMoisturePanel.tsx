"use client";

import { useEffect, useState } from "react";
import { Upload, Waves } from "lucide-react";
import api from "@/app/lib/api";

interface SoilMoistureReading {
    id: number;
    recorded_at: string;
    moisture_pct: number;
    source: string;
    source_label: string;
    notes: string;
}

const emptyForm = {
    recorded_at: "",
    moisture_pct: "",
    notes: "",
};

export default function SoilMoisturePanel({
    blockId,
    refreshToken,
    onChange,
}: {
    blockId: number | null;
    refreshToken: number;
    onChange: () => void;
}) {
    const [readings, setReadings] = useState<SoilMoistureReading[]>([]);
    const [form, setForm] = useState(emptyForm);
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    useEffect(() => {
        const fetchReadings = async () => {
            if (!blockId) {
                setReadings([]);
                return;
            }
            try {
                const response = await api.get("/irrigation/soil-moisture/", {
                    params: { block_id: blockId },
                });
                setReadings(response.data);
            } catch (error) {
                console.error("Error loading soil moisture readings:", error);
                setReadings([]);
            }
        };

        fetchReadings();
    }, [blockId, refreshToken]);

    const handleAddReading = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!blockId) return;
        try {
            await api.post("/irrigation/soil-moisture/", {
                block: blockId,
                recorded_at: form.recorded_at,
                moisture_pct: parseFloat(form.moisture_pct),
                notes: form.notes,
                source: "manual",
            });
            setForm(emptyForm);
            onChange();
        } catch (error) {
            console.error("Error saving soil moisture reading:", error);
            alert("Unable to save soil moisture reading.");
        }
    };

    const handleUpload = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!blockId || !uploadFile) return;
        const formData = new FormData();
        formData.append("block", String(blockId));
        formData.append("file", uploadFile);
        try {
            await api.post("/irrigation/soil-moisture/upload/", formData);
            setUploadFile(null);
            onChange();
        } catch (error) {
            console.error("Error uploading soil moisture CSV:", error);
            alert("Unable to upload CSV.");
        }
    };

    if (!blockId) {
        return <p className="text-sm" style={{ color: "#6b7280" }}>Select a block to manage soil moisture readings.</p>;
    }

    const latestReadings = readings.slice(0, 8);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <form onSubmit={handleAddReading} className="rounded-2xl p-4 space-y-4" style={{ backgroundColor: "#fafafa", border: "1px solid #f3f4f6" }}>
                    <div className="flex items-center gap-2">
                        <Waves size={16} style={{ color: "#0f766e" }} />
                        <h4 className="font-semibold" style={{ color: "#171717" }}>Manual Reading</h4>
                    </div>
                    <input
                        className="w-full rounded-xl border p-3 text-sm"
                        style={{ borderColor: "#e5e7eb", color: "#171717" }}
                        type="datetime-local"
                        value={form.recorded_at}
                        onChange={(event) => setForm({ ...form, recorded_at: event.target.value })}
                        required
                    />
                    <input
                        className="w-full rounded-xl border p-3 text-sm"
                        style={{ borderColor: "#e5e7eb", color: "#171717" }}
                        type="number"
                        step="0.1"
                        placeholder="Moisture %"
                        value={form.moisture_pct}
                        onChange={(event) => setForm({ ...form, moisture_pct: event.target.value })}
                        required
                    />
                    <textarea
                        className="w-full rounded-xl border p-3 text-sm"
                        style={{ borderColor: "#e5e7eb", color: "#171717" }}
                        rows={3}
                        placeholder="Notes"
                        value={form.notes}
                        onChange={(event) => setForm({ ...form, notes: event.target.value })}
                    />
                    <button
                        type="submit"
                        className="rounded-xl px-4 py-2 text-sm font-semibold"
                        style={{ backgroundColor: "#0f766e", color: "#ffffff" }}
                    >
                        Save Reading
                    </button>
                </form>

                <form onSubmit={handleUpload} className="rounded-2xl p-4 space-y-4" style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }}>
                    <div className="flex items-center gap-2">
                        <Upload size={16} style={{ color: "#c2410c" }} />
                        <h4 className="font-semibold" style={{ color: "#171717" }}>CSV Upload</h4>
                    </div>
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                        Expected columns: <span className="font-semibold">recorded_at</span>, <span className="font-semibold">moisture_pct</span>, optional <span className="font-semibold">source_label</span>, <span className="font-semibold">notes</span>.
                    </p>
                    <input
                        className="w-full rounded-xl border p-3 text-sm"
                        style={{ borderColor: "#fdba74", color: "#171717", backgroundColor: "#ffffff" }}
                        type="file"
                        accept=".csv,text/csv"
                        onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                    />
                    <button
                        type="submit"
                        className="rounded-xl px-4 py-2 text-sm font-semibold"
                        style={{ backgroundColor: "#c2410c", color: "#ffffff" }}
                        disabled={!uploadFile}
                    >
                        Import CSV
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {latestReadings.map((reading) => (
                    <div key={reading.id} className="rounded-2xl p-4" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                        <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "#6b7280" }}>
                            {reading.source}
                        </p>
                        <p className="text-2xl font-bold mt-2" style={{ color: "#0f766e" }}>{reading.moisture_pct}%</p>
                        <p className="text-sm mt-2" style={{ color: "#171717" }}>
                            {new Date(reading.recorded_at).toLocaleString()}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
                            {reading.source_label || "Manual entry"}
                        </p>
                    </div>
                ))}
                {latestReadings.length === 0 && (
                    <div className="rounded-2xl p-6 text-sm" style={{ backgroundColor: "#fafafa", border: "1px solid #f3f4f6", color: "#6b7280" }}>
                        No soil moisture readings yet.
                    </div>
                )}
            </div>
        </div>
    );
}
