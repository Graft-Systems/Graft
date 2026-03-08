"use client";

import React, { useEffect, useState } from "react";
import { Plus, Loader2, Droplets, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import api from "@/app/lib/api";

interface IrrigationLog {
    id: number;
    block: number;
    date: string;
    method: string;
    duration_hours: number | null;
    gallons_applied: number | null;
    soil_moisture_pct_before: number | null;
    soil_moisture_pct_after: number | null;
    notes: string;
}

interface IrrigationPanelProps {
    blockId: number | null;
}

const emptyForm = {
    date: "",
    method: "drip",
    duration_hours: "",
    gallons_applied: "",
    soil_moisture_pct_before: "",
    soil_moisture_pct_after: "",
    notes: "",
};

const methodStyles: Record<string, { backgroundColor: string; color: string }> = {
    drip: { backgroundColor: "#dbeafe", color: "#1e40af" },
    sprinkler: { backgroundColor: "#cffafe", color: "#155e75" },
    flood: { backgroundColor: "#ffedd5", color: "#9a3412" },
    none: { backgroundColor: "#f5f5f5", color: "#525252" },
};

export default function IrrigationPanel({ blockId }: IrrigationPanelProps) {
    const [logs, setLogs] = useState<IrrigationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newLog, setNewLog] = useState({ ...emptyForm });
    const [editingLogId, setEditingLogId] = useState<number | null>(null);
    const [editLog, setEditLog] = useState({ ...emptyForm });

    useEffect(() => {
        if (blockId) {
            fetchLogs();
        } else {
            setLogs([]);
            setLoading(false);
        }
    }, [blockId]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await api.get("/vigil/irrigation/", { params: { block_id: blockId } });
            setLogs(response.data);
        } catch (error) {
            console.error("Error fetching irrigation logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddLog = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                block: blockId,
                date: newLog.date,
                method: newLog.method,
                duration_hours: newLog.duration_hours ? parseFloat(newLog.duration_hours) : null,
                gallons_applied: newLog.gallons_applied ? parseFloat(newLog.gallons_applied) : null,
                soil_moisture_pct_before: newLog.soil_moisture_pct_before ? parseFloat(newLog.soil_moisture_pct_before) : null,
                soil_moisture_pct_after: newLog.soil_moisture_pct_after ? parseFloat(newLog.soil_moisture_pct_after) : null,
                notes: newLog.notes,
            };

            const response = await api.post("/vigil/irrigation/", payload);
            setLogs([...logs, response.data]);
            setShowAddForm(false);
            setNewLog({ ...emptyForm });
        } catch (error) {
            console.error("Post Error:", error);
            alert("Error adding irrigation log. Check the console for details.");
        }
    };

    const startEditing = (log: IrrigationLog) => {
        setEditingLogId(log.id);
        setEditLog({
            date: log.date || "",
            method: log.method || "drip",
            duration_hours: log.duration_hours != null ? log.duration_hours.toString() : "",
            gallons_applied: log.gallons_applied != null ? log.gallons_applied.toString() : "",
            soil_moisture_pct_before: log.soil_moisture_pct_before != null ? log.soil_moisture_pct_before.toString() : "",
            soil_moisture_pct_after: log.soil_moisture_pct_after != null ? log.soil_moisture_pct_after.toString() : "",
            notes: log.notes || "",
        });
        setShowAddForm(false);
    };

    const handleUpdateLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLogId) return;
        try {
            const payload = {
                block: blockId,
                date: editLog.date,
                method: editLog.method,
                duration_hours: editLog.duration_hours ? parseFloat(editLog.duration_hours) : null,
                gallons_applied: editLog.gallons_applied ? parseFloat(editLog.gallons_applied) : null,
                soil_moisture_pct_before: editLog.soil_moisture_pct_before ? parseFloat(editLog.soil_moisture_pct_before) : null,
                soil_moisture_pct_after: editLog.soil_moisture_pct_after ? parseFloat(editLog.soil_moisture_pct_after) : null,
                notes: editLog.notes,
            };

            const response = await api.put(`/vigil/irrigation/${editingLogId}/`, payload);
            setLogs(logs.map((l) => (l.id === editingLogId ? response.data : l)));
            setEditingLogId(null);
            setEditLog({ ...emptyForm });
        } catch (error) {
            console.error("Update Error:", error);
            alert("Error updating irrigation log. Check the console for details.");
        }
    };

    const handleDeleteLog = async (id: number) => {
        if (!confirm("Are you sure you want to delete this irrigation log?")) return;
        try {
            await api.delete(`/vigil/irrigation/${id}/`);
            setLogs(logs.filter((l) => l.id !== id));
        } catch (error) {
            console.error("Delete Error:", error);
            alert("Error deleting irrigation log. Check the console for details.");
        }
    };

    if (!blockId) {
        return (
            <div className="flex items-center justify-center p-12 rounded-xl" style={{ backgroundColor: "#fafafa", border: "1px solid #f5f5f5" }}>
                <p style={{ color: "#6b7280" }}>Select a block to view irrigation data</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin" style={{ color: "#9f1239" }} /></div>
        );
    }

    const totalIrrigations = logs.length;
    const totalGallons = logs.reduce((sum, l) => sum + (l.gallons_applied ?? 0), 0);
    const lastIrrigationDate = logs.length > 0
        ? logs.sort((a, b) => b.date.localeCompare(a.date))[0].date
        : "--";

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold" style={{ color: "#262626" }}>Irrigation Logs</h3>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-sm"
                    style={{ backgroundColor: "#9f1239", color: "#ffffff" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#be123c"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#9f1239"}
                >
                    <Plus size={18} /> Add Irrigation Log
                </button>
            </div>

            {/* Recent Irrigation Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: "#ffffff", border: "1px solid #f5f5f5" }}>
                    <div className="flex items-center justify-center mb-2">
                        <div className="p-2 rounded-full" style={{ backgroundColor: "#fff1f2", color: "#9f1239" }}>
                            <Droplets size={20} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: "#171717" }}>{totalIrrigations}</p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>Total Irrigations</p>
                </div>
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: "#ffffff", border: "1px solid #f5f5f5" }}>
                    <div className="flex items-center justify-center mb-2">
                        <div className="p-2 rounded-full" style={{ backgroundColor: "#fff1f2", color: "#9f1239" }}>
                            <Droplets size={20} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: "#171717" }}>{totalGallons.toLocaleString()}</p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>Total Gallons Applied</p>
                </div>
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: "#ffffff", border: "1px solid #f5f5f5" }}>
                    <div className="flex items-center justify-center mb-2">
                        <div className="p-2 rounded-full" style={{ backgroundColor: "#fff1f2", color: "#9f1239" }}>
                            <Droplets size={20} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: "#171717" }}>{lastIrrigationDate}</p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>Last Irrigation</p>
                </div>
            </div>

            {/* Add Irrigation Form */}
            {showAddForm && (
                <form onSubmit={handleAddLog} className="p-4 rounded-xl grid grid-cols-3 gap-4 mb-6" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold" style={{ color: "#374151" }}>Date</label>
                        <input
                            className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                            type="date"
                            value={newLog.date}
                            onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold" style={{ color: "#374151" }}>Method</label>
                        <select
                            className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                            value={newLog.method}
                            onChange={(e) => setNewLog({ ...newLog, method: e.target.value })}
                            required
                        >
                            <option value="drip">Drip</option>
                            <option value="sprinkler">Sprinkler</option>
                            <option value="flood">Flood</option>
                            <option value="none">None</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold" style={{ color: "#374151" }}>Duration (hrs)</label>
                        <input
                            className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                            type="number"
                            step="0.1"
                            placeholder="Hours"
                            value={newLog.duration_hours}
                            onChange={(e) => setNewLog({ ...newLog, duration_hours: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold" style={{ color: "#374151" }}>Gallons Applied</label>
                        <input
                            className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                            type="number"
                            step="0.1"
                            placeholder="Gallons"
                            value={newLog.gallons_applied}
                            onChange={(e) => setNewLog({ ...newLog, gallons_applied: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold" style={{ color: "#374151" }}>Soil Moisture Before (%)</label>
                        <input
                            className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                            type="number"
                            step="0.1"
                            placeholder="Before %"
                            value={newLog.soil_moisture_pct_before}
                            onChange={(e) => setNewLog({ ...newLog, soil_moisture_pct_before: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold" style={{ color: "#374151" }}>Soil Moisture After (%)</label>
                        <input
                            className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                            type="number"
                            step="0.1"
                            placeholder="After %"
                            value={newLog.soil_moisture_pct_after}
                            onChange={(e) => setNewLog({ ...newLog, soil_moisture_pct_after: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col gap-1 col-span-3">
                        <label className="text-xs font-semibold" style={{ color: "#374151" }}>Notes</label>
                        <input
                            className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                            placeholder="Notes"
                            value={newLog.notes}
                            onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                        />
                    </div>
                    <div className="col-span-3 flex gap-2">
                        <button type="submit" className="px-4 py-2 rounded-md" style={{ backgroundColor: "#9f1239", color: "#ffffff" }}>Save Log</button>
                        <button type="button" onClick={() => setShowAddForm(false)} style={{ color: "#374151" }}>Cancel</button>
                    </div>
                </form>
            )}

            {/* Irrigation Log Table */}
            {logs.length === 0 ? (
                <div className="p-6 rounded-xl text-center" style={{ backgroundColor: "#fafafa", border: "1px solid #f5f5f5" }}>
                    <Droplets size={32} className="mx-auto mb-2" style={{ color: "#9ca3af" }} />
                    <p className="text-sm" style={{ color: "#6b7280" }}>No irrigation logs yet. Add your first entry above.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid #f5f5f5" }}>
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ backgroundColor: "#fafafa" }}>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Date</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Method</th>
                                <th className="text-right p-3 font-semibold" style={{ color: "#374151" }}>Duration (hrs)</th>
                                <th className="text-right p-3 font-semibold" style={{ color: "#374151" }}>Gallons</th>
                                <th className="text-right p-3 font-semibold" style={{ color: "#374151" }}>Moisture Before</th>
                                <th className="text-right p-3 font-semibold" style={{ color: "#374151" }}>Moisture After</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Notes</th>
                                <th className="text-right p-3 font-semibold" style={{ color: "#374151" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs
                                .sort((a, b) => b.date.localeCompare(a.date))
                                .map((log) => {
                                    const moistureDelta =
                                        log.soil_moisture_pct_before != null && log.soil_moisture_pct_after != null
                                            ? log.soil_moisture_pct_after - log.soil_moisture_pct_before
                                            : null;

                                    if (editingLogId === log.id) {
                                        return (
                                            <tr key={log.id} style={{ borderTop: "1px solid #f5f5f5" }}>
                                                <td colSpan={8} className="p-3">
                                                    <form onSubmit={handleUpdateLog} className="grid grid-cols-4 gap-3">
                                                        <input
                                                            className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                                                            type="date"
                                                            value={editLog.date}
                                                            onChange={(e) => setEditLog({ ...editLog, date: e.target.value })}
                                                            required
                                                        />
                                                        <select
                                                            className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                                                            value={editLog.method}
                                                            onChange={(e) => setEditLog({ ...editLog, method: e.target.value })}
                                                        >
                                                            <option value="drip">Drip</option>
                                                            <option value="sprinkler">Sprinkler</option>
                                                            <option value="flood">Flood</option>
                                                            <option value="none">None</option>
                                                        </select>
                                                        <input
                                                            className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                                                            type="number"
                                                            step="0.1"
                                                            placeholder="Duration (hrs)"
                                                            value={editLog.duration_hours}
                                                            onChange={(e) => setEditLog({ ...editLog, duration_hours: e.target.value })}
                                                        />
                                                        <input
                                                            className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                                                            type="number"
                                                            step="0.1"
                                                            placeholder="Gallons"
                                                            value={editLog.gallons_applied}
                                                            onChange={(e) => setEditLog({ ...editLog, gallons_applied: e.target.value })}
                                                        />
                                                        <input
                                                            className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                                                            type="number"
                                                            step="0.1"
                                                            placeholder="Moisture Before %"
                                                            value={editLog.soil_moisture_pct_before}
                                                            onChange={(e) => setEditLog({ ...editLog, soil_moisture_pct_before: e.target.value })}
                                                        />
                                                        <input
                                                            className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                                                            type="number"
                                                            step="0.1"
                                                            placeholder="Moisture After %"
                                                            value={editLog.soil_moisture_pct_after}
                                                            onChange={(e) => setEditLog({ ...editLog, soil_moisture_pct_after: e.target.value })}
                                                        />
                                                        <input
                                                            className="p-2 border rounded-md col-span-2 placeholder:text-gray-500 text-gray-900"
                                                            placeholder="Notes"
                                                            value={editLog.notes}
                                                            onChange={(e) => setEditLog({ ...editLog, notes: e.target.value })}
                                                        />
                                                        <div className="col-span-4 flex gap-2 justify-end">
                                                            <button type="submit" className="px-4 py-2 rounded-md" style={{ backgroundColor: "#9f1239", color: "#ffffff" }}>Save</button>
                                                            <button
                                                                type="button"
                                                                onClick={() => { setEditingLogId(null); setEditLog({ ...emptyForm }); }}
                                                                style={{ color: "#374151" }}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </form>
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return (
                                        <tr key={log.id} className="hover:bg-gray-50 transition" style={{ borderTop: "1px solid #f5f5f5" }}>
                                            <td className="p-3" style={{ color: "#171717" }}>{log.date}</td>
                                            <td className="p-3">
                                                <span
                                                    className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                                    style={methodStyles[log.method] || methodStyles.none}
                                                >
                                                    {log.method}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right" style={{ color: "#171717" }}>{log.duration_hours ?? "--"}</td>
                                            <td className="p-3 text-right" style={{ color: "#171717" }}>{log.gallons_applied ?? "--"}</td>
                                            <td className="p-3 text-right" style={{ color: "#171717" }}>{log.soil_moisture_pct_before != null ? `${log.soil_moisture_pct_before}%` : "--"}</td>
                                            <td className="p-3 text-right">
                                                <span style={{ color: "#171717" }}>
                                                    {log.soil_moisture_pct_after != null ? `${log.soil_moisture_pct_after}%` : "--"}
                                                </span>
                                                {moistureDelta != null && (
                                                    <span className="ml-1 inline-flex items-center text-xs" style={{ color: moistureDelta >= 0 ? "#166534" : "#991b1b" }}>
                                                        {moistureDelta >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                                        {Math.abs(moistureDelta).toFixed(1)}%
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-sm" style={{ color: "#6b7280" }}>{log.notes || "--"}</td>
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => startEditing(log)}
                                                        className="p-1 rounded hover:bg-gray-100 transition"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={14} style={{ color: "#9f1239" }} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteLog(log.id)}
                                                        className="p-1 rounded hover:bg-gray-100 transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} style={{ color: "#991b1b" }} />
                                                    </button>
                                                </div>
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
