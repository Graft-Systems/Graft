"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Grape, LayoutGrid, ScanLine, BarChart3, Bug, CloudRain } from "lucide-react";
import api from "@/app/lib/api";

interface VigilSummary {
    total_vineyards: number;
    total_blocks: number;
    total_scan_sessions: number;
    training_sample_count: number;
    trained_model_count: number;
    prediction_count: number;
    avg_yield_estimate_base_tons_per_acre: number | null;
    active_pest_disease_alerts: number;
    weather_forecast_summary: {
        next_10_days_precipitation_in: number;
    };
}

interface CardDef {
    label: string;
    value: string;
    accent: string;
    icon: React.ReactNode;
}

export default function VigilSummaryCards() {
    const [summary, setSummary] = useState<VigilSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        fetchSummary();
    }, []);

    useEffect(() => {
        if (!loading && summary) {
            const timer = setTimeout(() => setMounted(true), 50);
            return () => clearTimeout(timer);
        }
    }, [loading, summary]);

    const fetchSummary = async () => {
        try {
            const response = await api.get("/vigil/summary/");
            setSummary(response.data);
        } catch (error) {
            console.error("Error fetching VIGIL summary:", error);
            setSummary(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin" style={{ color: "#9f1239" }} />
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="p-5 text-center rounded-xl" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                <p className="text-sm" style={{ color: "#374151" }}>No VIGIL data yet. Add vineyards and blocks to see your metrics.</p>
            </div>
        );
    }

    const alertCount = summary.active_pest_disease_alerts;

    const cards: CardDef[] = [
        {
            label: "Total Vineyards",
            value: String(summary.total_vineyards),
            accent: "#9f1239",
            icon: <Grape size={16} />,
        },
        {
            label: "Total Blocks",
            value: String(summary.total_blocks),
            accent: "#9f1239",
            icon: <LayoutGrid size={16} />,
        },
        {
            label: "Total Scans",
            value: String(summary.total_scan_sessions),
            accent: "#9f1239",
            icon: <ScanLine size={16} />,
        },
        {
            label: "Avg. Yield Estimate",
            value: summary.avg_yield_estimate_base_tons_per_acre !== null
                ? `${summary.avg_yield_estimate_base_tons_per_acre.toFixed(2)} t/ac`
                : "\u2014",
            accent: "#9f1239",
            icon: <BarChart3 size={16} />,
        },
        {
            label: "Training Samples",
            value: String(summary.training_sample_count),
            accent: "#0f766e",
            icon: <Grape size={16} />,
        },
        {
            label: "Ready Models",
            value: String(summary.trained_model_count),
            accent: "#1d4ed8",
            icon: <BarChart3 size={16} />,
        },
        {
            label: "Predictions Saved",
            value: String(summary.prediction_count),
            accent: "#7c3aed",
            icon: <ScanLine size={16} />,
        },
        {
            label: "Pest/Disease Alerts",
            value: String(alertCount),
            accent: alertCount > 0 ? "#d97706" : "#9f1239",
            icon: <Bug size={16} />,
        },
        {
            label: "10-Day Rain Forecast",
            value: `${summary.weather_forecast_summary.next_10_days_precipitation_in} in`,
            accent: "#9f1239",
            icon: <CloudRain size={16} />,
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 xl:gap-4">
            {cards.map((card, i) => (
                <div
                    key={i}
                    className="p-3 xl:p-4 rounded-xl shadow-sm"
                    style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #f5f5f5",
                        borderTop: `3px solid ${card.accent}`,
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateY(0)" : "translateY(8px)",
                        transition: `opacity 0.4s ease ${i * 0.08}s, transform 0.4s ease ${i * 0.08}s`,
                    }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div
                            className="p-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: "#fff1f2", color: card.accent }}
                        >
                            {card.icon}
                        </div>
                        <p className="text-[11px] xl:text-xs font-medium uppercase tracking-[0.08em] leading-snug" style={{ color: "#374151" }}>
                            {card.label}
                        </p>
                    </div>
                    <h3 className="text-xl xl:text-2xl font-bold" style={{ color: card.accent }}>
                        {card.value}
                    </h3>
                </div>
            ))}
        </div>
    );
}
