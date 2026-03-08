"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2, Grid3X3 } from "lucide-react";
import api from "@/app/lib/api";

interface Block {
    id: number;
    vineyard: number;
    name: string;
    grape_species: string;
    acres: number | null;
    vine_count: number | null;
    row_count: number | null;
    vine_spacing_ft: number | null;
    row_spacing_ft: number | null;
    trellis_system: string;
    rootstock: string;
    year_planted: number | null;
    scan_count: number;
    latest_scan_date: string | null;
}

interface BlockForm {
    name: string;
    grape_species: string;
    acres: string;
    row_count: string;
    vine_count: string;
    vine_spacing_ft: string;
    row_spacing_ft: string;
    trellis_system: string;
    rootstock: string;
    year_planted: string;
}

const emptyForm: BlockForm = {
    name: "",
    grape_species: "",
    acres: "",
    row_count: "",
    vine_count: "",
    vine_spacing_ft: "",
    row_spacing_ft: "",
    trellis_system: "",
    rootstock: "",
    year_planted: "",
};

function formToPayload(form: BlockForm, vineyardId: number) {
    return {
        vineyard: vineyardId,
        name: form.name,
        grape_species: form.grape_species,
        acres: form.acres ? parseFloat(form.acres) : null,
        row_count: form.row_count ? parseInt(form.row_count) : null,
        vine_count: form.vine_count ? parseInt(form.vine_count) : null,
        vine_spacing_ft: form.vine_spacing_ft ? parseFloat(form.vine_spacing_ft) : null,
        row_spacing_ft: form.row_spacing_ft ? parseFloat(form.row_spacing_ft) : null,
        trellis_system: form.trellis_system || "",
        rootstock: form.rootstock || "",
        year_planted: form.year_planted ? parseInt(form.year_planted) : null,
    };
}

interface BlockManagerPanelProps {
    vineyardId: number | null;
    onSelectBlock?: (id: number) => void;
}

export default function BlockManagerPanel({ vineyardId, onSelectBlock }: BlockManagerPanelProps) {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newBlock, setNewBlock] = useState<BlockForm>({ ...emptyForm });
    const [editBlock, setEditBlock] = useState<BlockForm>({ ...emptyForm });
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const fetchBlocks = useCallback(async () => {
        if (vineyardId === null) {
            setBlocks([]);
            return;
        }
        setLoading(true);
        try {
            const response = await api.get("/vigil/blocks/", { params: { vineyard_id: vineyardId } });
            setBlocks(response.data);
        } catch (error) {
            console.error("Error fetching blocks:", error);
        } finally {
            setLoading(false);
        }
    }, [vineyardId]);

    useEffect(() => {
        fetchBlocks();
        setShowAddForm(false);
        setEditingId(null);
        setConfirmDeleteId(null);
    }, [fetchBlocks]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (vineyardId === null) return;
        try {
            const payload = formToPayload(newBlock, vineyardId);
            const response = await api.post("/vigil/blocks/", payload);
            setBlocks([...blocks, response.data]);
            setShowAddForm(false);
            setNewBlock({ ...emptyForm });
        } catch (error) {
            console.error("Post Error:", error);
            alert("Error adding block. Check the console for details.");
        }
    };

    const startEditing = (b: Block) => {
        setEditingId(b.id);
        setEditBlock({
            name: b.name || "",
            grape_species: b.grape_species || "",
            acres: b.acres !== null ? String(b.acres) : "",
            row_count: b.row_count !== null ? String(b.row_count) : "",
            vine_count: b.vine_count !== null ? String(b.vine_count) : "",
            vine_spacing_ft: b.vine_spacing_ft !== null ? String(b.vine_spacing_ft) : "",
            row_spacing_ft: b.row_spacing_ft !== null ? String(b.row_spacing_ft) : "",
            trellis_system: b.trellis_system || "",
            rootstock: b.rootstock || "",
            year_planted: b.year_planted !== null ? String(b.year_planted) : "",
        });
        setShowAddForm(false);
        setConfirmDeleteId(null);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId || vineyardId === null) return;
        try {
            const payload = formToPayload(editBlock, vineyardId);
            const response = await api.put(`/vigil/blocks/${editingId}/`, payload);
            setBlocks(blocks.map((b) => (b.id === editingId ? response.data : b)));
            setEditingId(null);
            setEditBlock({ ...emptyForm });
        } catch (error) {
            console.error("Update Error:", error);
            alert("Error updating block. Check the console for details.");
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/vigil/blocks/${id}/`);
            setBlocks(blocks.filter((b) => b.id !== id));
            setConfirmDeleteId(null);
        } catch (error) {
            console.error("Delete Error:", error);
            alert("Error deleting block. Check the console for details.");
        }
    };

    const renderFormFields = (form: BlockForm, setForm: (f: BlockForm) => void) => (
        <>
            <input
                className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                placeholder="Block Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
            />
            <input
                className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                placeholder="Grape Species *"
                value={form.grape_species}
                onChange={(e) => setForm({ ...form, grape_species: e.target.value })}
                required
            />
            <input
                className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                type="number"
                step="any"
                placeholder="Acres"
                value={form.acres}
                onChange={(e) => setForm({ ...form, acres: e.target.value })}
            />
            <input
                className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                type="number"
                placeholder="Row Count"
                value={form.row_count}
                onChange={(e) => setForm({ ...form, row_count: e.target.value })}
            />
            <input
                className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                type="number"
                placeholder="Vine Count"
                value={form.vine_count}
                onChange={(e) => setForm({ ...form, vine_count: e.target.value })}
            />
            <input
                className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                type="number"
                step="any"
                placeholder="Vine Spacing (ft)"
                value={form.vine_spacing_ft}
                onChange={(e) => setForm({ ...form, vine_spacing_ft: e.target.value })}
            />
            <input
                className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                type="number"
                step="any"
                placeholder="Row Spacing (ft)"
                value={form.row_spacing_ft}
                onChange={(e) => setForm({ ...form, row_spacing_ft: e.target.value })}
            />
            <input
                className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                placeholder="Trellis System"
                value={form.trellis_system}
                onChange={(e) => setForm({ ...form, trellis_system: e.target.value })}
            />
            <input
                className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                placeholder="Rootstock"
                value={form.rootstock}
                onChange={(e) => setForm({ ...form, rootstock: e.target.value })}
            />
            <input
                className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                type="number"
                placeholder="Year Planted"
                value={form.year_planted}
                onChange={(e) => setForm({ ...form, year_planted: e.target.value })}
            />
        </>
    );

    if (vineyardId === null) {
        return (
            <div className="space-y-4">
                <h3 className="text-xl font-bold" style={{ color: "#262626" }}>Blocks</h3>
                <div className="p-8 text-center rounded-xl" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                    <p style={{ color: "#374151" }}>Select a vineyard to view blocks.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold" style={{ color: "#262626" }}>Blocks</h3>
                <button
                    onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); setConfirmDeleteId(null); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-sm"
                    style={{ backgroundColor: "#9f1239", color: "#ffffff" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#be123c")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#9f1239")}
                >
                    <Plus size={18} /> Add Block
                </button>
            </div>

            {showAddForm && (
                <form
                    onSubmit={handleAdd}
                    className="p-4 rounded-xl grid grid-cols-2 gap-4 mb-6"
                    style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}
                >
                    {renderFormFields(newBlock, setNewBlock)}
                    <div className="col-span-2 flex gap-2">
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-md transition"
                            style={{ backgroundColor: "#16a34a", color: "#ffffff" }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#15803d")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
                        >
                            Save Block
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowAddForm(false); setNewBlock({ ...emptyForm }); }}
                            className="px-4 py-2 rounded-md transition"
                            style={{ color: "#374151" }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin" style={{ color: "#9f1239" }} />
                </div>
            ) : blocks.length === 0 ? (
                <div className="p-8 text-center rounded-xl" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                    <p style={{ color: "#374151" }}>No blocks yet. Click &quot;Add Block&quot; to get started.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid #f5f5f5" }}>
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e5e5e5" }}>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Name</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Grape Species</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Acres</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Vines</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Rows</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Trellis</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Rootstock</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Planted</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Scans</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Latest Scan</th>
                                <th className="text-right p-3 font-semibold" style={{ color: "#374151" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {blocks.map((b) => (
                                <React.Fragment key={b.id}>
                                    {editingId === b.id ? (
                                        <tr>
                                            <td colSpan={11} className="p-3">
                                                <form
                                                    onSubmit={handleUpdate}
                                                    className="p-4 rounded-xl grid grid-cols-2 gap-4"
                                                    style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}
                                                >
                                                    {renderFormFields(editBlock, setEditBlock)}
                                                    <div className="col-span-2 flex gap-2 justify-end">
                                                        <button
                                                            type="submit"
                                                            className="px-4 py-2 rounded-md transition"
                                                            style={{ backgroundColor: "#16a34a", color: "#ffffff" }}
                                                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#15803d")}
                                                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setEditingId(null); setEditBlock({ ...emptyForm }); }}
                                                            className="px-4 py-2 rounded-md transition"
                                                            style={{ color: "#374151" }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </form>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr
                                            className="transition"
                                            style={{ borderBottom: "1px solid #f5f5f5" }}
                                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fff1f2")}
                                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                        >
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 rounded-full" style={{ backgroundColor: "#fff1f2", color: "#9f1239" }}>
                                                        <Grid3X3 size={14} />
                                                    </div>
                                                    <span className="font-bold" style={{ color: "#171717" }}>{b.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-3" style={{ color: "#374151" }}>{b.grape_species || "\u2014"}</td>
                                            <td className="p-3" style={{ color: "#374151" }}>{b.acres ?? "\u2014"}</td>
                                            <td className="p-3" style={{ color: "#374151" }}>{b.vine_count ?? "\u2014"}</td>
                                            <td className="p-3" style={{ color: "#374151" }}>{b.row_count ?? "\u2014"}</td>
                                            <td className="p-3" style={{ color: "#374151" }}>{b.trellis_system || "\u2014"}</td>
                                            <td className="p-3" style={{ color: "#374151" }}>{b.rootstock || "\u2014"}</td>
                                            <td className="p-3" style={{ color: "#374151" }}>{b.year_planted ?? "\u2014"}</td>
                                            <td className="p-3" style={{ color: "#374151" }}>{b.scan_count}</td>
                                            <td className="p-3" style={{ color: "#374151" }}>{b.latest_scan_date || "\u2014"}</td>
                                            <td className="p-3">
                                                {onSelectBlock && (
                                                    <button
                                                        onClick={() => onSelectBlock(b.id)}
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
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => startEditing(b)}
                                                        className="p-1.5 rounded-md transition"
                                                        style={{ color: "#9f1239" }}
                                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fff1f2")}
                                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                                        title="Edit"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    {confirmDeleteId === b.id ? (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleDelete(b.id)}
                                                                className="px-2 py-1 text-xs rounded-md transition"
                                                                style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
                                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#b91c1c")}
                                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#dc2626")}
                                                            >
                                                                Confirm
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmDeleteId(null)}
                                                                className="px-2 py-1 text-xs rounded-md"
                                                                style={{ color: "#374151" }}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setConfirmDeleteId(b.id)}
                                                            className="p-1.5 rounded-md transition"
                                                            style={{ color: "#6b7280" }}
                                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fef2f2"; e.currentTarget.style.color = "#dc2626"; }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#6b7280"; }}
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
