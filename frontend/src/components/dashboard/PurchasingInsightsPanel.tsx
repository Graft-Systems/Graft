"use client";

import React, { useEffect, useState } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import api from "@/app/lib/api";

interface Insight {
    id?: number;
    product: string;
    freq: string;
}

export default function PurchasingInsightsPanel() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        try {
            // TODO: Replace with actual API endpoint when available
            // const response = await api.get("/purchasing-insights/");
            // setInsights(response.data);
            
            // Mock data for now
            setTimeout(() => {
                setInsights([
                    { product: "Brie Cheese", freq: "Often Bought Together" },
                    { product: "Prosciutto", freq: "Strong Pairing" },
                    { product: "Crackers", freq: "Frequent Basket Item" },
                ]);
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error("Error fetching purchasing insights:", error);
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin" style={{ color: "#9f1239" }} />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {insights.map((insight, index) => (
                        <div
                            key={insight.id || index}
                            className="p-4 rounded-xl hover:shadow-md transition"
                            style={{ backgroundColor: "#ffffff", border: "1px solid #f5f5f5" }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-full" style={{ backgroundColor: "#fff1f2", color: "#9f1239" }}>
                                    <ShoppingCart size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold" style={{ color: "#171717" }}>
                                        {insight.product}
                                    </h4>
                                    <p className="text-sm" style={{ color: "#737373" }}>
                                        {insight.freq}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
