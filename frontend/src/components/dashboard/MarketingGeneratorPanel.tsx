"use client";

import React, { useEffect, useState } from "react";
import { WandSparkles, Loader2 } from "lucide-react";
import api from "@/app/lib/api";

interface Wine {
    id: number;
    name: string;
    varietal: string;
    vintage: number | null;
}

interface GeneratedMaterial {
    id: number;
    category: string;
    generated_content: string;
    created_at: string;
}

const CATEGORIES = [
    { value: "email", label: "Email Campaign" },
    { value: "instagram", label: "Instagram Post" },
    { value: "shelf_talker", label: "Shelf Talker" },
    { value: "one_sheet", label: "One Sheet" },
    { value: "tasting_card", label: "Tasting Card" },
];

export default function MarketingGeneratorPanel() {
    const [wines, setWines] = useState<Wine[]>([]);
    const [category, setCategory] = useState("email");
    const [selectedWineId, setSelectedWineId] = useState<string>("");
    const [notes, setNotes] = useState("");
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<GeneratedMaterial | null>(null);
    const [history, setHistory] = useState<GeneratedMaterial[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        fetchWines();
        fetchHistory();
    }, []);

    const fetchWines = async () => {
        try {
            const response = await api.get("/my-wines/");
            setWines(response.data);
        } catch (error) {
            console.error("Error fetching wines:", error);
        }
    };

    const fetchHistory = async () => {
        try {
            const response = await api.get("/marketing/history/");
            setHistory(response.data);
        } catch (error) {
            console.error("Error fetching marketing history:", error);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        setResult(null);
        try {
            const payload: { category: string; wine_id?: number; notes?: string } = { category };
            if (selectedWineId) payload.wine_id = parseInt(selectedWineId);
            if (notes.trim()) payload.notes = notes.trim();

            const response = await api.post("/marketing/generate/", payload);
            setResult(response.data);
            setHistory([response.data, ...history]);
        } catch (error) {
            console.error("Error generating marketing material:", error);
            alert("Error generating content. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    const getCategoryLabel = (val: string) => CATEGORIES.find((c) => c.value === val)?.label || val;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Category</label>
                    <select
                        className="w-full p-2 border rounded-md text-gray-900"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        {CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Wine (optional)</label>
                    <select
                        className="w-full p-2 border rounded-md text-gray-900"
                        value={selectedWineId}
                        onChange={(e) => setSelectedWineId(e.target.value)}
                    >
                        <option value="">All wines / General</option>
                        {wines.map((w) => (
                            <option key={w.id} value={w.id}>
                                {w.name} {w.vintage ? `(${w.vintage})` : "(NV)"}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Additional Notes (optional)</label>
                <input
                    className="w-full p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                    placeholder="e.g. Focus on sustainability, mention our new vintage..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>

            <div className="flex gap-3">
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition"
                    style={{ backgroundColor: generating ? "#d1d5db" : "#e11d48", color: "#ffffff" }}
                    onMouseEnter={(e) => { if (!generating) e.currentTarget.style.backgroundColor = "#be123c"; }}
                    onMouseLeave={(e) => { if (!generating) e.currentTarget.style.backgroundColor = "#e11d48"; }}
                >
                    {generating ? <Loader2 className="animate-spin" size={18} /> : <WandSparkles size={18} />}
                    {generating ? "Generating..." : "Generate Material"}
                </button>
                {history.length > 0 && (
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="px-4 py-2 rounded-lg text-sm transition"
                        style={{ border: "1px solid #e5e5e5", color: "#374151" }}
                    >
                        {showHistory ? "Hide History" : `History (${history.length})`}
                    </button>
                )}
            </div>

            {result && (
                <div className="p-4 rounded-xl" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: "#fff1f2", color: "#9f1239" }}>
                            {getCategoryLabel(result.category)}
                        </span>
                        <span className="text-xs" style={{ color: "#374151" }}>Just generated</span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap" style={{ color: "#171717" }}>
                        {result.generated_content}
                    </div>
                </div>
            )}

            {showHistory && history.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold" style={{ color: "#374151" }}>Recent Generations</h4>
                    {history.map((item) => (
                        <div key={item.id} className="p-4 rounded-lg cursor-pointer hover:shadow-sm transition" style={{ backgroundColor: "#fafafa", border: "1px solid #f5f5f5" }} onClick={() => setResult(item)}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: "#fff1f2", color: "#9f1239" }}>
                                    {getCategoryLabel(item.category)}
                                </span>
                                <span className="text-xs" style={{ color: "#374151" }}>
                                    {new Date(item.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-sm mt-1 line-clamp-2" style={{ color: "#525252" }}>
                                {item.generated_content.substring(0, 120)}...
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
