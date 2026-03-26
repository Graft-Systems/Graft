"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface PredictionResult {
    id: number;
    model_version: number | null;
    model_name: string | null;
    sample_name: string;
    image_url: string | null;
    grape_species: string;
    predicted_volume_cm3: number;
    predicted_weight_g: number | null;
    confidence_score: number;
    created_at: string;
    annotated_image_url?: string | null;
    features?: {
        detections?: Array<{ x: number; y: number; width: number; height: number; confidence: number }>;
    };
}

interface Props {
    latestPrediction: PredictionResult | null;
    formatNumber: (value: number | string | null | undefined, digits?: number) => string;
    onExpandImage: (url: string, label: string) => void;
}

export default function LatestPredictionPanel({ latestPrediction, formatNumber, onExpandImage }: Props) {
    const displayImageUrl = latestPrediction?.annotated_image_url || latestPrediction?.image_url || null;
    const detectionCount = latestPrediction?.features?.detections?.length || 0;

    return (
        <div className="rounded-2xl p-4 xl:p-5" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "#e0e7ff", color: "#4338ca" }}>
                    <Sparkles size={18} />
                </div>
                <div>
                    <h3 className="text-lg font-bold" style={{ color: "#262626" }}>Latest Prediction</h3>
                    <p className="text-sm" style={{ color: "#6b7280" }}>Saved predictions stay available for later QA and comparison.</p>
                </div>
            </div>

            {latestPrediction ? (
                <div className="space-y-3">
                    {displayImageUrl ? (
                        <button
                            type="button"
                            onClick={() => onExpandImage(displayImageUrl, latestPrediction.sample_name || "Prediction")}
                            className="block w-full text-left"
                        >
                            <img src={displayImageUrl} alt={latestPrediction.sample_name || "Prediction"} className="w-full h-28 object-cover rounded-xl border" />
                            <p className="text-xs mt-2" style={{ color: "#6b7280" }}>
                                Click the image to expand it.
                                {detectionCount > 0 ? ` ${detectionCount} cluster box${detectionCount === 1 ? "" : "es"} detected.` : ""}
                            </p>
                        </button>
                    ) : null}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl p-3" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                            <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "#6b7280" }}>Volume</p>
                            <p className="text-2xl font-bold" style={{ color: "#1d4ed8" }}>{formatNumber(latestPrediction.predicted_volume_cm3)} cm3</p>
                        </div>
                        <div className="rounded-xl p-3" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                            <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "#6b7280" }}>Weight</p>
                            <p className="text-2xl font-bold" style={{ color: "#0f766e" }}>{formatNumber(latestPrediction.predicted_weight_g)} g</p>
                        </div>
                    </div>
                    <div className="rounded-xl p-3" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                        <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "#6b7280" }}>Confidence</p>
                        <p className="text-xl font-bold" style={{ color: "#7c3aed" }}>{Math.round(Number(latestPrediction.confidence_score) * 100)}%</p>
                        <p className="text-sm mt-1" style={{ color: "#4b5563" }}>{latestPrediction.model_name || "Active model"}</p>
                    </div>
                </div>
            ) : (
                <p className="text-sm" style={{ color: "#4b5563" }}>Run a prediction to see the estimated cluster volume and weight here.</p>
            )}
        </div>
    );
}
