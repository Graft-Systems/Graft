"use client";

import React, { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import api from "@/app/lib/api";

interface Neighborhood {
    name: string;
    stores: number;
    bottles: number;
    sales: number;
}

export default function TargetingPanel() {
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTargeting();
    }, []);

    const fetchTargeting = async () => {
        try {
            const response = await api.get("/targeting-insights/");
            setNeighborhoods(response.data);
        } catch (error) {
            console.error("Error fetching targeting insights:", error);
            setNeighborhoods([]);
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

    if (neighborhoods.length === 0) {
        return (
            <div className="p-8 text-center rounded-xl" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                <p style={{ color: "#374151" }}>No targeting data yet. Insights will appear as store placements and sales data are tracked.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {neighborhoods.map((n) => (
                <div key={n.name} className="p-4 rounded-lg" style={{ backgroundColor: "#fafafa", border: "1px solid #f5f5f5" }}>
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin size={16} style={{ color: "#9f1239" }} />
                        <h3 className="text-lg font-semibold" style={{ color: "#171717" }}>{n.name}</h3>
                    </div>
                    <p style={{ color: "#374151" }}>{n.stores} {n.stores === 1 ? "store" : "stores"}</p>
                    <p style={{ color: "#374151" }}>{n.bottles} bottles on shelf</p>
                    <p style={{ color: "#374151" }}>{n.sales} bottles sold</p>
                </div>
            ))}
        </div>
    );
}
