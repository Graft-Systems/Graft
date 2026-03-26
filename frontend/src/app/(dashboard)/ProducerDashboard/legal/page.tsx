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
  const allStates = useMemo(
    () => [
      { code: "AL", name: "Alabama" },
      { code: "AK", name: "Alaska" },
      { code: "AZ", name: "Arizona" },
      { code: "AR", name: "Arkansas" },
      { code: "CA", name: "California" },
      { code: "CO", name: "Colorado" },
      { code: "CT", name: "Connecticut" },
      { code: "DE", name: "Delaware" },
      { code: "FL", name: "Florida" },
      { code: "GA", name: "Georgia" },
      { code: "HI", name: "Hawaii" },
      { code: "ID", name: "Idaho" },
      { code: "IL", name: "Illinois" },
      { code: "IN", name: "Indiana" },
      { code: "IA", name: "Iowa" },
      { code: "KS", name: "Kansas" },
      { code: "KY", name: "Kentucky" },
      { code: "LA", name: "Louisiana" },
      { code: "ME", name: "Maine" },
      { code: "MD", name: "Maryland" },
      { code: "MA", name: "Massachusetts" },
      { code: "MI", name: "Michigan" },
      { code: "MN", name: "Minnesota" },
      { code: "MS", name: "Mississippi" },
      { code: "MO", name: "Missouri" },
      { code: "MT", name: "Montana" },
      { code: "NE", name: "Nebraska" },
      { code: "NV", name: "Nevada" },
      { code: "NH", name: "New Hampshire" },
      { code: "NJ", name: "New Jersey" },
      { code: "NM", name: "New Mexico" },
      { code: "NY", name: "New York" },
      { code: "NC", name: "North Carolina" },
      { code: "ND", name: "North Dakota" },
      { code: "OH", name: "Ohio" },
      { code: "OK", name: "Oklahoma" },
      { code: "OR", name: "Oregon" },
      { code: "PA", name: "Pennsylvania" },
      { code: "RI", name: "Rhode Island" },
      { code: "SC", name: "South Carolina" },
      { code: "SD", name: "South Dakota" },
      { code: "TN", name: "Tennessee" },
      { code: "TX", name: "Texas" },
      { code: "UT", name: "Utah" },
      { code: "VT", name: "Vermont" },
      { code: "VA", name: "Virginia" },
      { code: "WA", name: "Washington" },
      { code: "WV", name: "West Virginia" },
      { code: "WI", name: "Wisconsin" },
      { code: "WY", name: "Wyoming" },
    ],
    []
  );
  const [selectedState, setSelectedState] = useState<string>("NY");

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#fafafa" }}>
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1720px] px-5 py-6 xl:px-6 2xl:px-8 2xl:py-8 space-y-6 xl:space-y-8">
          <header
            className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid #f1f5f9",
              backgroundColor: "#fff",
            }}
          >
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl xl:text-3xl font-bold tracking-tight" style={{ color: "#171717" }}>
                  Legal Insight Provider
                </h1>
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ backgroundColor: "#fff1f2", color: "#9f1239", border: "1px solid #fecdd3" }}
                >
                  State Profile {"->"} Logic Tree {"->"} Compliance Workflow
                </span>
              </div>
              <p
                style={{
                  color: "#475569",
                  fontSize: 13,
                  lineHeight: 1.5,
                  maxWidth: 760,
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "8px 10px",
                }}
              >
                Convert complex alcohol regulations into a guided {selectedState} workflow with clear next steps.
              </p>
            </div>

            <div
              className="space-y-1"
              style={{ minWidth: 240, padding: "8px 10px", borderRadius: 10, backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
            >
              <div style={{ fontWeight: 700, color: "#111827", fontSize: 12 }}>State</div>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#fff",
                    color: "#111827",
                    fontWeight: 600,
                    width: "100%",
                  }}
                >
                  {allStates.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.code} - {state.name}
                    </option>
                  ))}
                </select>
            </div>
          </header>

          <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6 xl:gap-8">
            <div className="2xl:col-span-5 space-y-6 xl:space-y-8">
              <PanelContainer title="State Profile (Master Schema)" titleColor="#9f1239">
                <StateProfileSchemaPanel stateCode={selectedState} />
              </PanelContainer>

              <PanelContainer title="Compliance Copilot" titleColor="#9f1239">
                <LegalChatPanel key={selectedState} stateCode={selectedState} />
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

              <PanelContainer title="Compliance Monitor (Dashboard)" titleColor="#9f1239">
                <ComplianceMonitorPanel key={selectedState} stateCode={selectedState} />
              </PanelContainer>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

