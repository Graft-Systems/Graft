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

            <div className="flex-1 p-8 space-y-8 overflow-y-auto">
                {/* Header */}
                <header className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold" style={{ color: "#171717" }}>VIGIL</h1>
                        <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: "#fff1f2", color: "#9f1239" }}
                        >
                            Vine Intelligence for Grape Identification & Load-estimation
                        </span>
                    </div>
                    <p style={{ color: "#374151" }}>
                        AI-powered hidden grape cluster detection and yield estimation.
                    </p>
                </header>

                {/* Summary KPIs */}
                <VigilSummaryCards />

                {/* Context Selectors */}
                <div
                    className="rounded-xl p-4 flex flex-wrap items-center gap-6"
                    style={{ backgroundColor: "#ffffff", border: "1px solid #e5e5e5" }}
                >
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium" style={{ color: "#374151" }}>Vineyard:</label>
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
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium" style={{ color: "#374151" }}>Block:</label>
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
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium" style={{ color: "#374151" }}>Scan:</label>
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
                    {(selectedVineyardId || selectedBlockId || selectedScanId) && (
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
                    )}
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-8">
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

                        <PanelContainer title="Pest & Disease Detection" titleColor="#9f1239">
                            <PestDiseasePanel scanSessionId={selectedScanId} />
                        </PanelContainer>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                        <PanelContainer title="VIGIL ML Workbench" titleColor="#9f1239">
                            <VigilMLWorkbenchPanel blockId={selectedBlockId} scanSessionId={selectedScanId} />
                        </PanelContainer>

                        <PanelContainer title="Yield Estimation (Bear / Base / Bull)" titleColor="#9f1239">
                            <YieldEstimationPanel blockId={selectedBlockId} />
                        </PanelContainer>

                        <PanelContainer title="Weather Integration" titleColor="#9f1239">
                            <WeatherPanel vineyardId={selectedVineyardId} />
                        </PanelContainer>

                        <PanelContainer title="Irrigation Tracking" titleColor="#9f1239">
                            <IrrigationPanel blockId={selectedBlockId} />
                        </PanelContainer>

                        <PanelContainer title="Grape Species Reference Profiles" titleColor="#9f1239">
                            <SpeciesProfilePanel />
                        </PanelContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
