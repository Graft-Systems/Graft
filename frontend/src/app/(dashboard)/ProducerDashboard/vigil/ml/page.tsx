"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import PanelContainer from "@/components/dashboard/PanelContainer";
import VigilDatasetImportPanel from "@/components/vigil/VigilDatasetImportPanel";
import VigilMLWorkbenchPanel from "@/components/vigil/VigilMLWorkbenchPanel";

export default function VigilMlSubDashboard() {
    const [mlRefreshToken, setMlRefreshToken] = useState(0);

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: "#fafafa" }}>
            <Sidebar />

            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-[1720px] px-5 py-6 xl:px-6 2xl:px-8 2xl:py-8 space-y-6 xl:space-y-8">
                    <header className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                        <div className="flex flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl xl:text-3xl font-bold" style={{ color: "#171717" }}>VIGIL ML Sub-dashboard</h1>
                                <span
                                    className="text-xs px-2 py-1 rounded-full font-medium"
                                    style={{ backgroundColor: "#fff1f2", color: "#9f1239" }}
                                >
                                    Dataset import + model training
                                </span>
                            </div>
                            <p style={{ color: "#374151" }}>
                                Focused workspace for dataset import and model training workflows.
                            </p>
                        </div>

                        <Link
                            href="/ProducerDashboard/vigil"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition"
                            style={{ backgroundColor: "#ffffff", color: "#9f1239", border: "1px solid #fecdd3" }}
                        >
                            <ArrowLeft size={16} />
                            Back to VIGIL Dashboard
                        </Link>
                    </header>

                    <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6 xl:gap-8">
                        <div className="2xl:col-span-5">
                            <PanelContainer title="Dataset Import" titleColor="#9f1239">
                                <VigilDatasetImportPanel onImportComplete={() => setMlRefreshToken((value) => value + 1)} />
                            </PanelContainer>
                        </div>

                        <div className="2xl:col-span-7">
                            <PanelContainer title="VIGIL ML Workbench" titleColor="#9f1239">
                                <VigilMLWorkbenchPanel
                                    blockId={null}
                                    scanSessionId={null}
                                    refreshToken={mlRefreshToken}
                                    displayMode="training"
                                />
                            </PanelContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
