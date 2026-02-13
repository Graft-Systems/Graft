"use client";

import React, { useEffect, useState } from "react";
import { Plus, Store as StoreIcon, Loader2 } from "lucide-react";
import api from "@/app/lib/api";

interface Store {
    id: number;
    name: string;
    neighborhood: string;
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
    contact_email: string;
    bottles?: number; // Optional, calculated from distribution data
    status?: string; // Optional, calculated from bottles
}

export default function StoreDistributionPanel() {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingStoreId, setEditingStoreId] = useState<number | null>(null);
    const [editStore, setEditStore] = useState({ 
        name: "", 
        neighborhood: "", 
        street_address: "", 
        city: "", 
        state: "", 
        zip_code: "", 
        contact_email: "" 
    });

    // New Store Form State
    const [newStore, setNewStore] = useState({ 
        name: "", 
        neighborhood: "", 
        street_address: "", 
        city: "", 
        state: "", 
        zip_code: "", 
        contact_email: "" 
    });

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            // Try to fetch stores - adjust endpoint as needed
            const response = await api.get("/my-stores/");
            setStores(response.data);
        } catch (error) {
            console.error("Error fetching stores:", error);
            // Fallback to empty array if endpoint doesn't exist yet
            setStores([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStore = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post("/my-stores/", newStore);
            setStores([...stores, response.data]);
            setShowAddForm(false);
            setNewStore({ name: "", neighborhood: "", street_address: "", city: "", state: "", zip_code: "", contact_email: "" });
        } catch (error) {
            console.error("Post Error:", error);
            alert("Error adding store. Check the console for details.");
        }
    };

    const startEditing = (store: Store) => {
        setEditingStoreId(store.id);
        setEditStore({
            name: store.name || "",
            neighborhood: store.neighborhood || "",
            street_address: store.street_address || "",
            city: store.city || "",
            state: store.state || "",
            zip_code: store.zip_code || "",
            contact_email: store.contact_email || "",
        });
        setShowAddForm(false);
    };

    const handleUpdateStore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStoreId) return;
        try {
            const response = await api.put(`/my-stores/${editingStoreId}/`, editStore);
            setStores(stores.map((s) => (s.id === editingStoreId ? response.data : s)));
            setEditingStoreId(null);
            setEditStore({ name: "", neighborhood: "", street_address: "", city: "", state: "", zip_code: "", contact_email: "" });
        } catch (error) {
            console.error("Update Error:", error);
            alert("Error updating store. Check the console for details.");
        }
    };

    const getStatusFromBottles = (bottles?: number): string => {
        if (!bottles || bottles === 0) return "Inactive";
        if (bottles < 5) return "Low Stock";
        return "Active";
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold" style={{ color: "#262626" }}>Store Distribution</h3>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-sm"
                    style={{ backgroundColor: "#9f1239", color: "#ffffff" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#be123c"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#9f1239"}
                >
                    <Plus size={18} /> Add Store
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={handleAddStore} className="p-4 rounded-xl grid grid-cols-2 gap-4 mb-6" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                    <input
                        className="p-2 border rounded-md"
                        placeholder="Store Name"
                        value={newStore.name}
                        onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                        required
                    />
                    <input
                        className="p-2 border rounded-md"
                        placeholder="Neighborhood"
                        value={newStore.neighborhood}
                        onChange={(e) => setNewStore({ ...newStore, neighborhood: e.target.value })}
                    />
                    <input
                        className="p-2 border rounded-md"
                        placeholder="Street Address"
                        value={newStore.street_address}
                        onChange={(e) => setNewStore({ ...newStore, street_address: e.target.value })}
                    />
                    <input
                        className="p-2 border rounded-md"
                        placeholder="City"
                        value={newStore.city}
                        onChange={(e) => setNewStore({ ...newStore, city: e.target.value })}
                    />
                    <input
                        className="p-2 border rounded-md"
                        placeholder="State"
                        value={newStore.state}
                        onChange={(e) => setNewStore({ ...newStore, state: e.target.value })}
                    />
                    <input
                        className="p-2 border rounded-md"
                        placeholder="Zip Code"
                        value={newStore.zip_code}
                        onChange={(e) => setNewStore({ ...newStore, zip_code: e.target.value })}
                    />
                    <input
                        className="p-2 border rounded-md col-span-2"
                        type="email"
                        placeholder="Contact Email"
                        value={newStore.contact_email}
                        onChange={(e) => setNewStore({ ...newStore, contact_email: e.target.value })}
                    />
                    <div className="col-span-2 flex gap-2">
                        <button type="submit" className="px-4 py-2 rounded-md" style={{ backgroundColor: "#9f1239", color: "#ffffff" }}>Save Store</button>
                        <button type="button" onClick={() => setShowAddForm(false)} style={{ color: "#737373" }}>Cancel</button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin" style={{ color: "#9f1239" }} /></div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {stores.length === 0 ? (
                        <div className="p-8 text-center rounded-xl" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                            <p style={{ color: "#737373" }}>No stores found. Add your first store to get started.</p>
                        </div>
                    ) : (
                        stores.map((store) => (
                            <div key={store.id} className="p-4 rounded-xl hover:shadow-md transition" style={{ backgroundColor: "#ffffff", border: "1px solid #f5f5f5" }}>
                                {editingStoreId === store.id ? (
                                    <form onSubmit={handleUpdateStore} className="grid grid-cols-2 gap-3">
                                        <input
                                            className="p-2 border rounded-md"
                                            placeholder="Store Name"
                                            value={editStore.name}
                                            onChange={(e) => setEditStore({ ...editStore, name: e.target.value })}
                                            required
                                        />
                                        <input
                                            className="p-2 border rounded-md"
                                            placeholder="Neighborhood"
                                            value={editStore.neighborhood}
                                            onChange={(e) => setEditStore({ ...editStore, neighborhood: e.target.value })}
                                        />
                                        <input
                                            className="p-2 border rounded-md"
                                            placeholder="Street Address"
                                            value={editStore.street_address}
                                            onChange={(e) => setEditStore({ ...editStore, street_address: e.target.value })}
                                        />
                                        <input
                                            className="p-2 border rounded-md"
                                            placeholder="City"
                                            value={editStore.city}
                                            onChange={(e) => setEditStore({ ...editStore, city: e.target.value })}
                                        />
                                        <input
                                            className="p-2 border rounded-md"
                                            placeholder="State"
                                            value={editStore.state}
                                            onChange={(e) => setEditStore({ ...editStore, state: e.target.value })}
                                        />
                                        <input
                                            className="p-2 border rounded-md"
                                            placeholder="Zip Code"
                                            value={editStore.zip_code}
                                            onChange={(e) => setEditStore({ ...editStore, zip_code: e.target.value })}
                                        />
                                        <input
                                            className="p-2 border rounded-md col-span-2"
                                            type="email"
                                            placeholder="Contact Email"
                                            value={editStore.contact_email}
                                            onChange={(e) => setEditStore({ ...editStore, contact_email: e.target.value })}
                                        />
                                        <div className="col-span-2 flex gap-2 justify-end">
                                            <button type="submit" className="px-4 py-2 rounded-md" style={{ backgroundColor: "#9f1239", color: "#ffffff" }}>Save</button>
                                            <button
                                                type="button"
                                                onClick={() => { setEditingStoreId(null); setEditStore({ name: "", neighborhood: "", street_address: "", city: "", state: "", zip_code: "", contact_email: "" }); }}
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
                                                <StoreIcon size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold" style={{ color: "#171717" }}>{store.name}</h4>
                                                <p className="text-sm" style={{ color: "#737373" }}>
                                                    {store.neighborhood && `${store.neighborhood} • `}
                                                    {store.city && store.state ? `${store.city}, ${store.state}` : store.city || store.state}
                                                    {store.bottles !== undefined && ` • ${store.bottles} bottles`}
                                                </p>
                                                {store.status && (
                                                    <span className="text-xs px-2 py-1 rounded mt-1 inline-block" 
                                                        style={{ 
                                                            backgroundColor: store.status === "Active" ? "#dcfce7" : store.status === "Low Stock" ? "#fef3c7" : "#fee2e2",
                                                            color: store.status === "Active" ? "#166534" : store.status === "Low Stock" ? "#92400e" : "#991b1b"
                                                        }}>
                                                        {store.status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            className="text-xs font-semibold hover:underline"
                                            style={{ color: "#9f1239" }}
                                            onClick={() => startEditing(store)}
                                        >
                                            Edit Details
                                        </button>
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
