"use client";

import React, { useEffect, useState } from "react";
import { Plus, Bug, ShieldAlert, Loader2 } from "lucide-react";
import api from "@/app/lib/api";

interface PestDetection {
    id: number;
    scan_session: number;
    detection_type: string;
    display_name: string;
    severity: string;
    affected_area_pct: number;
    confidence_score: number;
    recommended_action: string;
    row_number: string;
    detected_at: string;
}

interface PestDiseasePanelProps {
    scanSessionId: number | null;
}

const SEVERITY_ORDER: Record<string, number> = { severe: 0, high: 1, moderate: 2, low: 3 };

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    severe: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
    high: { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa" },
    moderate: { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
    low: { bg: "#f9fafb", text: "#6b7280", border: "#e5e7eb" },
};

const DETECTION_SUGGESTIONS = [
    "powdery_mildew",
    "black_rot",
    "botrytis",
    "phylloxera",
    "leafhoppers",
    "downy_mildew",
    "esca",
    "eutypa_dieback",
];

export default function PestDiseasePanel({ scanSessionId }: PestDiseasePanelProps) {
    const [detections, setDetections] = useState<PestDetection[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [newDetection, setNewDetection] = useState({
        detection_type: "",
        display_name: "",
        severity: "low",
        affected_area_pct: "",
        confidence_score: "",
        recommended_action: "",
        row_number: "",
    });

    useEffect(() => {
        if (scanSessionId !== null) {
            fetchDetections();
        }
    }, [scanSessionId]);

    const fetchDetections = async () => {
        setLoading(true);
        try {
            const response = await api.get("/vigil/pest-detections/", {
                params: { scan_session_id: scanSessionId },
            });
            setDetections(response.data);
        } catch (error) {
            console.error("Error fetching pest detections:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDetection = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                scan_session: scanSessionId,
                detection_type: newDetection.detection_type,
                display_name: newDetection.display_name,
                severity: newDetection.severity,
                affected_area_pct: newDetection.affected_area_pct ? parseFloat(newDetection.affected_area_pct) : 0,
                confidence_score: newDetection.confidence_score ? parseFloat(newDetection.confidence_score) : 0,
                recommended_action: newDetection.recommended_action,
                row_number: newDetection.row_number,
            };

            const response = await api.post("/vigil/pest-detections/", payload);
            setDetections([...detections, response.data]);
            setShowAddForm(false);
            setNewDetection({
                detection_type: "",
                display_name: "",
                severity: "low",
                affected_area_pct: "",
                confidence_score: "",
                recommended_action: "",
                row_number: "",
            });
        } catch (error) {
            console.error("Post Error:", error);
            alert("Error adding detection. Check the console for details.");
        }
    };

    if (scanSessionId === null) {
        return (
            <div className="flex flex-col items-center justify-center p-12 rounded-xl" style={{ backgroundColor: "#fafafa", border: "1px solid #f5f5f5" }}>
                <ShieldAlert size={40} style={{ color: "#9ca3af" }} />
                <p className="mt-4 text-sm" style={{ color: "#6b7280" }}>Select a scan session to view pest & disease detections</p>
            </div>
        );
    }

    const severityCounts = { severe: 0, high: 0, moderate: 0, low: 0 };
    detections.forEach((d) => {
        const key = d.severity?.toLowerCase() as keyof typeof severityCounts;
        if (key in severityCounts) severityCounts[key]++;
    });
    const hasAlerts = severityCounts.severe + severityCounts.high + severityCounts.moderate + severityCounts.low > 0;

    const sortedDetections = [...detections].sort((a, b) => {
        const sevDiff = (SEVERITY_ORDER[a.severity?.toLowerCase()] ?? 4) - (SEVERITY_ORDER[b.severity?.toLowerCase()] ?? 4);
        if (sevDiff !== 0) return sevDiff;
        return new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime();
    });

    const filteredSuggestions = DETECTION_SUGGESTIONS.filter((s) =>
        s.includes(newDetection.detection_type.toLowerCase()) && newDetection.detection_type.length > 0
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold" style={{ color: "#262626" }}>Pest & Disease Detections</h3>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-sm"
                    style={{ backgroundColor: "#9f1239", color: "#ffffff" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#be123c")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#9f1239")}
                >
                    <Plus size={18} /> Add Detection
                </button>
            </div>

            {/* Active Alerts Summary */}
            {hasAlerts ? (
                <div className="grid grid-cols-4 gap-3 mb-4">
                    {(["severe", "high", "moderate", "low"] as const).map((level) => {
                        const colors = SEVERITY_COLORS[level];
                        return (
                            <div
                                key={level}
                                className="p-3 rounded-lg text-center"
                                style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}
                            >
                                <p className="text-2xl font-bold" style={{ color: colors.text }}>{severityCounts[level]}</p>
                                <p className="text-xs font-semibold capitalize" style={{ color: colors.text }}>{level}</p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="p-3 rounded-lg text-center mb-4" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <p className="text-sm font-semibold" style={{ color: "#16a34a" }}>No active detections</p>
                </div>
            )}

            {/* Add Detection Form */}
            {showAddForm && (
                <form onSubmit={handleAddDetection} className="p-4 rounded-xl grid grid-cols-2 gap-4 mb-6" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                    <div className="relative">
                        <input
                            className="p-2 border rounded-md w-full placeholder:text-gray-500 text-gray-900"
                            placeholder="Detection Type (e.g. powdery_mildew)"
                            value={newDetection.detection_type}
                            onChange={(e) => {
                                setNewDetection({ ...newDetection, detection_type: e.target.value });
                                setShowSuggestions(true);
                            }}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                            onFocus={() => setShowSuggestions(true)}
                            required
                        />
                        {showSuggestions && filteredSuggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 rounded-md shadow-lg" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                                {filteredSuggestions.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                                        style={{ color: "#374151" }}
                                        onClick={() => {
                                            setNewDetection({ ...newDetection, detection_type: s });
                                            setShowSuggestions(false);
                                        }}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <input
                        className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                        placeholder="Display Name"
                        value={newDetection.display_name}
                        onChange={(e) => setNewDetection({ ...newDetection, display_name: e.target.value })}
                    />
                    <select
                        className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                        value={newDetection.severity}
                        onChange={(e) => setNewDetection({ ...newDetection, severity: e.target.value })}
                    >
                        <option value="low">Low</option>
                        <option value="moderate">Moderate</option>
                        <option value="high">High</option>
                        <option value="severe">Severe</option>
                    </select>
                    <input
                        className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="Affected Area %"
                        value={newDetection.affected_area_pct}
                        onChange={(e) => setNewDetection({ ...newDetection, affected_area_pct: e.target.value })}
                    />
                    <input
                        className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        placeholder="Confidence Score (0-1)"
                        value={newDetection.confidence_score}
                        onChange={(e) => setNewDetection({ ...newDetection, confidence_score: e.target.value })}
                    />
                    <input
                        className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                        placeholder="Row Number"
                        value={newDetection.row_number}
                        onChange={(e) => setNewDetection({ ...newDetection, row_number: e.target.value })}
                    />
                    <textarea
                        className="p-2 border rounded-md col-span-2 placeholder:text-gray-500 text-gray-900"
                        placeholder="Recommended Action"
                        rows={3}
                        value={newDetection.recommended_action}
                        onChange={(e) => setNewDetection({ ...newDetection, recommended_action: e.target.value })}
                    />
                    <div className="col-span-2 flex gap-2">
                        <button type="submit" className="px-4 py-2 rounded-md" style={{ backgroundColor: "#9f1239", color: "#ffffff" }}>Save Detection</button>
                        <button type="button" onClick={() => setShowAddForm(false)} style={{ color: "#374151" }}>Cancel</button>
                    </div>
                </form>
            )}

            {/* Detections Table */}
            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin" style={{ color: "#9f1239" }} /></div>
            ) : sortedDetections.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 rounded-xl" style={{ backgroundColor: "#fafafa", border: "1px solid #f5f5f5" }}>
                    <Bug size={32} style={{ color: "#9ca3af" }} />
                    <p className="mt-3 text-sm" style={{ color: "#6b7280" }}>No detections recorded for this scan session</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid #f5f5f5" }}>
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ backgroundColor: "#fafafa" }}>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Type</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Name</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Severity</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Area</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Confidence</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Action</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Row</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Detected</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedDetections.map((det) => {
                                const sevKey = det.severity?.toLowerCase() || "low";
                                const colors = SEVERITY_COLORS[sevKey] || SEVERITY_COLORS.low;
                                const confidencePct = Math.round((det.confidence_score || 0) * 100);
                                return (
                                    <tr key={det.id} className="hover:bg-gray-50 transition" style={{ borderBottom: "1px solid #f5f5f5" }}>
                                        <td className="p-3 font-mono text-xs" style={{ color: "#374151" }}>{det.detection_type}</td>
                                        <td className="p-3 font-medium" style={{ color: "#171717" }}>{det.display_name}</td>
                                        <td className="p-3">
                                            <span
                                                className="px-2 py-1 rounded-full text-xs font-semibold capitalize"
                                                style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                                            >
                                                {det.severity}
                                            </span>
                                        </td>
                                        <td className="p-3" style={{ color: "#374151" }}>{det.affected_area_pct}%</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 rounded-full" style={{ backgroundColor: "#e5e7eb" }}>
                                                    <div
                                                        className="h-2 rounded-full"
                                                        style={{
                                                            width: `${confidencePct}%`,
                                                            backgroundColor: confidencePct >= 80 ? "#16a34a" : confidencePct >= 50 ? "#d97706" : "#dc2626",
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs" style={{ color: "#6b7280" }}>{confidencePct}%</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-xs max-w-[200px] truncate" style={{ color: "#374151" }}>{det.recommended_action}</td>
                                        <td className="p-3" style={{ color: "#374151" }}>{det.row_number}</td>
                                        <td className="p-3 text-xs" style={{ color: "#6b7280" }}>
                                            {det.detected_at ? new Date(det.detected_at).toLocaleDateString() : "-"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
