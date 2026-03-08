"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Grape } from "lucide-react";
import api from "@/app/lib/api";

interface Cluster {
    id: number;
    scan_session: number;
    cluster_index: number;
    visibility: string;
    occlusion_percentage: number | null;
    hanging_height_cm: number | null;
    estimated_volume_cm3: number | null;
    estimated_weight_g: number | null;
    confidence_score: number | null;
    row_number: number | null;
    vine_number: number | null;
}

interface ClusterAnalysisPanelProps {
    scanSessionId: number | null;
}

const VISIBILITY_STYLES: Record<string, { bg: string; text: string }> = {
    full: { bg: "#dcfce7", text: "#166534" },
    partial: { bg: "#fef9c3", text: "#854d0e" },
    estimated: { bg: "#fee2e2", text: "#991b1b" },
};

export default function ClusterAnalysisPanel({ scanSessionId }: ClusterAnalysisPanelProps) {
    const [clusters, setClusters] = useState<Cluster[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (scanSessionId !== null) {
            fetchClusters();
        } else {
            setClusters([]);
        }
    }, [scanSessionId]);

    const fetchClusters = async () => {
        setLoading(true);
        try {
            const response = await api.get("/vigil/clusters/", { params: { scan_session_id: scanSessionId } });
            setClusters(response.data);
        } catch (error) {
            console.error("Error fetching clusters:", error);
            setClusters([]);
        } finally {
            setLoading(false);
        }
    };

    const getVisibilityStyle = (visibility: string) => {
        return VISIBILITY_STYLES[visibility] || VISIBILITY_STYLES.full;
    };

    const getConfidenceColor = (score: number) => {
        if (score > 0.8) return "#166534";
        if (score > 0.5) return "#854d0e";
        return "#991b1b";
    };

    const getConfidenceBg = (score: number) => {
        if (score > 0.8) return "#dcfce7";
        if (score > 0.5) return "#fef9c3";
        return "#fee2e2";
    };

    const getConfidenceBarColor = (score: number) => {
        if (score > 0.8) return "#22c55e";
        if (score > 0.5) return "#eab308";
        return "#ef4444";
    };

    if (scanSessionId === null) {
        return (
            <div className="p-8 text-center rounded-xl" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                <p style={{ color: "#374151" }}>Select a scan session to view cluster analysis</p>
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

    // Computed summary stats
    const totalClusters = clusters.length;
    const fullyVisible = clusters.filter((c) => c.visibility === "full").length;
    const partiallyOccluded = clusters.filter((c) => c.visibility === "partial").length;
    const estimatedHidden = clusters.filter((c) => c.visibility === "estimated").length;

    const confidenceScores = clusters.filter((c) => c.confidence_score !== null).map((c) => c.confidence_score as number);
    const avgConfidence = confidenceScores.length > 0
        ? confidenceScores.reduce((sum, s) => sum + s, 0) / confidenceScores.length
        : null;

    const occlusionValues = clusters.filter((c) => c.occlusion_percentage !== null).map((c) => c.occlusion_percentage as number);
    const avgOcclusion = occlusionValues.length > 0
        ? occlusionValues.reduce((sum, v) => sum + v, 0) / occlusionValues.length
        : null;

    if (totalClusters === 0) {
        return (
            <div className="p-8 text-center rounded-xl" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                <p style={{ color: "#374151" }}>No cluster data found for this scan session.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-full" style={{ backgroundColor: "#fff1f2", color: "#9f1239" }}>
                    <Grape size={20} />
                </div>
                <h3 className="text-xl font-bold" style={{ color: "#262626" }}>Cluster Analysis</h3>
            </div>

            {/* Summary stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "#ffffff", border: "1px solid #f5f5f5" }}>
                    <div className="text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Total Clusters</div>
                    <div className="text-xl font-bold" style={{ color: "#171717" }}>{totalClusters}</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "#dcfce7", border: "1px solid #bbf7d0" }}>
                    <div className="text-xs font-medium mb-1" style={{ color: "#166534" }}>Fully Visible</div>
                    <div className="text-xl font-bold" style={{ color: "#166534" }}>{fullyVisible}</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "#fef9c3", border: "1px solid #fde68a" }}>
                    <div className="text-xs font-medium mb-1" style={{ color: "#854d0e" }}>Partially Occluded</div>
                    <div className="text-xl font-bold" style={{ color: "#854d0e" }}>{partiallyOccluded}</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "#fee2e2", border: "1px solid #fecaca" }}>
                    <div className="text-xs font-medium mb-1" style={{ color: "#991b1b" }}>Estimated / Hidden</div>
                    <div className="text-xl font-bold" style={{ color: "#991b1b" }}>{estimatedHidden}</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "#ffffff", border: "1px solid #f5f5f5" }}>
                    <div className="text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Avg Confidence</div>
                    <div className="text-xl font-bold" style={{ color: avgConfidence !== null ? getConfidenceColor(avgConfidence) : "#171717" }}>
                        {avgConfidence !== null ? `${(avgConfidence * 100).toFixed(1)}%` : "--"}
                    </div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "#ffffff", border: "1px solid #f5f5f5" }}>
                    <div className="text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Avg Occlusion %</div>
                    <div className="text-xl font-bold" style={{ color: "#171717" }}>
                        {avgOcclusion !== null ? `${avgOcclusion.toFixed(1)}%` : "--"}
                    </div>
                </div>
            </div>

            {/* Cluster table */}
            <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid #f5f5f5", maxHeight: "480px", overflowY: "auto" }}>
                <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10">
                        <tr style={{ backgroundColor: "#fafafa" }}>
                            <th className="text-left p-3 font-semibold" style={{ color: "#525252" }}>Index</th>
                            <th className="text-left p-3 font-semibold" style={{ color: "#525252" }}>Visibility</th>
                            <th className="text-right p-3 font-semibold" style={{ color: "#525252" }}>Occlusion %</th>
                            <th className="text-right p-3 font-semibold" style={{ color: "#525252" }}>Height (cm)</th>
                            <th className="text-right p-3 font-semibold" style={{ color: "#525252" }}>Vol (cm3)</th>
                            <th className="text-right p-3 font-semibold" style={{ color: "#525252" }}>Weight (g)</th>
                            <th className="text-left p-3 font-semibold" style={{ color: "#525252" }}>Confidence</th>
                            <th className="text-right p-3 font-semibold" style={{ color: "#525252" }}>Row</th>
                            <th className="text-right p-3 font-semibold" style={{ color: "#525252" }}>Vine</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clusters.map((cluster) => {
                            const visStyle = getVisibilityStyle(cluster.visibility);
                            const confScore = cluster.confidence_score;
                            const confPct = confScore !== null ? confScore * 100 : null;

                            return (
                                <tr
                                    key={cluster.id}
                                    className="transition"
                                    style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #f5f5f5" }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fafafa"}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ffffff"}
                                >
                                    <td className="p-3 font-medium" style={{ color: "#171717" }}>{cluster.cluster_index}</td>
                                    <td className="p-3">
                                        <span
                                            className="text-xs font-semibold px-2 py-1 rounded-full"
                                            style={{ backgroundColor: visStyle.bg, color: visStyle.text }}
                                        >
                                            {cluster.visibility}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right" style={{ color: "#374151" }}>
                                        {cluster.occlusion_percentage !== null ? `${cluster.occlusion_percentage.toFixed(1)}%` : "--"}
                                    </td>
                                    <td className="p-3 text-right" style={{ color: "#374151" }}>
                                        {cluster.hanging_height_cm !== null ? cluster.hanging_height_cm.toFixed(1) : "--"}
                                    </td>
                                    <td className="p-3 text-right" style={{ color: "#374151" }}>
                                        {cluster.estimated_volume_cm3 !== null ? cluster.estimated_volume_cm3.toFixed(1) : "--"}
                                    </td>
                                    <td className="p-3 text-right" style={{ color: "#374151" }}>
                                        {cluster.estimated_weight_g !== null ? cluster.estimated_weight_g.toFixed(1) : "--"}
                                    </td>
                                    <td className="p-3">
                                        {confScore !== null ? (
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-16 h-2 rounded-full overflow-hidden"
                                                    style={{ backgroundColor: "#f5f5f5" }}
                                                >
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${confPct}%`,
                                                            backgroundColor: getConfidenceBarColor(confScore),
                                                        }}
                                                    />
                                                </div>
                                                <span
                                                    className="text-xs font-semibold"
                                                    style={{ color: getConfidenceColor(confScore) }}
                                                >
                                                    {confPct!.toFixed(0)}%
                                                </span>
                                            </div>
                                        ) : (
                                            <span style={{ color: "#6b7280" }}>--</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-right" style={{ color: "#374151" }}>{cluster.row_number ?? "--"}</td>
                                    <td className="p-3 text-right" style={{ color: "#374151" }}>{cluster.vine_number ?? "--"}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
