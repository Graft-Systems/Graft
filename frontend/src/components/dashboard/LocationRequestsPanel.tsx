"use client";

import React, { useEffect, useState } from "react";
import { Plus, MapPin, Loader2 } from "lucide-react";
import api from "@/app/lib/api";

interface LocationReq {
    id: number;
    store_name: string;
    neighborhood: string;
    city: string;
    state: string;
    stage: string;
    fit_score: number | null;
    notes: string;
    created_at: string;
}

const STAGE_LABELS: Record<string, string> = {
    requested: "Requested",
    outreach: "Outreach",
    tasting_scheduled: "Tasting Scheduled",
    approved: "Approved",
    rejected: "Rejected",
};

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
    requested: { bg: "#dbeafe", text: "#1e40af" },
    outreach: { bg: "#fef3c7", text: "#92400e" },
    tasting_scheduled: { bg: "#ede9fe", text: "#5b21b6" },
    approved: { bg: "#dcfce7", text: "#166534" },
    rejected: { bg: "#fee2e2", text: "#991b1b" },
};

const emptyForm = { store_name: "", neighborhood: "", city: "", state: "", stage: "requested", fit_score: "", notes: "" };

export default function LocationRequestsPanel() {
    const [requests, setRequests] = useState<LocationReq[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [editForm, setEditForm] = useState(emptyForm);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await api.get("/location-requests/");
            setRequests(response.data);
        } catch (error) {
            console.error("Error fetching location requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...form, fit_score: form.fit_score ? parseInt(form.fit_score) : null };
            const response = await api.post("/location-requests/", payload);
            setRequests([response.data, ...requests]);
            setShowAddForm(false);
            setForm(emptyForm);
        } catch (error) {
            console.error("Error adding location request:", error);
            alert("Error adding location request.");
        }
    };

    const startEditing = (req: LocationReq) => {
        setEditingId(req.id);
        setEditForm({
            store_name: req.store_name,
            neighborhood: req.neighborhood,
            city: req.city,
            state: req.state,
            stage: req.stage,
            fit_score: req.fit_score?.toString() ?? "",
            notes: req.notes,
        });
        setShowAddForm(false);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId) return;
        try {
            const payload = { ...editForm, fit_score: editForm.fit_score ? parseInt(editForm.fit_score) : null };
            const response = await api.put(`/location-requests/${editingId}/`, payload);
            setRequests(requests.map((r) => (r.id === editingId ? response.data : r)));
            setEditingId(null);
            setEditForm(emptyForm);
        } catch (error) {
            console.error("Error updating location request:", error);
            alert("Error updating location request.");
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/location-requests/${id}/`);
            setRequests(requests.filter((r) => r.id !== id));
        } catch (error) {
            console.error("Error deleting location request:", error);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold" style={{ color: "#262626" }}>Location Requests</h3>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-sm"
                    style={{ backgroundColor: "#9f1239", color: "#ffffff" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#be123c"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#9f1239"}
                >
                    <Plus size={18} /> New Request
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={handleAdd} className="p-4 rounded-xl grid grid-cols-2 gap-4 mb-6" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                    <input className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500" placeholder="Store Name" value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} required />
                    <input className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500" placeholder="Neighborhood" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />
                    <input className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                    <input className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                    <select className="p-2 border rounded-md text-gray-900" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
                        {Object.entries(STAGE_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                        ))}
                    </select>
                    <input className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500" type="number" placeholder="Fit Score (0-100)" value={form.fit_score} onChange={(e) => setForm({ ...form, fit_score: e.target.value })} />
                    <input className="p-2 border rounded-md col-span-2 text-gray-900 placeholder:text-gray-500" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    <div className="col-span-2 flex gap-2">
                        <button type="submit" className="px-4 py-2 rounded-md" style={{ backgroundColor: "#9f1239", color: "#ffffff" }}>Save Request</button>
                        <button type="button" onClick={() => setShowAddForm(false)} style={{ color: "#374151" }}>Cancel</button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin" style={{ color: "#9f1239" }} /></div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {requests.length === 0 ? (
                        <div className="p-8 text-center rounded-xl" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                            <p style={{ color: "#374151" }}>No location requests yet. Add your first request to start tracking outreach.</p>
                        </div>
                    ) : (
                        requests.map((req) => (
                            <div key={req.id} className="p-4 rounded-xl hover:shadow-md transition" style={{ backgroundColor: "#ffffff", border: "1px solid #f5f5f5" }}>
                                {editingId === req.id ? (
                                    <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-3">
                                        <input className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500" placeholder="Store Name" value={editForm.store_name} onChange={(e) => setEditForm({ ...editForm, store_name: e.target.value })} required />
                                        <input className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500" placeholder="Neighborhood" value={editForm.neighborhood} onChange={(e) => setEditForm({ ...editForm, neighborhood: e.target.value })} />
                                        <input className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500" placeholder="City" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                                        <input className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500" placeholder="State" value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} />
                                        <select className="p-2 border rounded-md text-gray-900" value={editForm.stage} onChange={(e) => setEditForm({ ...editForm, stage: e.target.value })}>
                                            {Object.entries(STAGE_LABELS).map(([val, label]) => (
                                                <option key={val} value={val}>{label}</option>
                                            ))}
                                        </select>
                                        <input className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500" type="number" placeholder="Fit Score" value={editForm.fit_score} onChange={(e) => setEditForm({ ...editForm, fit_score: e.target.value })} />
                                        <input className="p-2 border rounded-md col-span-2 text-gray-900 placeholder:text-gray-500" placeholder="Notes" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                                        <div className="col-span-2 flex gap-2 justify-end">
                                            <button type="submit" className="px-4 py-2 rounded-md" style={{ backgroundColor: "#9f1239", color: "#ffffff" }}>Save</button>
                                            <button type="button" onClick={() => { setEditingId(null); setEditForm(emptyForm); }} style={{ color: "#374151" }}>Cancel</button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-full" style={{ backgroundColor: "#fff1f2", color: "#9f1239" }}>
                                                <MapPin size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold" style={{ color: "#171717" }}>{req.store_name}</h4>
                                                <p className="text-sm" style={{ color: "#374151" }}>
                                                    {req.neighborhood && `${req.neighborhood} • `}
                                                    {req.city && req.state ? `${req.city}, ${req.state}` : req.city || req.state}
                                                    {req.fit_score !== null && ` • Fit: ${req.fit_score}`}
                                                </p>
                                                <span
                                                    className="text-xs px-2 py-1 rounded mt-1 inline-block font-semibold"
                                                    style={{
                                                        backgroundColor: STAGE_COLORS[req.stage]?.bg || "#f5f5f5",
                                                        color: STAGE_COLORS[req.stage]?.text || "#525252",
                                                    }}
                                                >
                                                    {STAGE_LABELS[req.stage] || req.stage}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button className="text-xs font-semibold hover:underline" style={{ color: "#9f1239" }} onClick={() => startEditing(req)}>Edit</button>
                                            <button className="text-xs font-semibold hover:underline" style={{ color: "#991b1b" }} onClick={() => handleDelete(req.id)}>Delete</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
