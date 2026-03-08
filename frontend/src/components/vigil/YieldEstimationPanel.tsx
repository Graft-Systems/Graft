"use client";

import React, { useEffect, useState } from "react";
import { Plus, Loader2, Trash2, TrendingDown, TrendingUp, Target, ChevronDown, ChevronUp } from "lucide-react";
import api from "@/app/lib/api";

interface YieldEstimate {
    id: number;
    block: number;
    estimate_date: string;
    scenario: "bear" | "base" | "bull";
    estimated_tons_per_acre: number;
    total_estimated_tons: number | null;
    visible_cluster_contribution: number | null;
    occluded_cluster_contribution: number | null;
    weather_adjustment_factor: number | null;
    disease_penalty_factor: number | null;
    species_historical_factor: number | null;
    irrigation_adjustment_factor: number | null;
    confidence_score: number | null;
    notes: string;
}

interface YieldEstimationPanelProps {
    blockId: number | null;
}

const SCENARIO_CONFIG = {
    bear: {
        label: "Bear (Conservative)",
        icon: TrendingDown,
        bg: "#fff7ed",
        border: "#fed7aa",
        accent: "#c2410c",
        badgeBg: "#fef2f2",
        badgeText: "#dc2626",
    },
    base: {
        label: "Base (Expected)",
        icon: Target,
        bg: "#f0fdfa",
        border: "#99f6e4",
        accent: "#0f766e",
        badgeBg: "#f0fdf4",
        badgeText: "#16a34a",
    },
    bull: {
        label: "Bull (Optimistic)",
        icon: TrendingUp,
        bg: "#eff6ff",
        border: "#bfdbfe",
        accent: "#1d4ed8",
        badgeBg: "#eff6ff",
        badgeText: "#2563eb",
    },
};

const emptyForm = {
    estimate_date: "",
    scenario: "base" as "bear" | "base" | "bull",
    estimated_tons_per_acre: "",
    total_estimated_tons: "",
    visible_cluster_contribution: "",
    occluded_cluster_contribution: "",
    weather_adjustment_factor: "1.000",
    disease_penalty_factor: "1.000",
    species_historical_factor: "1.000",
    irrigation_adjustment_factor: "1.000",
    confidence_score: "",
    notes: "",
};

export default function YieldEstimationPanel({ blockId }: YieldEstimationPanelProps) {
    const [estimates, setEstimates] = useState<YieldEstimate[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showHistorical, setShowHistorical] = useState(true);
    const [newEstimate, setNewEstimate] = useState(emptyForm);

    useEffect(() => {
        if (blockId) {
            fetchEstimates();
        } else {
            setEstimates([]);
        }
    }, [blockId]);

    const fetchEstimates = async () => {
        setLoading(true);
        try {
            const response = await api.get("/vigil/yield-estimates/", { params: { block_id: blockId } });
            setEstimates(response.data);
        } catch (error) {
            console.error("Error fetching yield estimates:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddEstimate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                block: blockId,
                estimate_date: newEstimate.estimate_date,
                scenario: newEstimate.scenario,
                estimated_tons_per_acre: parseFloat(newEstimate.estimated_tons_per_acre),
                total_estimated_tons: newEstimate.total_estimated_tons ? parseFloat(newEstimate.total_estimated_tons) : null,
                visible_cluster_contribution: newEstimate.visible_cluster_contribution ? parseFloat(newEstimate.visible_cluster_contribution) : null,
                occluded_cluster_contribution: newEstimate.occluded_cluster_contribution ? parseFloat(newEstimate.occluded_cluster_contribution) : null,
                weather_adjustment_factor: newEstimate.weather_adjustment_factor ? parseFloat(newEstimate.weather_adjustment_factor) : null,
                disease_penalty_factor: newEstimate.disease_penalty_factor ? parseFloat(newEstimate.disease_penalty_factor) : null,
                species_historical_factor: newEstimate.species_historical_factor ? parseFloat(newEstimate.species_historical_factor) : null,
                irrigation_adjustment_factor: newEstimate.irrigation_adjustment_factor ? parseFloat(newEstimate.irrigation_adjustment_factor) : null,
                confidence_score: newEstimate.confidence_score ? parseFloat(newEstimate.confidence_score) : null,
                notes: newEstimate.notes,
            };

            const response = await api.post("/vigil/yield-estimates/", payload);
            setEstimates([...estimates, response.data]);
            setShowAddForm(false);
            setNewEstimate(emptyForm);
        } catch (error) {
            console.error("Post Error:", error);
            alert("Error adding yield estimate. Check the console for details.");
        }
    };

    const handleDeleteEstimate = async (id: number) => {
        if (!confirm("Delete this yield estimate?")) return;
        try {
            await api.delete(`/vigil/yield-estimates/${id}/`);
            setEstimates(estimates.filter((est) => est.id !== id));
        } catch (error) {
            console.error("Delete Error:", error);
            alert("Error deleting yield estimate. Check the console for details.");
        }
    };

    // Group estimates by date, sorted descending
    const groupedByDate = estimates.reduce<Record<string, YieldEstimate[]>>((acc, est) => {
        if (!acc[est.estimate_date]) acc[est.estimate_date] = [];
        acc[est.estimate_date].push(est);
        return acc;
    }, {});

    const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));
    const latestDate = sortedDates[0] || null;
    const latestEstimates = latestDate ? groupedByDate[latestDate] : [];
    const historicalDates = sortedDates.slice(1);

    // All estimates sorted for the historical table
    const allEstimatesSorted = [...estimates].sort((a, b) => {
        const dateComp = b.estimate_date.localeCompare(a.estimate_date);
        if (dateComp !== 0) return dateComp;
        const order = { bear: 0, base: 1, bull: 2 };
        return order[a.scenario] - order[b.scenario];
    });

    // Historical estimates exclude the latest date
    const historicalEstimates = latestDate
        ? allEstimatesSorted.filter((est) => est.estimate_date !== latestDate)
        : allEstimatesSorted;

    const getScenarioEstimate = (dateEstimates: YieldEstimate[], scenario: "bear" | "base" | "bull") => {
        return dateEstimates.find((est) => est.scenario === scenario) || null;
    };

    const formatFactor = (value: number | null, label: string) => {
        if (value === null || value === undefined) return null;
        if (label === "Weather" || label === "Irrigation" || label === "Species Historical") {
            const pct = ((value - 1.0) * 100).toFixed(1);
            const sign = value >= 1.0 ? "+" : "";
            return `${sign}${pct}%`;
        }
        if (label === "Disease Penalty") {
            if (value >= 1.0) return "None";
            const pct = ((1.0 - value) * 100).toFixed(1);
            return `-${pct}%`;
        }
        return value.toFixed(3);
    };

    const renderConfidenceBar = (score: number | null) => {
        if (score === null || score === undefined) return null;
        const pct = Math.round(score * 100);
        let barColor = "#dc2626";
        if (score > 0.7) barColor = "#16a34a";
        else if (score > 0.4) barColor = "#ca8a04";

        return (
            <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium" style={{ color: "#6b7280" }}>Confidence</span>
                    <span className="text-xs font-bold" style={{ color: barColor }}>{pct}%</span>
                </div>
                <div className="w-full rounded-full h-2" style={{ backgroundColor: "#e5e7eb" }}>
                    <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                </div>
            </div>
        );
    };

    const renderSpotlightCard = (est: YieldEstimate | null, scenario: "bear" | "base" | "bull") => {
        const config = SCENARIO_CONFIG[scenario];
        const Icon = config.icon;

        if (!est) {
            return (
                <div
                    key={scenario}
                    className="flex-1 p-5 rounded-xl"
                    style={{ backgroundColor: config.bg, border: `1px solid ${config.border}`, opacity: 0.5 }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Icon size={18} style={{ color: config.accent }} />
                        <span className="text-sm font-semibold" style={{ color: config.accent }}>{config.label}</span>
                    </div>
                    <p className="text-sm" style={{ color: "#6b7280" }}>No estimate available</p>
                </div>
            );
        }

        const factors = [
            { label: "Visible Clusters", value: est.visible_cluster_contribution, format: (v: number) => v.toFixed(3) },
            { label: "Occluded Clusters", value: est.occluded_cluster_contribution, format: (v: number) => v.toFixed(3) },
            { label: "Weather", value: est.weather_adjustment_factor, format: () => formatFactor(est.weather_adjustment_factor, "Weather") },
            { label: "Disease Penalty", value: est.disease_penalty_factor, format: () => formatFactor(est.disease_penalty_factor, "Disease Penalty") },
            { label: "Species Historical", value: est.species_historical_factor, format: () => formatFactor(est.species_historical_factor, "Species Historical") },
            { label: "Irrigation", value: est.irrigation_adjustment_factor, format: () => formatFactor(est.irrigation_adjustment_factor, "Irrigation") },
        ];

        return (
            <div
                key={scenario}
                className="flex-1 p-5 rounded-xl"
                style={{ backgroundColor: config.bg, border: `1px solid ${config.border}` }}
            >
                <div className="flex items-center gap-2 mb-3">
                    <Icon size={18} style={{ color: config.accent }} />
                    <span className="text-sm font-semibold" style={{ color: config.accent }}>{config.label}</span>
                </div>

                <div className="mb-1">
                    <span className="text-3xl font-bold" style={{ color: config.accent }}>
                        {est.estimated_tons_per_acre.toFixed(2)}
                    </span>
                    <span className="text-sm ml-1" style={{ color: "#6b7280" }}>tons/acre</span>
                </div>

                {est.total_estimated_tons !== null && (
                    <p className="text-sm mb-3" style={{ color: "#6b7280" }}>
                        Total: <span className="font-semibold" style={{ color: config.accent }}>{est.total_estimated_tons.toFixed(2)}</span> tons
                    </p>
                )}

                <div className="space-y-1 pt-3" style={{ borderTop: `1px solid ${config.border}` }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: "#6b7280" }}>Contributing Factors</p>
                    {factors.map((factor) => {
                        if (factor.value === null || factor.value === undefined) return null;
                        return (
                            <div key={factor.label} className="flex justify-between text-xs">
                                <span style={{ color: "#6b7280" }}>{factor.label}</span>
                                <span className="font-medium" style={{ color: config.accent }}>{factor.format(factor.value)}</span>
                            </div>
                        );
                    })}
                </div>

                {renderConfidenceBar(est.confidence_score)}
            </div>
        );
    };

    if (!blockId) {
        return (
            <div className="flex items-center justify-center p-12">
                <p className="text-sm" style={{ color: "#6b7280" }}>Select a block to view yield estimates</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="animate-spin" style={{ color: "#9f1239" }} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold" style={{ color: "#262626" }}>Yield Estimation</h3>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-sm"
                    style={{ backgroundColor: "#9f1239", color: "#ffffff" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#be123c"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#9f1239"}
                >
                    <Plus size={18} /> Add Yield Estimate
                </button>
            </div>

            {/* Add Estimate Form */}
            {showAddForm && (
                <form onSubmit={handleAddEstimate} className="p-4 rounded-xl grid grid-cols-2 gap-4" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                    <div className="col-span-2">
                        <p className="text-sm font-semibold mb-1" style={{ color: "#374151" }}>New Yield Estimate</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: "#6b7280" }}>Estimate Date</label>
                        <input
                            className="p-2 border rounded-md w-full placeholder:text-gray-500 text-gray-900"
                            type="date"
                            value={newEstimate.estimate_date}
                            onChange={(e) => setNewEstimate({ ...newEstimate, estimate_date: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: "#6b7280" }}>Scenario</label>
                        <select
                            className="p-2 border rounded-md w-full placeholder:text-gray-500 text-gray-900"
                            value={newEstimate.scenario}
                            onChange={(e) => setNewEstimate({ ...newEstimate, scenario: e.target.value as "bear" | "base" | "bull" })}
                            required
                        >
                            <option value="bear">Bear (Conservative)</option>
                            <option value="base">Base (Expected)</option>
                            <option value="bull">Bull (Optimistic)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: "#6b7280" }}>Tons per Acre *</label>
                        <input
                            className="p-2 border rounded-md w-full placeholder:text-gray-500 text-gray-900"
                            type="number"
                            step="0.01"
                            placeholder="e.g. 3.50"
                            value={newEstimate.estimated_tons_per_acre}
                            onChange={(e) => setNewEstimate({ ...newEstimate, estimated_tons_per_acre: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: "#6b7280" }}>Total Estimated Tons</label>
                        <input
                            className="p-2 border rounded-md w-full placeholder:text-gray-500 text-gray-900"
                            type="number"
                            step="0.01"
                            placeholder="e.g. 28.00"
                            value={newEstimate.total_estimated_tons}
                            onChange={(e) => setNewEstimate({ ...newEstimate, total_estimated_tons: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: "#6b7280" }}>Visible Cluster Contribution</label>
                        <input
                            className="p-2 border rounded-md w-full placeholder:text-gray-500 text-gray-900"
                            type="number"
                            step="0.001"
                            placeholder="e.g. 2.100"
                            value={newEstimate.visible_cluster_contribution}
                            onChange={(e) => setNewEstimate({ ...newEstimate, visible_cluster_contribution: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: "#6b7280" }}>Occluded Cluster Contribution</label>
                        <input
                            className="p-2 border rounded-md w-full placeholder:text-gray-500 text-gray-900"
                            type="number"
                            step="0.001"
                            placeholder="e.g. 1.400"
                            value={newEstimate.occluded_cluster_contribution}
                            onChange={(e) => setNewEstimate({ ...newEstimate, occluded_cluster_contribution: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: "#6b7280" }}>Weather Adjustment Factor</label>
                        <input
                            className="p-2 border rounded-md w-full placeholder:text-gray-500 text-gray-900"
                            type="number"
                            step="0.001"
                            placeholder="1.000"
                            value={newEstimate.weather_adjustment_factor}
                            onChange={(e) => setNewEstimate({ ...newEstimate, weather_adjustment_factor: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: "#6b7280" }}>Disease Penalty Factor</label>
                        <input
                            className="p-2 border rounded-md w-full placeholder:text-gray-500 text-gray-900"
                            type="number"
                            step="0.001"
                            placeholder="1.000"
                            value={newEstimate.disease_penalty_factor}
                            onChange={(e) => setNewEstimate({ ...newEstimate, disease_penalty_factor: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: "#6b7280" }}>Species Historical Factor</label>
                        <input
                            className="p-2 border rounded-md w-full placeholder:text-gray-500 text-gray-900"
                            type="number"
                            step="0.001"
                            placeholder="1.000"
                            value={newEstimate.species_historical_factor}
                            onChange={(e) => setNewEstimate({ ...newEstimate, species_historical_factor: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: "#6b7280" }}>Irrigation Adjustment Factor</label>
                        <input
                            className="p-2 border rounded-md w-full placeholder:text-gray-500 text-gray-900"
                            type="number"
                            step="0.001"
                            placeholder="1.000"
                            value={newEstimate.irrigation_adjustment_factor}
                            onChange={(e) => setNewEstimate({ ...newEstimate, irrigation_adjustment_factor: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: "#6b7280" }}>Confidence Score (0-1)</label>
                        <input
                            className="p-2 border rounded-md w-full placeholder:text-gray-500 text-gray-900"
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            placeholder="e.g. 0.85"
                            value={newEstimate.confidence_score}
                            onChange={(e) => setNewEstimate({ ...newEstimate, confidence_score: e.target.value })}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs font-medium mb-1 block" style={{ color: "#6b7280" }}>Notes</label>
                        <textarea
                            className="p-2 border rounded-md w-full placeholder:text-gray-500 text-gray-900"
                            rows={2}
                            placeholder="Optional notes about this estimate..."
                            value={newEstimate.notes}
                            onChange={(e) => setNewEstimate({ ...newEstimate, notes: e.target.value })}
                        />
                    </div>
                    <div className="col-span-2 flex gap-2">
                        <button type="submit" className="px-4 py-2 rounded-md" style={{ backgroundColor: "#9f1239", color: "#ffffff" }}>Save Estimate</button>
                        <button type="button" onClick={() => setShowAddForm(false)} style={{ color: "#374151" }}>Cancel</button>
                    </div>
                </form>
            )}

            {/* Empty State */}
            {estimates.length === 0 && !showAddForm && (
                <div className="flex flex-col items-center justify-center p-12 rounded-xl" style={{ backgroundColor: "#fafafa", border: "1px solid #f5f5f5" }}>
                    <Target size={40} style={{ color: "#9ca3af" }} />
                    <p className="mt-3 text-sm" style={{ color: "#6b7280" }}>No yield estimates yet for this block.</p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="mt-3 text-sm font-semibold hover:underline"
                        style={{ color: "#9f1239" }}
                    >
                        Add the first estimate
                    </button>
                </div>
            )}

            {/* Latest Estimate Spotlight */}
            {latestDate && (
                <div>
                    <p className="text-sm font-semibold mb-3" style={{ color: "#6b7280" }}>
                        Latest Estimate &mdash; {latestDate}
                    </p>
                    <div className="flex gap-4">
                        {renderSpotlightCard(getScenarioEstimate(latestEstimates, "bear"), "bear")}
                        {renderSpotlightCard(getScenarioEstimate(latestEstimates, "base"), "base")}
                        {renderSpotlightCard(getScenarioEstimate(latestEstimates, "bull"), "bull")}
                    </div>
                </div>
            )}

            {/* Historical Estimates Table */}
            {historicalEstimates.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowHistorical(!showHistorical)}
                        className="flex items-center gap-2 mb-3"
                    >
                        <span className="text-sm font-semibold" style={{ color: "#6b7280" }}>Historical Estimates</span>
                        {showHistorical ? (
                            <ChevronUp size={16} style={{ color: "#6b7280" }} />
                        ) : (
                            <ChevronDown size={16} style={{ color: "#6b7280" }} />
                        )}
                    </button>

                    {showHistorical && (
                        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #f5f5f5" }}>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ backgroundColor: "#fafafa" }}>
                                        <th className="text-left p-3 font-semibold" style={{ color: "#6b7280" }}>Date</th>
                                        <th className="text-left p-3 font-semibold" style={{ color: "#6b7280" }}>Scenario</th>
                                        <th className="text-right p-3 font-semibold" style={{ color: "#6b7280" }}>Tons/Acre</th>
                                        <th className="text-right p-3 font-semibold" style={{ color: "#6b7280" }}>Total Tons</th>
                                        <th className="text-right p-3 font-semibold" style={{ color: "#6b7280" }}>Confidence</th>
                                        <th className="text-right p-3 font-semibold" style={{ color: "#6b7280" }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historicalEstimates.map((est) => {
                                        const config = SCENARIO_CONFIG[est.scenario];
                                        return (
                                            <tr key={est.id} className="hover:bg-gray-50 transition" style={{ borderTop: "1px solid #f5f5f5" }}>
                                                <td className="p-3" style={{ color: "#374151" }}>{est.estimate_date}</td>
                                                <td className="p-3">
                                                    <span
                                                        className="text-xs font-semibold px-2 py-1 rounded-full"
                                                        style={{ backgroundColor: config.badgeBg, color: config.badgeText }}
                                                    >
                                                        {est.scenario.charAt(0).toUpperCase() + est.scenario.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right font-medium" style={{ color: "#171717" }}>
                                                    {est.estimated_tons_per_acre.toFixed(2)}
                                                </td>
                                                <td className="p-3 text-right" style={{ color: "#6b7280" }}>
                                                    {est.total_estimated_tons !== null ? est.total_estimated_tons.toFixed(2) : "\u2014"}
                                                </td>
                                                <td className="p-3 text-right">
                                                    {est.confidence_score !== null ? (
                                                        <span
                                                            className="text-xs font-semibold"
                                                            style={{
                                                                color: est.confidence_score > 0.7
                                                                    ? "#16a34a"
                                                                    : est.confidence_score > 0.4
                                                                    ? "#ca8a04"
                                                                    : "#dc2626",
                                                            }}
                                                        >
                                                            {Math.round(est.confidence_score * 100)}%
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: "#9ca3af" }}>&mdash;</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <button
                                                        onClick={() => handleDeleteEstimate(est.id)}
                                                        className="p-1 rounded hover:bg-red-50 transition"
                                                        title="Delete estimate"
                                                    >
                                                        <Trash2 size={14} style={{ color: "#dc2626" }} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
