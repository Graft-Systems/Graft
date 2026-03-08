"use client";

import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, MapPin } from "lucide-react";
import api from "@/app/lib/api";

interface Vineyard {
    id: number;
    name: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    total_acres: number | null;
    elevation_ft: number | null;
    soil_type: string;
    climate_zone: string;
    block_count: number;
}

interface VineyardForm {
    name: string;
    location: string;
    latitude: string;
    longitude: string;
    total_acres: string;
    elevation_ft: string;
    soil_type: string;
    climate_zone: string;
}

const emptyForm: VineyardForm = {
    name: "",
    location: "",
    latitude: "",
    longitude: "",
    total_acres: "",
    elevation_ft: "",
    soil_type: "",
    climate_zone: "",
};

function formToPayload(form: VineyardForm) {
    return {
        name: form.name,
        location: form.location || "",
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        total_acres: form.total_acres ? parseFloat(form.total_acres) : null,
        elevation_ft: form.elevation_ft ? parseFloat(form.elevation_ft) : null,
        soil_type: form.soil_type || "",
        climate_zone: form.climate_zone || "",
    };
}

export default function VineyardManagerPanel({ onSelectVineyard }: { onSelectVineyard?: (id: number) => void }) {
    const [vineyards, setVineyards] = useState<Vineyard[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newVineyard, setNewVineyard] = useState<VineyardForm>({ ...emptyForm });
    const [editVineyard, setEditVineyard] = useState<VineyardForm>({ ...emptyForm });
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    useEffect(() => {
        fetchVineyards();
    }, []);

    const fetchVineyards = async () => {
        try {
            const response = await api.get("/vigil/vineyards/");
            setVineyards(response.data);
        } catch (error) {
            console.error("Error fetching vineyards:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = formToPayload(newVineyard);
            const response = await api.post("/vigil/vineyards/", payload);
            setVineyards([...vineyards, response.data]);
            setShowAddForm(false);
            setNewVineyard({ ...emptyForm });
        } catch (error) {
            console.error("Post Error:", error);
            alert("Error adding vineyard. Check the console for details.");
        }
    };

    const startEditing = (v: Vineyard) => {
        setEditingId(v.id);
        setEditVineyard({
            name: v.name || "",
            location: v.location || "",
            latitude: v.latitude !== null ? String(v.latitude) : "",
            longitude: v.longitude !== null ? String(v.longitude) : "",
            total_acres: v.total_acres !== null ? String(v.total_acres) : "",
            elevation_ft: v.elevation_ft !== null ? String(v.elevation_ft) : "",
            soil_type: v.soil_type || "",
            climate_zone: v.climate_zone || "",
        });
        setShowAddForm(false);
        setConfirmDeleteId(null);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId) return;
        try {
            const payload = formToPayload(editVineyard);
            const response = await api.put(`/vigil/vineyards/${editingId}/`, payload);
            setVineyards(vineyards.map((v) => (v.id === editingId ? response.data : v)));
            setEditingId(null);
            setEditVineyard({ ...emptyForm });
        } catch (error) {
            console.error("Update Error:", error);
            alert("Error updating vineyard. Check the console for details.");
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/vigil/vineyards/${id}/`);
            setVineyards(vineyards.filter((v) => v.id !== id));
            setConfirmDeleteId(null);
        } catch (error) {
            console.error("Delete Error:", error);
            alert("Error deleting vineyard. Check the console for details.");
        }
    };

    const renderFormFields = (form: VineyardForm, setForm: (f: VineyardForm) => void) => (
        <>
            <input
                className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                placeholder="Vineyard Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
            />
            <input
                className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <input
                className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                type="number"
                step="any"
                placeholder="Latitude"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            />
            <input
                className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                type="number"
                step="any"
                placeholder="Longitude"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            />
            <input
                className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                type="number"
                step="any"
                placeholder="Total Acres"
                value={form.total_acres}
                onChange={(e) => setForm({ ...form, total_acres: e.target.value })}
            />
            <input
                className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                type="number"
                step="any"
                placeholder="Elevation (ft)"
                value={form.elevation_ft}
                onChange={(e) => setForm({ ...form, elevation_ft: e.target.value })}
            />
            <input
                className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                placeholder="Soil Type"
                value={form.soil_type}
                onChange={(e) => setForm({ ...form, soil_type: e.target.value })}
            />
            <input
                className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                placeholder="Climate Zone"
                value={form.climate_zone}
                onChange={(e) => setForm({ ...form, climate_zone: e.target.value })}
            />
        </>
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold" style={{ color: "#262626" }}>Vineyards</h3>
                <button
                    onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); setConfirmDeleteId(null); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-sm"
                    style={{ backgroundColor: "#9f1239", color: "#ffffff" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#be123c")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#9f1239")}
                >
                    <Plus size={18} /> Add Vineyard
                </button>
            </div>

            {showAddForm && (
                <form
                    onSubmit={handleAdd}
                    className="p-4 rounded-xl grid grid-cols-2 gap-4 mb-6"
                    style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}
                >
                    {renderFormFields(newVineyard, setNewVineyard)}
                    <div className="col-span-2 flex gap-2">
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-md transition"
                            style={{ backgroundColor: "#16a34a", color: "#ffffff" }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#15803d")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
                        >
                            Save Vineyard
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowAddForm(false); setNewVineyard({ ...emptyForm }); }}
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
            ) : vineyards.length === 0 ? (
                <div className="p-8 text-center rounded-xl" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                    <p style={{ color: "#374151" }}>No vineyards yet. Click &quot;Add Vineyard&quot; to get started.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid #f5f5f5" }}>
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e5e5e5" }}>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Name</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Location</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Acres</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Soil Type</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Climate Zone</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Blocks</th>
                                <th className="text-right p-3 font-semibold" style={{ color: "#374151" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vineyards.map((v) => (
                                <React.Fragment key={v.id}>
                                    {editingId === v.id ? (
                                        <tr>
                                            <td colSpan={7} className="p-3">
                                                <form
                                                    onSubmit={handleUpdate}
                                                    className="p-4 rounded-xl grid grid-cols-2 gap-4"
                                                    style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}
                                                >
                                                    {renderFormFields(editVineyard, setEditVineyard)}
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
                                                            onClick={() => { setEditingId(null); setEditVineyard({ ...emptyForm }); }}
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
                                                        <MapPin size={14} />
                                                    </div>
                                                    <span className="font-bold" style={{ color: "#171717" }}>{v.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-3" style={{ color: "#374151" }}>{v.location || "\u2014"}</td>
                                            <td className="p-3" style={{ color: "#374151" }}>{v.total_acres ?? "\u2014"}</td>
                                            <td className="p-3" style={{ color: "#374151" }}>{v.soil_type || "\u2014"}</td>
                                            <td className="p-3" style={{ color: "#374151" }}>{v.climate_zone || "\u2014"}</td>
                                            <td className="p-3" style={{ color: "#374151" }}>{v.block_count}</td>
                                            <td className="p-3">
                                                {onSelectVineyard && (
                                                    <button
                                                        onClick={() => onSelectVineyard(v.id)}
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
                                                        onClick={() => startEditing(v)}
                                                        className="p-1.5 rounded-md transition"
                                                        style={{ color: "#9f1239" }}
                                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fff1f2")}
                                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                                        title="Edit"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    {confirmDeleteId === v.id ? (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleDelete(v.id)}
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
                                                            onClick={() => setConfirmDeleteId(v.id)}
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
