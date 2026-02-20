"use client";

import React, { useEffect, useState } from "react";
import { Loader2, TrendingDown } from "lucide-react";
import api from "@/app/lib/api";

interface Prediction {
    id: number;
    store: string;
    wine: string;
    eta: string;
    days_left: number;
    cases: number;
}

export default function OrderingPredictionsPanel() {
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPredictions();
    }, []);

    const fetchPredictions = async () => {
        try {
            const response = await api.get("/ordering-predictions/");
            setPredictions(response.data);
        } catch (error) {
            console.error("Error fetching ordering predictions:", error);
            setPredictions([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="animate-spin" style={{ color: "#9f1239" }} />
            </div>
        );
    }

    if (predictions.length === 0) {
        return (
            <div className="p-8 text-center rounded-xl" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                <p style={{ color: "#374151" }}>No reorder predictions yet. Data will appear as store placement statuses are tracked.</p>
            </div>
        );
    }

    return (
        <ul className="space-y-2">
            {predictions.map((p) => (
                <li key={p.id} className="p-4 rounded-lg flex items-center justify-between" style={{ backgroundColor: "#fafafa", border: "1px solid #f5f5f5" }}>
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full" style={{ backgroundColor: p.days_left <= 7 ? "#fee2e2" : "#fff1f2", color: p.days_left <= 7 ? "#991b1b" : "#9f1239" }}>
                            <TrendingDown size={20} />
                        </div>
                        <div>
                            <div className="font-semibold" style={{ color: "#171717" }}>{p.store}</div>
                            <div className="text-sm" style={{ color: "#374151" }}>{p.wine} &middot; Likely reorder: {p.eta}</div>
                        </div>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded" style={{ backgroundColor: "#f5f5f5", color: "#525252" }}>
                        {p.cases} {p.cases === 1 ? "case" : "cases"}
                    </span>
                </li>
            ))}
        </ul>
    );
}
