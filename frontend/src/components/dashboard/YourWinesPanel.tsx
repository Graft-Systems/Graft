"use client";

import React, { useEffect, useState } from "react";
import { Plus, Wine as WineIcon, Loader2 } from "lucide-react";
import api from "@/app/lib/api";

interface Wine {
    id: number;
    name: string;
    varietal: string;
    vintage: number | null;
    region: string;
}

export default function YourWinesPanel() {
    const [wines, setWines] = useState<Wine[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingWineId, setEditingWineId] = useState<number | null>(null);
    const [editWine, setEditWine] = useState({ name: "", varietal: "", vintage: "", region: "" });

    // New Wine Form State
    const [newWine, setNewWine] = useState({ name: "", varietal: "", vintage: "", region: "" });

    useEffect(() => {
        fetchWines();
    }, []);

    const fetchWines = async () => {
        try {
            const response = await api.get("/my-wines/");
            setWines(response.data);
        } catch (error) {
            console.error("Error fetching wines:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddWine = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // 1. ADD THE TRAILING SLASH
            // 2. Ensure vintage is a number
            const payload = {
                ...newWine,
                vintage: newWine.vintage ? parseInt(newWine.vintage.toString()) : null,
            };

            const response = await api.post("/my-wines/", payload);

            setWines([...wines, response.data]);
            setShowAddForm(false);
            setNewWine({ name: "", varietal: "", vintage: "", region: "" });
        } catch (error) {
            console.error("Post Error:", error);
            alert("Error adding wine. Check the console for details.");
        }
    };

    const startEditing = (wine: Wine) => {
        setEditingWineId(wine.id);
        setEditWine({
            name: wine.name || "",
            varietal: wine.varietal || "",
            vintage: wine.vintage ? wine.vintage.toString() : "",
            region: wine.region || "",
        });
        setShowAddForm(false);
    };

    const handleUpdateWine = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingWineId) return;
        try {
            const payload = {
                ...editWine,
                vintage: editWine.vintage ? parseInt(editWine.vintage.toString()) : null,
            };

            const response = await api.put(`/my-wines/${editingWineId}/`, payload);
            setWines(wines.map((w) => (w.id === editingWineId ? response.data : w)));
            setEditingWineId(null);
            setEditWine({ name: "", varietal: "", vintage: "", region: "" });
        } catch (error) {
            console.error("Update Error:", error);
            alert("Error updating wine. Check the console for details.");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold" style={{ color: "#262626" }}>Your Portfolio</h3>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-sm"
                    style={{ backgroundColor: "#9f1239", color: "#ffffff" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#be123c"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#9f1239"}
                >
                    <Plus size={18} /> Add Wine
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={handleAddWine} className="p-4 rounded-xl grid grid-cols-2 gap-4 mb-6" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                    <input
                        className="p-2 border rounded-md"
                        placeholder="Wine Name"
                        value={newWine.name}
                        onChange={(e) => setNewWine({ ...newWine, name: e.target.value })}
                        required
                    />
                    <input
                        className="p-2 border rounded-md"
                        placeholder="Varietal"
                        value={newWine.varietal}
                        onChange={(e) => setNewWine({ ...newWine, varietal: e.target.value })}
                    />
                    <input
                        className="p-2 border rounded-md"
                        type="number"
                        placeholder="Vintage"
                        value={newWine.vintage}
                        onChange={(e) => setNewWine({ ...newWine, vintage: e.target.value })}
                    />
                    <input
                        className="p-2 border rounded-md"
                        placeholder="Region"
                        value={newWine.region}
                        onChange={(e) => setNewWine({ ...newWine, region: e.target.value })}
                    />
                    <div className="col-span-2 flex gap-2">
                        <button type="submit" className="px-4 py-2 rounded-md" style={{ backgroundColor: "#9f1239", color: "#ffffff" }}>Save Wine</button>
                        <button type="button" onClick={() => setShowAddForm(false)} style={{ color: "#737373" }}>Cancel</button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin" style={{ color: "#9f1239" }} /></div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {wines.map((wine) => (
                        <div key={wine.id} className="p-4 rounded-xl hover:shadow-md transition" style={{ backgroundColor: "#ffffff", border: "1px solid #f5f5f5" }}>
                            {editingWineId === wine.id ? (
                                <form onSubmit={handleUpdateWine} className="grid grid-cols-2 gap-3">
                                    <input
                                        className="p-2 border rounded-md"
                                        placeholder="Wine Name"
                                        value={editWine.name}
                                        onChange={(e) => setEditWine({ ...editWine, name: e.target.value })}
                                        required
                                    />
                                    <input
                                        className="p-2 border rounded-md"
                                        placeholder="Varietal"
                                        value={editWine.varietal}
                                        onChange={(e) => setEditWine({ ...editWine, varietal: e.target.value })}
                                    />
                                    <input
                                        className="p-2 border rounded-md"
                                        type="number"
                                        placeholder="Vintage"
                                        value={editWine.vintage}
                                        onChange={(e) => setEditWine({ ...editWine, vintage: e.target.value })}
                                    />
                                    <input
                                        className="p-2 border rounded-md"
                                        placeholder="Region"
                                        value={editWine.region}
                                        onChange={(e) => setEditWine({ ...editWine, region: e.target.value })}
                                    />
                                    <div className="col-span-2 flex gap-2 justify-end">
                                        <button type="submit" className="px-4 py-2 rounded-md" style={{ backgroundColor: "#9f1239", color: "#ffffff" }}>Save</button>
                                        <button
                                            type="button"
                                            onClick={() => { setEditingWineId(null); setEditWine({ name: "", varietal: "", vintage: "", region: "" }); }}
                                            style={{ color: "#737373" }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-full" style={{ backgroundColor: "#fff1f2", color: "#9f1239" }}>
                                            <WineIcon size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold" style={{ color: "#171717" }}>{wine.name}</h4>
                                            <p className="text-sm" style={{ color: "#737373" }}>{wine.vintage ?? "NV"} {wine.varietal} • {wine.region}</p>
                                        </div>
                                    </div>
                                    <button
                                        className="text-xs font-semibold hover:underline"
                                        style={{ color: "#9f1239" }}
                                        onClick={() => startEditing(wine)}
                                    >
                                        Edit Details
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}