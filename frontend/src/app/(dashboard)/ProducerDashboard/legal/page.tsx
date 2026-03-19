"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import PanelContainer from "@/components/dashboard/PanelContainer";
import StateProfileSchemaPanel from "../../../../components/legal_insight/StateProfileSchemaPanel";
import InputMapPanel from "../../../../components/legal_insight/InputMapPanel";
import UnifiedProfileInterviewPanel from "../../../../components/legal_insight/UnifiedProfileInterviewPanel";
import DocumentVaultPanel from "../../../../components/legal_insight/DocumentVaultPanel";
import LogicTreePanel from "../../../../components/legal_insight/LogicTreePanel";
import FormAutomatorPanel from "../../../../components/legal_insight/FormAutomatorPanel";
import ComplianceMonitorPanel from "../../../../components/legal_insight/ComplianceMonitorPanel";
import LegalChatPanel from "../../../../components/legal_insight/LegalChatPanel";
import { useMemo, useState } from "react";

export default function LegalInsightDashboard() {
  const topStates = useMemo(() => ["CA", "NY", "FL", "TX", "IL"], []);
  const [selectedState, setSelectedState] = useState<string>("NY");

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#fafafa" }}>
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1720px] px-5 py-6 xl:px-6 2xl:px-8 2xl:py-8 space-y-6 xl:space-y-8">
          <header className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl xl:text-3xl font-bold" style={{ color: "#171717" }}>
                  Legal Insight Provider
                </h1>
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ backgroundColor: "#fff1f2", color: "#9f1239" }}
                >
                  State Profile → Logic Tree → Compliance Workflow
                </span>
              </div>
              <p style={{ color: "#374151" }}>
                Convert messy government text into a structured logic tree, then drive a guided
                {selectedState}/permit workflow (scaffold MVP).
              </p>
            </div>

            <div className="flex items-end gap-3">
              <div className="space-y-1">
                <div style={{ fontWeight: 700, color: "#111827", fontSize: 12 }}>State</div>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #e5e5e5",
                    backgroundColor: "#fff",
                    minWidth: 160,
                  }}
                >
                  {topStates.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6 xl:gap-8">
            <div className="2xl:col-span-5 space-y-6 xl:space-y-8">
              <PanelContainer title="State Profile (Master Schema)" titleColor="#9f1239">
                <StateProfileSchemaPanel stateCode={selectedState} />
              </PanelContainer>

              <PanelContainer title={`${selectedState} Input Map (Starter Fields)`} titleColor="#9f1239">
                <InputMapPanel stateCode={selectedState} />
              </PanelContainer>

              <PanelContainer title="Document Vault (Upload Once)" titleColor="#9f1239">
                <DocumentVaultPanel />
              </PanelContainer>
            </div>

            <div className="2xl:col-span-7 space-y-6 xl:space-y-8">
              <PanelContainer title="Unified Profile Interview" titleColor="#9f1239">
                <UnifiedProfileInterviewPanel key={selectedState} stateCode={selectedState} />
              </PanelContainer>

              <PanelContainer title="Logic Tree Builder (Gov Text → Nodes)" titleColor="#9f1239">
                <LogicTreePanel key={selectedState} stateCode={selectedState} />
              </PanelContainer>

              <PanelContainer title="Form Automator (Draft + Tracker)" titleColor="#9f1239">
                <FormAutomatorPanel key={selectedState} stateCode={selectedState} />
              </PanelContainer>

              <ComplianceMonitorPanel key={selectedState} stateCode={selectedState} />
              <LegalChatPanel key={selectedState} stateCode={selectedState} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

