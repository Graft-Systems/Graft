"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import PanelContainer from "@/components/dashboard/PanelContainer";
import IrrigationSummaryCards from "@/components/irrigation/IrrigationSummaryCards";
import IrrigationContextPanel from "@/components/irrigation/IrrigationContextPanel";
import MoistureTargetPanel from "@/components/irrigation/MoistureTargetPanel";
import SoilMoisturePanel from "@/components/irrigation/SoilMoisturePanel";
import IrrigationRecommendationPanel from "@/components/irrigation/IrrigationRecommendationPanel";
import IrrigationHistoryPanel from "@/components/irrigation/IrrigationHistoryPanel";

export default function IrrigationDashboardPage() {
    const [selectedVineyardId, setSelectedVineyardId] = useState<number | null>(null);
    const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
    const [refreshToken, setRefreshToken] = useState(0);

    const triggerRefresh = () => setRefreshToken((value) => value + 1);

    return (
        <div className="min-h-screen flex" style={{ background: "linear-gradient(180deg, #fffaf5 0%, #fafafa 28%, #ffffff 100%)" }}>
            <Sidebar />

            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-[1720px] px-5 py-6 xl:px-6 2xl:px-8 2xl:py-8 space-y-6 xl:space-y-8">
                    <header className="rounded-[28px] p-6 xl:p-8" style={{ backgroundColor: "#1f2937", color: "#ffffff" }}>
                        <div className="flex flex-col gap-3 xl:max-w-3xl">
                            <span
                                className="inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
                                style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#fde68a" }}
                            >
                                Irrigation Advisor
                            </span>
                            <h1 className="text-3xl xl:text-4xl font-bold">Soil moisture tracking and irrigation decisions in one place.</h1>
                            <p className="text-sm xl:text-base leading-7" style={{ color: "#d1d5db" }}>
                                This workspace stays separate from VIGIL and focuses only on soil moisture, irrigation history,
                                forecast-aware recommendations, and clear next actions for vineyard technicians.
                            </p>
                        </div>
                    </header>

                    <IrrigationSummaryCards refreshToken={refreshToken} />

                    <PanelContainer title="Context" titleColor="#9f1239">
                        <IrrigationContextPanel
                            selectedVineyardId={selectedVineyardId}
                            selectedBlockId={selectedBlockId}
                            onSelectVineyard={setSelectedVineyardId}
                            onSelectBlock={setSelectedBlockId}
                        />
                    </PanelContainer>

                    <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6 xl:gap-8">
                        <div className="space-y-6 xl:space-y-8 2xl:col-span-5">
                            <PanelContainer title="Target Settings" titleColor="#9f1239">
                                <MoistureTargetPanel blockId={selectedBlockId} onSaved={triggerRefresh} />
                            </PanelContainer>

                            <PanelContainer title="Recent Irrigation History" titleColor="#9f1239">
                                <IrrigationHistoryPanel blockId={selectedBlockId} refreshToken={refreshToken} />
                            </PanelContainer>
                        </div>

                        <div className="2xl:col-span-7">
                            <PanelContainer title="Recommendations" titleColor="#9f1239">
                                <IrrigationRecommendationPanel
                                    blockId={selectedBlockId}
                                    refreshToken={refreshToken}
                                    onGenerated={triggerRefresh}
                                />
                            </PanelContainer>
                        </div>
                    </div>

                    <PanelContainer title="Soil Moisture Readings" titleColor="#9f1239">
                        <SoilMoisturePanel
                            blockId={selectedBlockId}
                            refreshToken={refreshToken}
                            onChange={triggerRefresh}
                        />
                    </PanelContainer>
                </div>
            </div>
        </div>
    );
}
