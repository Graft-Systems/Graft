"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Droplets, Sprout, Waves } from "lucide-react";
import api from "@/app/lib/api";

interface SummaryPayload {
    total_vineyards: number;
    total_blocks: number;
    readings_last_7_days: number;
    recommendation_count: number;
    blocks_with_readings: number;
    blocks_with_recommendations: number;
    blocks_below_target: number;
    latest_reading: {
        block_name: string;
        moisture_pct: number;
        recorded_at: string;
    } | null;
    latest_recommendation: {
        block_name: string;
        action: string;
        horizon_days: number;
        generated_at: string;
    } | null;
}

export default function IrrigationSummaryCards({ refreshToken }: { refreshToken: number }) {
    const [summary, setSummary] = useState<SummaryPayload | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            setLoading(true);
            try {
                const response = await api.get("/irrigation/summary/");
                setSummary(response.data);
            } catch (error) {
                console.error("Error loading irrigation summary:", error);
                setSummary(null);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [refreshToken]);

    const cards = [
        {
            title: "Vineyards",
            value: summary?.total_vineyards ?? 0,
            detail: `${summary?.total_blocks ?? 0} blocks`,
            icon: Sprout,
            tint: "#14532d",
            bg: "#f0fdf4",
            border: "#bbf7d0",
        },
        {
            title: "Readings (7d)",
            value: summary?.readings_last_7_days ?? 0,
            detail: `${summary?.blocks_with_readings ?? 0} blocks reporting`,
            icon: Waves,
            tint: "#0f766e",
            bg: "#ecfeff",
            border: "#a5f3fc",
        },
        {
            title: "Below Target",
            value: summary?.blocks_below_target ?? 0,
            detail: `${summary?.blocks_with_recommendations ?? 0} blocks with recs`,
            icon: AlertTriangle,
            tint: "#9a3412",
            bg: "#fff7ed",
            border: "#fed7aa",
        },
        {
            title: "Latest Action",
            value: summary?.latest_recommendation ? summary.latest_recommendation.action.replace("_", " ") : "--",
            detail: summary?.latest_recommendation
                ? `${summary.latest_recommendation.block_name} · ${summary.latest_recommendation.horizon_days}d`
                : "Generate recommendations",
            icon: Droplets,
            tint: "#9f1239",
            bg: "#fff1f2",
            border: "#fecdd3",
        },
    ];

    if (loading && !summary) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-28 rounded-xl animate-pulse" style={{ backgroundColor: "#f5f5f5" }} />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <div
                        key={card.title}
                        className="rounded-2xl p-5"
                        style={{ backgroundColor: card.bg, border: `1px solid ${card.border}` }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 rounded-xl" style={{ backgroundColor: "#ffffff", color: card.tint }}>
                                <Icon size={18} />
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: card.tint }}>
                                {card.title}
                            </span>
                        </div>
                        <div className="text-3xl font-bold" style={{ color: "#171717" }}>{card.value}</div>
                        <p className="text-sm mt-2" style={{ color: "#525252" }}>{card.detail}</p>
                    </div>
                );
            })}
        </div>
    );
}
