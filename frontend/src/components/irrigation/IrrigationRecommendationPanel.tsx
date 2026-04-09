"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, RefreshCw } from "lucide-react";
import api from "@/app/lib/api";

interface Recommendation {
    id: number;
    horizon_days: number;
    action: "increase" | "schedule" | "maintain" | "reduce" | "skip";
    recommended_total_gallons: number | string | null;
    recommended_gallons_per_acre: number | string | null;
    next_irrigation_date: string | null;
    target_moisture_pct: number | string | null;
    confidence_score: number | string;
    explanation: string;
    drivers: Record<string, string | number | null>;
}

function toDisplayNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === "") return null;
    const numericValue = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
}

const CARD_STYLES: Record<string, { bg: string; border: string; accent: string }> = {
    increase: { bg: "#fff7ed", border: "#fed7aa", accent: "#c2410c" },
    schedule: { bg: "#fefce8", border: "#fde68a", accent: "#a16207" },
    maintain: { bg: "#f0fdf4", border: "#bbf7d0", accent: "#166534" },
    reduce: { bg: "#eff6ff", border: "#bfdbfe", accent: "#1d4ed8" },
    skip: { bg: "#f5f3ff", border: "#ddd6fe", accent: "#6d28d9" },
};

export default function IrrigationRecommendationPanel({
    blockId,
    refreshToken,
    onGenerated,
}: {
    blockId: number | null;
    refreshToken: number;
    onGenerated: () => void;
}) {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!blockId) {
                setRecommendations([]);
                return;
            }
            try {
                const response = await api.get("/irrigation/recommendations/", {
                    params: { block_id: blockId },
                });
                setRecommendations(response.data);
            } catch (error) {
                console.error("Error loading recommendations:", error);
                setRecommendations([]);
            }
        };

        fetchRecommendations();
    }, [blockId, refreshToken]);

    const latestByHorizon = useMemo(() => {
        const map = new Map<number, Recommendation>();
        recommendations.forEach((recommendation) => {
            if (!map.has(recommendation.horizon_days)) {
                map.set(recommendation.horizon_days, recommendation);
            }
        });
        return [3, 7].map((days) => map.get(days) ?? null);
    }, [recommendations]);

    const handleGenerate = async () => {
        if (!blockId) return;
        setGenerating(true);
        try {
            const response = await api.post("/irrigation/recommendations/generate/", {
                block: blockId,
            });
            setRecommendations(response.data);
            onGenerated();
        } catch (error: unknown) {
            console.error("Error generating recommendations:", error);
            const message =
                typeof error === "object" &&
                error !== null &&
                "response" in error &&
                typeof error.response === "object" &&
                error.response !== null &&
                "data" in error.response &&
                typeof error.response.data === "object" &&
                error.response.data !== null &&
                "error" in error.response.data &&
                typeof error.response.data.error === "string"
                    ? error.response.data.error
                    : "Unable to generate recommendations.";
            alert(message);
        } finally {
            setGenerating(false);
        }
    };

    if (!blockId) {
        return <p className="text-sm" style={{ color: "#6b7280" }}>Select a block to generate irrigation recommendations.</p>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-semibold" style={{ color: "#171717" }}>72h + 7d Recommendations</h4>
                    <p className="text-sm" style={{ color: "#6b7280" }}>Rules-based guidance using moisture, irrigation history, and forecast data.</p>
                </div>
                <button
                    onClick={handleGenerate}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                    style={{ backgroundColor: "#9f1239", color: "#ffffff", opacity: generating ? 0.7 : 1 }}
                    disabled={generating}
                >
                    <RefreshCw size={16} className={generating ? "animate-spin" : ""} />
                    {generating ? "Generating..." : "Generate"}
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {latestByHorizon.map((recommendation, index) => {
                    if (!recommendation) {
                        return (
                            <div key={index} className="rounded-2xl p-5" style={{ backgroundColor: "#fafafa", border: "1px solid #f3f4f6" }}>
                                <p className="text-sm" style={{ color: "#6b7280" }}>No recommendation generated yet.</p>
                            </div>
                        );
                    }

                    const style = CARD_STYLES[recommendation.action];
                    const confidenceScore = toDisplayNumber(recommendation.confidence_score) ?? 0;
                    const gallonsPerAcre = toDisplayNumber(recommendation.recommended_gallons_per_acre);
                    const totalGallons = toDisplayNumber(recommendation.recommended_total_gallons);
                    const drivers = [
                        {
                            label: "Latest moisture",
                            value: recommendation.drivers.latest_moisture_pct !== null && recommendation.drivers.latest_moisture_pct !== undefined
                                ? `${recommendation.drivers.latest_moisture_pct}%`
                                : "--",
                        },
                        {
                            label: "Target band",
                            value: `${recommendation.drivers.target_min_pct ?? "--"}-${recommendation.drivers.target_max_pct ?? "--"}%`,
                        },
                        {
                            label: "Trend/day",
                            value: recommendation.drivers.trend_pct_per_day !== null && recommendation.drivers.trend_pct_per_day !== undefined
                                ? `${recommendation.drivers.trend_pct_per_day}`
                                : "--",
                        },
                        {
                            label: "Forecast rain",
                            value: recommendation.drivers.forecast_total_precipitation_in !== null && recommendation.drivers.forecast_total_precipitation_in !== undefined
                                ? `${recommendation.drivers.forecast_total_precipitation_in} in`
                                : "--",
                        },
                    ];

                    return (
                        <div
                            key={recommendation.id}
                            className="rounded-2xl p-5"
                            style={{ backgroundColor: style.bg, border: `1px solid ${style.border}` }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.16em]" style={{ color: style.accent }}>
                                        {recommendation.horizon_days === 3 ? "72 hours" : "7 days"}
                                    </p>
                                    <h5 className="text-2xl font-bold capitalize mt-1" style={{ color: "#171717" }}>
                                        {recommendation.action}
                                    </h5>
                                </div>
                                <div className="rounded-xl px-3 py-2 text-sm font-semibold" style={{ backgroundColor: "#ffffff", color: style.accent }}>
                                    {Math.round(confidenceScore * 100)}% confidence
                                </div>
                            </div>

                            <p className="text-sm leading-6" style={{ color: "#374151" }}>
                                {recommendation.explanation}
                            </p>

                            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                                <div className="rounded-xl p-3" style={{ backgroundColor: "#ffffff" }}>
                                    <p style={{ color: "#6b7280" }}>Gallons / acre</p>
                                    <p className="font-semibold mt-1" style={{ color: "#171717" }}>
                                        {gallonsPerAcre !== null
                                            ? gallonsPerAcre.toFixed(2)
                                            : "--"}
                                    </p>
                                </div>
                                <div className="rounded-xl p-3" style={{ backgroundColor: "#ffffff" }}>
                                    <p style={{ color: "#6b7280" }}>Total gallons</p>
                                    <p className="font-semibold mt-1" style={{ color: "#171717" }}>
                                        {totalGallons !== null
                                            ? totalGallons.toFixed(2)
                                            : "--"}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: "#6b7280" }}>
                                <CalendarClock size={14} />
                                {recommendation.next_irrigation_date
                                    ? `Next irrigation: ${new Date(recommendation.next_irrigation_date).toLocaleDateString()}`
                                    : "No irrigation date scheduled"}
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {drivers.map((driver) => (
                                    <div key={driver.label} className="rounded-xl p-3 text-sm" style={{ backgroundColor: "#ffffff" }}>
                                        <p style={{ color: "#6b7280" }}>{driver.label}</p>
                                        <p className="font-semibold mt-1" style={{ color: "#171717" }}>
                                            {driver.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
