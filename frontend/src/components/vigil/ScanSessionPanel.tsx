"use client";

import React, { useEffect, useState } from "react";
import { Plus, Loader2, Pencil, Trash2, ChevronDown, ChevronUp, ScanLine } from "lucide-react";
import api from "@/app/lib/api";

interface ScanSession {
    id: number;
    block: number;
    scan_date: string;
    status: string;
    platform: string;
    notes: string;
    rows_scanned: number | null;
    total_images: number | null;
    total_clusters_detected: number | null;
    visible_clusters: number | null;
    occluded_clusters: number | null;
    avg_occlusion_pct: number | null;
}

interface ScanSessionPanelProps {
    blockId: number | null;
    onSelectScan?: (id: number) => void;
}

const PLATFORM_OPTIONS = ["rover", "tractor", "drone", "handheld"];

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
    pending: { bg: "#f5f5f5", text: "#525252" },
    in_progress: { bg: "#dbeafe", text: "#1e40af" },
    processing: { bg: "#fef9c3", text: "#854d0e" },
    completed: { bg: "#dcfce7", text: "#166534" },
    failed: { bg: "#fee2e2", text: "#991b1b" },
};

const emptyForm = { scan_date: "", platform: "rover", notes: "" };

export default function ScanSessionPanel({ blockId, onSelectScan }: ScanSessionPanelProps) {
    const [scans, setScans] = useState<ScanSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newScan, setNewScan] = useState({ ...emptyForm });
    const [editingScanId, setEditingScanId] = useState<number | null>(null);
    const [editScan, setEditScan] = useState({ scan_date: "", platform: "", notes: "" });
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        if (blockId !== null) {
            fetchScans();
        } else {
            setScans([]);
        }
    }, [blockId]);

    const fetchScans = async () => {
        setLoading(true);
        try {
            const response = await api.get("/vigil/scans/", { params: { block_id: blockId } });
            setScans(response.data);
        } catch (error) {
            console.error("Error fetching scans:", error);
            setScans([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddScan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                block: blockId,
                scan_date: newScan.scan_date,
                platform: newScan.platform,
                notes: newScan.notes,
            };
            const response = await api.post("/vigil/scans/", payload);
            setScans([...scans, response.data]);
            setShowAddForm(false);
            setNewScan({ ...emptyForm });
        } catch (error) {
            console.error("Post Error:", error);
            alert("Error creating scan session. Check the console for details.");
        }
    };

    const startEditing = (scan: ScanSession) => {
        setEditingScanId(scan.id);
        setEditScan({
            scan_date: scan.scan_date || "",
            platform: scan.platform || "rover",
            notes: scan.notes || "",
        });
        setShowAddForm(false);
    };

    const handleUpdateScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingScanId) return;
        try {
            const payload = {
                block: blockId,
                scan_date: editScan.scan_date,
                platform: editScan.platform,
                notes: editScan.notes,
            };
            const response = await api.put(`/vigil/scans/${editingScanId}/`, payload);
            setScans(scans.map((s) => (s.id === editingScanId ? response.data : s)));
            setEditingScanId(null);
            setEditScan({ scan_date: "", platform: "", notes: "" });
        } catch (error) {
            console.error("Update Error:", error);
            alert("Error updating scan session. Check the console for details.");
        }
    };

    const handleDeleteScan = async (id: number) => {
        if (!confirm("Are you sure you want to delete this scan session?")) return;
        try {
            await api.delete(`/vigil/scans/${id}/`);
            setScans(scans.filter((s) => s.id !== id));
            if (expandedId === id) setExpandedId(null);
            if (editingScanId === id) setEditingScanId(null);
        } catch (error) {
            console.error("Delete Error:", error);
            alert("Error deleting scan session. Check the console for details.");
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "--";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
    };

    const getStatusStyle = (status: string) => {
        return STATUS_STYLES[status] || STATUS_STYLES.pending;
    };

    if (blockId === null) {
        return (
            <div className="p-8 text-center rounded-xl" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                <p style={{ color: "#374151" }}>Select a block to view scans</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold" style={{ color: "#262626" }}>Scan Sessions</h3>
                <button
                    onClick={() => { setShowAddForm(!showAddForm); setEditingScanId(null); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-sm"
                    style={{ backgroundColor: "#9f1239", color: "#ffffff" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#be123c"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#9f1239"}
                >
                    <Plus size={18} /> New Scan Session
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={handleAddScan} className="p-4 rounded-xl grid grid-cols-2 gap-4 mb-6" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                    <input
                        className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                        type="datetime-local"
                        placeholder="Scan Date"
                        value={newScan.scan_date}
                        onChange={(e) => setNewScan({ ...newScan, scan_date: e.target.value })}
                        required
                    />
                    <select
                        className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                        value={newScan.platform}
                        onChange={(e) => setNewScan({ ...newScan, platform: e.target.value })}
                        required
                    >
                        {PLATFORM_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                        ))}
                    </select>
                    <textarea
                        className="p-2 border rounded-md col-span-2 placeholder:text-gray-500 text-gray-900"
                        placeholder="Notes (optional)"
                        rows={2}
                        value={newScan.notes}
                        onChange={(e) => setNewScan({ ...newScan, notes: e.target.value })}
                    />
                    <div className="col-span-2 flex gap-2">
                        <button type="submit" className="px-4 py-2 rounded-md" style={{ backgroundColor: "#9f1239", color: "#ffffff" }}>Save Scan</button>
                        <button type="button" onClick={() => setShowAddForm(false)} style={{ color: "#374151" }}>Cancel</button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin" style={{ color: "#9f1239" }} />
                </div>
            ) : scans.length === 0 ? (
                <div className="p-8 text-center rounded-xl" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                    <p style={{ color: "#374151" }}>No scan sessions found for this block.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid #f5f5f5" }}>
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ backgroundColor: "#fafafa" }}>
                                <th className="text-left p-3 font-semibold" style={{ color: "#525252" }}></th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#525252" }}>Scan Date</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#525252" }}>Status</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#525252" }}>Platform</th>
                                <th className="text-right p-3 font-semibold" style={{ color: "#525252" }}>Rows</th>
                                <th className="text-right p-3 font-semibold" style={{ color: "#525252" }}>Images</th>
                                <th className="text-right p-3 font-semibold" style={{ color: "#525252" }}>Clusters</th>
                                <th className="text-right p-3 font-semibold" style={{ color: "#525252" }}>Visible</th>
                                <th className="text-right p-3 font-semibold" style={{ color: "#525252" }}>Occluded</th>
                                <th className="text-right p-3 font-semibold" style={{ color: "#525252" }}>Avg Occ %</th>
                                <th className="text-right p-3 font-semibold" style={{ color: "#525252" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scans.map((scan) => {
                                const statusStyle = getStatusStyle(scan.status);
                                const isExpanded = expandedId === scan.id;
                                const isEditing = editingScanId === scan.id;

                                return (
                                    <React.Fragment key={scan.id}>
                                        <tr
                                            className="transition cursor-pointer"
                                            style={{ backgroundColor: isExpanded ? "#fefce8" : "#ffffff", borderBottom: "1px solid #f5f5f5" }}
                                            onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = "#fafafa"; }}
                                            onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = "#ffffff"; }}
                                            onClick={() => { if (!isEditing) setExpandedId(isExpanded ? null : scan.id); }}
                                        >
                                            <td className="p-3">
                                                {isExpanded ? <ChevronUp size={16} style={{ color: "#525252" }} /> : <ChevronDown size={16} style={{ color: "#6b7280" }} />}
                                            </td>
                                            <td className="p-3 font-medium" style={{ color: "#171717" }}>{formatDate(scan.scan_date)}</td>
                                            <td className="p-3">
                                                <span
                                                    className="text-xs font-semibold px-2 py-1 rounded-full"
                                                    style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                                                >
                                                    {scan.status.replace("_", " ")}
                                                </span>
                                            </td>
                                            <td className="p-3" style={{ color: "#374151" }}>{scan.platform.charAt(0).toUpperCase() + scan.platform.slice(1)}</td>
                                            <td className="p-3 text-right" style={{ color: "#374151" }}>{scan.rows_scanned ?? "--"}</td>
                                            <td className="p-3 text-right" style={{ color: "#374151" }}>{scan.total_images ?? "--"}</td>
                                            <td className="p-3 text-right font-semibold" style={{ color: "#171717" }}>{scan.total_clusters_detected ?? "--"}</td>
                                            <td className="p-3 text-right" style={{ color: "#166534" }}>{scan.visible_clusters ?? "--"}</td>
                                            <td className="p-3 text-right" style={{ color: "#854d0e" }}>{scan.occluded_clusters ?? "--"}</td>
                                            <td className="p-3 text-right" style={{ color: "#374151" }}>
                                                {scan.avg_occlusion_pct !== null ? `${Number(scan.avg_occlusion_pct).toFixed(1)}%` : "--"}
                                            </td>
                                            <td className="p-3">
                                                {onSelectScan && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onSelectScan(scan.id); }}
                                                        className="text-xs px-2 py-1 rounded-md transition font-medium"
                                                        style={{ backgroundColor: "#fff1f2", color: "#9f1239" }}
                                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ffe4e6")}
                                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff1f2")}
                                                    >
                                                        Select
                                                    </button>
                                                )}
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        className="p-1 rounded transition"
                                                        style={{ color: "#9f1239" }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fff1f2"}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                                        onClick={() => startEditing(scan)}
                                                        title="Edit"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        className="p-1 rounded transition"
                                                        style={{ color: "#991b1b" }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fee2e2"}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                                        onClick={() => handleDeleteScan(scan.id)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded detail / edit row */}
                                        {isExpanded && (
                                            <tr style={{ backgroundColor: "#fefce8" }}>
                                                <td colSpan={11} className="p-4">
                                                    {isEditing ? (
                                                        <form onSubmit={handleUpdateScan} className="grid grid-cols-2 gap-4 p-4 rounded-xl" style={{ backgroundColor: "#ffffff", border: "1px solid #ffe4e6" }}>
                                                            <input
                                                                className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                                                                type="datetime-local"
                                                                value={editScan.scan_date}
                                                                onChange={(e) => setEditScan({ ...editScan, scan_date: e.target.value })}
                                                                required
                                                            />
                                                            <select
                                                                className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                                                                value={editScan.platform}
                                                                onChange={(e) => setEditScan({ ...editScan, platform: e.target.value })}
                                                                required
                                                            >
                                                                {PLATFORM_OPTIONS.map((opt) => (
                                                                    <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                                                                ))}
                                                            </select>
                                                            <textarea
                                                                className="p-2 border rounded-md col-span-2 placeholder:text-gray-500 text-gray-900"
                                                                placeholder="Notes"
                                                                rows={2}
                                                                value={editScan.notes}
                                                                onChange={(e) => setEditScan({ ...editScan, notes: e.target.value })}
                                                            />
                                                            <div className="col-span-2 flex gap-2 justify-end">
                                                                <button type="submit" className="px-4 py-2 rounded-md" style={{ backgroundColor: "#9f1239", color: "#ffffff" }}>Save</button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { setEditingScanId(null); setEditScan({ scan_date: "", platform: "", notes: "" }); }}
                                                                    style={{ color: "#374151" }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </form>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="p-2 rounded-full" style={{ backgroundColor: "#fff1f2", color: "#9f1239" }}>
                                                                    <ScanLine size={18} />
                                                                </div>
                                                                <h4 className="font-bold" style={{ color: "#171717" }}>Scan Detail</h4>
                                                            </div>
                                                            <div className="grid grid-cols-4 gap-4">
                                                                <div className="p-3 rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid #f5f5f5" }}>
                                                                    <div className="text-xs" style={{ color: "#6b7280" }}>Rows Scanned</div>
                                                                    <div className="font-bold text-lg" style={{ color: "#171717" }}>{scan.rows_scanned ?? "--"}</div>
                                                                </div>
                                                                <div className="p-3 rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid #f5f5f5" }}>
                                                                    <div className="text-xs" style={{ color: "#6b7280" }}>Total Images</div>
                                                                    <div className="font-bold text-lg" style={{ color: "#171717" }}>{scan.total_images ?? "--"}</div>
                                                                </div>
                                                                <div className="p-3 rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid #f5f5f5" }}>
                                                                    <div className="text-xs" style={{ color: "#6b7280" }}>Total Clusters</div>
                                                                    <div className="font-bold text-lg" style={{ color: "#171717" }}>{scan.total_clusters_detected ?? "--"}</div>
                                                                </div>
                                                                <div className="p-3 rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid #f5f5f5" }}>
                                                                    <div className="text-xs" style={{ color: "#6b7280" }}>Avg Occlusion</div>
                                                                    <div className="font-bold text-lg" style={{ color: "#171717" }}>
                                                                        {scan.avg_occlusion_pct !== null ? `${Number(scan.avg_occlusion_pct).toFixed(1)}%` : "--"}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="p-3 rounded-lg" style={{ backgroundColor: "#dcfce7", border: "1px solid #bbf7d0" }}>
                                                                    <div className="text-xs" style={{ color: "#166534" }}>Visible Clusters</div>
                                                                    <div className="font-bold text-lg" style={{ color: "#166534" }}>{scan.visible_clusters ?? "--"}</div>
                                                                </div>
                                                                <div className="p-3 rounded-lg" style={{ backgroundColor: "#fef9c3", border: "1px solid #fde68a" }}>
                                                                    <div className="text-xs" style={{ color: "#854d0e" }}>Occluded Clusters</div>
                                                                    <div className="font-bold text-lg" style={{ color: "#854d0e" }}>{scan.occluded_clusters ?? "--"}</div>
                                                                </div>
                                                            </div>
                                                            {scan.notes && (
                                                                <div className="p-3 rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid #f5f5f5" }}>
                                                                    <div className="text-xs mb-1" style={{ color: "#6b7280" }}>Notes</div>
                                                                    <p className="text-sm" style={{ color: "#374151" }}>{scan.notes}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
