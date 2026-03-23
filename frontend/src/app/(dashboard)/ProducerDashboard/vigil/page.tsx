"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import PanelContainer from "@/components/dashboard/PanelContainer";

import VigilSummaryCards from "@/components/vigil/VigilSummaryCards";
import VineyardManagerPanel from "@/components/vigil/VineyardManagerPanel";
import BlockManagerPanel from "@/components/vigil/BlockManagerPanel";
import ScanSessionPanel from "@/components/vigil/ScanSessionPanel";
import ClusterAnalysisPanel from "@/components/vigil/ClusterAnalysisPanel";
import YieldEstimationPanel from "@/components/vigil/YieldEstimationPanel";
import WeatherPanel from "@/components/vigil/WeatherPanel";
import IrrigationPanel from "@/components/vigil/IrrigationPanel";
import PestDiseasePanel from "@/components/vigil/PestDiseasePanel";
import SpeciesProfilePanel from "@/components/vigil/SpeciesProfilePanel";
import VigilMLWorkbenchPanel from "@/components/vigil/VigilMLWorkbenchPanel";

export default function VigilDashboard() {
    const [selectedVineyardId, setSelectedVineyardId] = useState<number | null>(null);
    const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
    const [selectedScanId, setSelectedScanId] = useState<number | null>(null);

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: "#fafafa" }}>
            <Sidebar />

            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-[1720px] px-5 py-6 xl:px-6 2xl:px-8 2xl:py-8 space-y-6 xl:space-y-8">
                    <header className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
                        <div className="flex flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl xl:text-3xl font-bold" style={{ color: "#171717" }}>VIGIL</h1>
                                <span
                                    className="text-xs px-2 py-1 rounded-full font-medium"
                                    style={{ backgroundColor: "#fff1f2", color: "#9f1239" }}
                                >
                                    Vine Intelligence for Grape Identification & Load-estimation
                                </span>
                            </div>
                            <p style={{ color: "#374151" }}>
                                AI-powered hidden grape cluster detection and yield estimation.
                            </p>
                        </div>
                    </header>

                    <VigilSummaryCards />

                    <div className="grid grid-cols-1 gap-6 xl:gap-8">
                        <PanelContainer title="Upload Data" titleColor="#9f1239">
                            <VigilMLWorkbenchPanel
                                blockId={selectedBlockId}
                                scanSessionId={selectedScanId}
                                displayMode="inference"
                            />
                        </PanelContainer>
                    </div>

                    <div
                        className="rounded-xl p-4 xl:p-5 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-3 xl:gap-4"
                        style={{ backgroundColor: "#ffffff", border: "1px solid #e5e5e5" }}
                    >
                        <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ backgroundColor: "#fafafa" }}>
                            <label className="text-sm font-medium" style={{ color: "#374151" }}>Vineyard</label>
                            <span
                                className="text-sm px-3 py-1 rounded-lg"
                                style={{
                                    backgroundColor: selectedVineyardId ? "#f0fdf4" : "#f5f5f5",
                                    color: selectedVineyardId ? "#166534" : "#9ca3af",
                                    border: `1px solid ${selectedVineyardId ? "#bbf7d0" : "#e5e5e5"}`,
                                }}
                            >
                                {selectedVineyardId ? `ID ${selectedVineyardId}` : "None selected"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ backgroundColor: "#fafafa" }}>
                            <label className="text-sm font-medium" style={{ color: "#374151" }}>Block</label>
                            <span
                                className="text-sm px-3 py-1 rounded-lg"
                                style={{
                                    backgroundColor: selectedBlockId ? "#f0fdf4" : "#f5f5f5",
                                    color: selectedBlockId ? "#166534" : "#9ca3af",
                                    border: `1px solid ${selectedBlockId ? "#bbf7d0" : "#e5e5e5"}`,
                                }}
                            >
                                {selectedBlockId ? `ID ${selectedBlockId}` : "None selected"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ backgroundColor: "#fafafa" }}>
                            <label className="text-sm font-medium" style={{ color: "#374151" }}>Scan</label>
                            <span
                                className="text-sm px-3 py-1 rounded-lg"
                                style={{
                                    backgroundColor: selectedScanId ? "#f0fdf4" : "#f5f5f5",
                                    color: selectedScanId ? "#166534" : "#9ca3af",
                                    border: `1px solid ${selectedScanId ? "#bbf7d0" : "#e5e5e5"}`,
                                }}
                            >
                                {selectedScanId ? `ID ${selectedScanId}` : "None selected"}
                            </span>
                        </div>
                        <div className="flex items-center justify-start 2xl:justify-end">
                            {(selectedVineyardId || selectedBlockId || selectedScanId) ? (
                                <button
                                    className="text-xs px-3 py-1 rounded-lg transition"
                                    style={{ color: "#9f1239", backgroundColor: "#fff1f2" }}
                                    onClick={() => {
                                        setSelectedVineyardId(null);
                                        setSelectedBlockId(null);
                                        setSelectedScanId(null);
                                    }}
                                >
                                    Clear All
                                </button>
                            ) : <div />}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6 xl:gap-8">
                        <div className="space-y-6 xl:space-y-8 2xl:col-span-4">
                            <PanelContainer title="Vineyard Management" titleColor="#9f1239">
                                <VineyardManagerPanel
                                    onSelectVineyard={(id: number) => {
                                        setSelectedVineyardId(id);
                                        setSelectedBlockId(null);
                                        setSelectedScanId(null);
                                    }}
                                />
                            </PanelContainer>

                            <PanelContainer title="Block Management" titleColor="#9f1239">
                                <BlockManagerPanel
                                    vineyardId={selectedVineyardId}
                                    onSelectBlock={(id: number) => {
                                        setSelectedBlockId(id);
                                        setSelectedScanId(null);
                                    }}
                                />
                            </PanelContainer>
                        </div>

                        <div className="space-y-6 xl:space-y-8 2xl:col-span-4">
                            <PanelContainer title="Scan Sessions" titleColor="#9f1239">
                                <ScanSessionPanel
                                    blockId={selectedBlockId}
                                    onSelectScan={(id: number) => {
                                        setSelectedScanId(id);
                                    }}
                                />
                            </PanelContainer>

                            <PanelContainer title="Cluster Analysis" titleColor="#9f1239">
                                <ClusterAnalysisPanel scanSessionId={selectedScanId} />
                            </PanelContainer>
                        </div>

                        <div className="space-y-6 xl:space-y-8 2xl:col-span-4">
                            <PanelContainer title="Yield Estimation (Bear / Base / Bull)" titleColor="#9f1239">
                                <YieldEstimationPanel blockId={selectedBlockId} />
                            </PanelContainer>

                            <PanelContainer title="Weather Integration" titleColor="#9f1239">
                                <WeatherPanel vineyardId={selectedVineyardId} />
                            </PanelContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6 xl:gap-8">
                        <div className="space-y-6 xl:space-y-8 2xl:col-span-6">
                            <PanelContainer title="Pest & Disease Detection" titleColor="#9f1239">
                                <PestDiseasePanel scanSessionId={selectedScanId} />
                            </PanelContainer>

                            <PanelContainer title="Irrigation Tracking" titleColor="#9f1239">
                                <IrrigationPanel blockId={selectedBlockId} />
                            </PanelContainer>
                        </div>

                        <div className="2xl:col-span-6">
                            <PanelContainer title="Grape Species Reference Profiles" titleColor="#9f1239">
                                <SpeciesProfilePanel />
                            </PanelContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
