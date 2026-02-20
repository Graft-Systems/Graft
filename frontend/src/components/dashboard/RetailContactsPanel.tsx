"use client";

import React, { useEffect, useState } from "react";
import { Plus, Phone, Loader2 } from "lucide-react";
import api from "@/app/lib/api";

interface Contact {
    id: number;
    store_name: string;
    contact_name: string;
    email: string;
    phone: string;
    last_contact_date: string | null;
    notes: string;
}

const emptyForm = { store_name: "", contact_name: "", email: "", phone: "", last_contact_date: "", notes: "" };

export default function RetailContactsPanel() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [editForm, setEditForm] = useState(emptyForm);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const response = await api.get("/retail-contacts/");
            setContacts(response.data);
        } catch (error) {
            console.error("Error fetching retail contacts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...form, last_contact_date: form.last_contact_date || null };
            const response = await api.post("/retail-contacts/", payload);
            setContacts([...contacts, response.data]);
            setShowAddForm(false);
            setForm(emptyForm);
        } catch (error) {
            console.error("Error adding contact:", error);
            alert("Error adding contact.");
        }
    };

    const startEditing = (c: Contact) => {
        setEditingId(c.id);
        setEditForm({
            store_name: c.store_name,
            contact_name: c.contact_name,
            email: c.email,
            phone: c.phone,
            last_contact_date: c.last_contact_date || "",
            notes: c.notes,
        });
        setShowAddForm(false);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId) return;
        try {
            const payload = { ...editForm, last_contact_date: editForm.last_contact_date || null };
            const response = await api.put(`/retail-contacts/${editingId}/`, payload);
            setContacts(contacts.map((c) => (c.id === editingId ? response.data : c)));
            setEditingId(null);
            setEditForm(emptyForm);
        } catch (error) {
            console.error("Error updating contact:", error);
            alert("Error updating contact.");
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/retail-contacts/${id}/`);
            setContacts(contacts.filter((c) => c.id !== id));
        } catch (error) {
            console.error("Error deleting contact:", error);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "Never";
        const d = new Date(dateStr + "T00:00:00");
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 30) return `${diffDays} days ago`;
        return d.toLocaleDateString();
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold" style={{ color: "#262626" }}>Retail Contacts</h3>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-sm"
                    style={{ backgroundColor: "#9f1239", color: "#ffffff" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#be123c"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#9f1239"}
                >
                    <Plus size={18} /> Add Contact
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={handleAdd} className="p-4 rounded-xl grid grid-cols-2 gap-4 mb-6" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                    <input className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500" placeholder="Store Name" value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} required />
                    <input className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500" placeholder="Contact Name" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} required />
                    <input className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    <input className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    <input className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500" type="date" placeholder="Last Contact Date" value={form.last_contact_date} onChange={(e) => setForm({ ...form, last_contact_date: e.target.value })} />
                    <input className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    <div className="col-span-2 flex gap-2">
                        <button type="submit" className="px-4 py-2 rounded-md" style={{ backgroundColor: "#9f1239", color: "#ffffff" }}>Save Contact</button>
                        <button type="button" onClick={() => setShowAddForm(false)} style={{ color: "#374151" }}>Cancel</button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin" style={{ color: "#9f1239" }} /></div>
            ) : (
                <div className="space-y-3">
                    {contacts.length === 0 ? (
                        <div className="p-8 text-center rounded-xl" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                            <p style={{ color: "#374151" }}>No retail contacts yet. Add your first buyer contact to keep track of relationships.</p>
                        </div>
                    ) : (
                        contacts.map((c) => (
                            <div key={c.id} className="p-4 rounded-xl hover:shadow-md transition" style={{ backgroundColor: "#ffffff", border: "1px solid #f5f5f5" }}>
                                {editingId === c.id ? (
                                    <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-3">
                                        <input className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500" placeholder="Store Name" value={editForm.store_name} onChange={(e) => setEditForm({ ...editForm, store_name: e.target.value })} required />
                                        <input className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500" placeholder="Contact Name" value={editForm.contact_name} onChange={(e) => setEditForm({ ...editForm, contact_name: e.target.value })} required />
                                        <input className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500" type="email" placeholder="Email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                                        <input className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500" placeholder="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                                        <input className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500" type="date" value={editForm.last_contact_date} onChange={(e) => setEditForm({ ...editForm, last_contact_date: e.target.value })} />
                                        <input className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500" placeholder="Notes" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                                        <div className="col-span-2 flex gap-2 justify-end">
                                            <button type="submit" className="px-4 py-2 rounded-md" style={{ backgroundColor: "#9f1239", color: "#ffffff" }}>Save</button>
                                            <button type="button" onClick={() => { setEditingId(null); setEditForm(emptyForm); }} style={{ color: "#374151" }}>Cancel</button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-full" style={{ backgroundColor: "#fff1f2", color: "#9f1239" }}>
                                                <Phone size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold" style={{ color: "#171717" }}>{c.store_name}</h4>
                                                <p className="text-sm" style={{ color: "#374151" }}>Buyer: {c.contact_name}</p>
                                                <p className="text-sm" style={{ color: "#374151" }}>
                                                    {c.phone && `${c.phone} • `}Last Contact: {formatDate(c.last_contact_date)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button className="text-xs font-semibold hover:underline" style={{ color: "#9f1239" }} onClick={() => startEditing(c)}>Edit</button>
                                            <button className="text-xs font-semibold hover:underline" style={{ color: "#991b1b" }} onClick={() => handleDelete(c.id)}>Delete</button>
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
