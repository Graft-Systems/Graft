"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import api from "@/app/lib/api";

interface PriceRow {
    id: number;
    account: string;
    wine: string;
    price: number;
    median: number;
}

export default function PricingAnalyticsPanel() {
    const [pricing, setPricing] = useState<PriceRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPricing();
    }, []);

    const fetchPricing = async () => {
        try {
            const response = await api.get("/pricing-analytics/");
            setPricing(response.data);
        } catch (error) {
            console.error("Error fetching pricing analytics:", error);
            setPricing([]);
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

    if (pricing.length === 0) {
        return (
            <div className="p-8 text-center rounded-xl" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                <p style={{ color: "#374151" }}>No pricing data yet. Wholesale prices will appear as distribution data is added.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ color: "#374151" }}>
                <thead className="border-b">
                    <tr style={{ color: "#171717" }}>
                        <th className="text-left py-2 pr-4">Account</th>
                        <th className="text-left py-2 pr-4">Wine</th>
                        <th className="text-right py-2 pr-4">Net Price</th>
                        <th className="text-right py-2">Region Median</th>
                    </tr>
                </thead>
                <tbody>
                    {pricing.map((p) => {
                        const diff = p.price - p.median;
                        const diffColor = diff > 0 ? "#166534" : diff < 0 ? "#991b1b" : "#374151";
                        return (
                            <tr key={p.id} className="border-b">
                                <td className="py-2 pr-4">{p.account}</td>
                                <td className="py-2 pr-4">{p.wine}</td>
                                <td className="py-2 pr-4 text-right">${p.price.toFixed(2)}</td>
                                <td className="py-2 text-right">
                                    ${p.median.toFixed(2)}
                                    <span className="ml-2 text-xs font-semibold" style={{ color: diffColor }}>
                                        ({diff >= 0 ? "+" : ""}{diff.toFixed(2)})
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
