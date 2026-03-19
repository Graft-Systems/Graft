"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/app/lib/api";

type InputMap = {
  state_code: string;
  // This is intentionally JSON-based so you can evolve it as you add more forms/fields.
  fields: Array<{
    key: string;
    label: string;
    type: "string" | "boolean" | "number" | "select" | "object" | "array";
    required: boolean;
    source_form: string;
  }>;
};

export default function InputMapPanel({ stateCode }: { stateCode: string }) {
  const storageKey = `legal_insight_input_map_${stateCode}`;

  const stateInputMaps: Record<string, Omit<InputMap, "state_code">> = useMemo(
    () => ({
      CA: {
        fields: [
          {
            key: "exporter_country",
            label: "Exporter country",
            type: "string",
            required: true,
            source_form: "Multiple forms (federal + state)",
          },
          {
            key: "primary_american_source_registered",
            label: "Primary American Source of Supply registration (required?)",
            type: "boolean",
            required: true,
            source_form: "Importer/channel arrangement evidence",
          },
          {
            key: "us_physical_office_present",
            label: "US physical office/premises present",
            type: "boolean",
            required: true,
            source_form: "Federal basic permit prerequisites (TTB)",
          },
          {
            key: "licensed_us_importer_contract_present",
            label: "Contract with licensed US importer present",
            type: "boolean",
            required: true,
            source_form: "Federal basic permit prerequisites (TTB)",
          },
          {
            key: "average_processing_days_ttb_basic_permit",
            label: "Average processing days estimate (TTB Basic Permit)",
            type: "number",
            required: false,
            source_form: "Timelines",
          },
          {
            key: "average_processing_days_ttb_cola",
            label: "Average processing days estimate (TTB COLA for wine labels)",
            type: "number",
            required: false,
            source_form: "Timelines",
          },
          {
            key: "ca_prop65_warning_required",
            label: "CA Prop 65 warning required for this product/label set",
            type: "boolean",
            required: false,
            source_form: "CA labeling & Prop 65 compliance",
          },
          {
            key: "ca_prop65_warning_statement",
            label: "CA Prop 65 warning statement text (if required)",
            type: "string",
            required: false,
            source_form: "CA labeling & Prop 65 compliance",
          },
        ],
      },
      NY: {
        fields: [
          {
            key: "exporter_country",
            label: "Exporter country",
            type: "string",
            required: true,
            source_form: "Multiple forms (federal + state)",
          },
          {
            key: "primary_american_source_registered",
            label: "Primary American Source of Supply registration (required?)",
            type: "boolean",
            required: true,
            source_form: "Importer/channel arrangement evidence",
          },
          {
            key: "us_physical_office_present",
            label: "US physical office/premises present",
            type: "boolean",
            required: true,
            source_form: "Federal basic permit prerequisites (TTB)",
          },
          {
            key: "licensed_us_importer_contract_present",
            label: "Contract with licensed US importer present",
            type: "boolean",
            required: true,
            source_form: "Federal basic permit prerequisites (TTB)",
          },
          {
            key: "average_processing_days_ttb_basic_permit",
            label: "Average processing days estimate (TTB Basic Permit)",
            type: "number",
            required: false,
            source_form: "Timelines",
          },
          {
            key: "average_processing_days_ttb_cola",
            label: "Average processing days estimate (TTB COLA for wine labels)",
            type: "number",
            required: false,
            source_form: "Timelines",
          },
          {
            key: "sales_tax_permit_present",
            label: "NY sales tax permit present",
            type: "boolean",
            required: false,
            source_form: "NY Sales Tax / state registration",
          },
          {
            key: "distributor_permit_present",
            label: "NY distributor permit present",
            type: "boolean",
            required: false,
            source_form: "Distributor permit",
          },
          {
            key: "direct_shipper_permit_present",
            label: "NY direct shipper permit present (if shipping model requires it)",
            type: "boolean",
            required: false,
            source_form: "Direct shipper permit",
          },
          {
            key: "ny_franchise_agreement_uploaded",
            label: "NY franchise/brand agreement documentation uploaded",
            type: "boolean",
            required: false,
            source_form: "NY brand/franchise compliance",
          },
          {
            key: "ny_franchise_or_brand_agreement_document_ids",
            label: "NY franchise/brand agreement document IDs (from vault)",
            type: "array",
            required: false,
            source_form: "Document Vault",
          },
        ],
      },
      FL: {
        fields: [
          {
            key: "exporter_country",
            label: "Exporter country",
            type: "string",
            required: true,
            source_form: "Multiple forms (federal + state)",
          },
          {
            key: "primary_american_source_registered",
            label: "Primary American Source of Supply registration (required?)",
            type: "boolean",
            required: true,
            source_form: "Importer/channel arrangement evidence",
          },
          {
            key: "us_physical_office_present",
            label: "US physical office/premises present",
            type: "boolean",
            required: true,
            source_form: "Federal basic permit prerequisites (TTB)",
          },
          {
            key: "licensed_us_importer_contract_present",
            label: "Contract with licensed US importer present",
            type: "boolean",
            required: true,
            source_form: "Federal basic permit prerequisites (TTB)",
          },
          {
            key: "average_processing_days_ttb_basic_permit",
            label: "Average processing days estimate (TTB Basic Permit)",
            type: "number",
            required: false,
            source_form: "Timelines",
          },
          {
            key: "average_processing_days_ttb_cola",
            label: "Average processing days estimate (TTB COLA for wine labels)",
            type: "number",
            required: false,
            source_form: "Timelines",
          },
          {
            key: "off_premises_storage_permit_needed",
            label: "FL off-premises storage permit needed (if using off-premises storage)",
            type: "boolean",
            required: false,
            source_form: "FL off-premises storage permit",
          },
          {
            key: "off_premises_storage_permit_document_ids",
            label: "FL off-premises storage permit document IDs (from vault)",
            type: "array",
            required: false,
            source_form: "Document Vault",
          },
        ],
      },
      TX: {
        fields: [
          {
            key: "exporter_country",
            label: "Exporter country",
            type: "string",
            required: true,
            source_form: "Multiple forms (federal + state)",
          },
          {
            key: "primary_american_source_registered",
            label: "Primary American Source of Supply registration (required?)",
            type: "boolean",
            required: true,
            source_form: "Importer/channel arrangement evidence",
          },
          {
            key: "us_physical_office_present",
            label: "US physical office/premises present",
            type: "boolean",
            required: true,
            source_form: "Federal basic permit prerequisites (TTB)",
          },
          {
            key: "licensed_us_importer_contract_present",
            label: "Contract with licensed US importer present",
            type: "boolean",
            required: true,
            source_form: "Federal basic permit prerequisites (TTB)",
          },
          {
            key: "average_processing_days_ttb_basic_permit",
            label: "Average processing days estimate (TTB Basic Permit)",
            type: "number",
            required: false,
            source_form: "Timelines",
          },
          {
            key: "average_processing_days_ttb_cola",
            label: "Average processing days estimate (TTB COLA for wine labels)",
            type: "number",
            required: false,
            source_form: "Timelines",
          },
          {
            key: "tx_nonresident_seller_permit_needed",
            label: "TX nonresident seller permit needed (edge-case shipping path)",
            type: "boolean",
            required: false,
            source_form: "TX importer/channel prerequisites",
          },
          {
            key: "tx_nonresident_seller_permit_document_ids",
            label: "TX nonresident seller permit document IDs (from vault)",
            type: "array",
            required: false,
            source_form: "Document Vault",
          },
        ],
      },
      IL: {
        fields: [
          {
            key: "exporter_country",
            label: "Exporter country",
            type: "string",
            required: true,
            source_form: "Multiple forms (federal + state)",
          },
          {
            key: "primary_american_source_registered",
            label: "Primary American Source of Supply registration (required?)",
            type: "boolean",
            required: true,
            source_form: "Importer/channel arrangement evidence",
          },
          {
            key: "us_physical_office_present",
            label: "US physical office/premises present",
            type: "boolean",
            required: true,
            source_form: "Federal basic permit prerequisites (TTB)",
          },
          {
            key: "licensed_us_importer_contract_present",
            label: "Contract with licensed US importer present",
            type: "boolean",
            required: true,
            source_form: "Federal basic permit prerequisites (TTB)",
          },
          {
            key: "average_processing_days_ttb_basic_permit",
            label: "Average processing days estimate (TTB Basic Permit)",
            type: "number",
            required: false,
            source_form: "Timelines",
          },
          {
            key: "average_processing_days_ttb_cola",
            label: "Average processing days estimate (TTB COLA for wine labels)",
            type: "number",
            required: false,
            source_form: "Timelines",
          },
          {
            key: "il_warehouse_proof_present",
            label: "IL warehouse/premises proof present (inspection-ready location)",
            type: "boolean",
            required: false,
            source_form: "IL licensing/inspection prerequisites",
          },
          {
            key: "il_warehouse_proof_document_ids",
            label: "IL warehouse/premises proof document IDs (from vault)",
            type: "array",
            required: false,
            source_form: "Document Vault",
          },
          {
            key: "il_warehouse_inspection_preferred_date_epoch",
            label: "IL inspection preferred date (epoch seconds)",
            type: "number",
            required: false,
            source_form: "IL licensing/inspection scheduling",
          },
        ],
      },
    }),
    []
  );

  const [backendInputMap, setBackendInputMap] = useState<InputMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/legal-insight/input-map/${stateCode}/`)
      .then((res) => {
        if (cancelled) return;
        setBackendInputMap(res.data?.input_map ?? null);
      })
      .catch(() => {
        // MVP fallback: backend unreachable -> use local templates.
        if (!cancelled) setBackendInputMap(null);
      });

    return () => {
      cancelled = true;
    };
  }, [stateCode]);

  const starter: InputMap = useMemo(() => {
    if (backendInputMap && backendInputMap.fields) return backendInputMap;
    const resolved = stateInputMaps[stateCode] ?? stateInputMaps.NY;
    return { state_code: stateCode, fields: resolved.fields };
  }, [stateCode, stateInputMaps, backendInputMap]);

  const [jsonText, setJsonText] = useState<string>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return raw;
    } catch {
      // ignore
    }
    return JSON.stringify(starter, null, 2);
  });

  // Persist edits
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, jsonText);
    } catch {
      // ignore
    }
  }, [storageKey, jsonText]);

  return (
    <div className="space-y-4">
      <div style={{ color: "#374151", fontSize: 13 }}>
        Field list for intake + form mapping for the selected state.
      </div>

      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          padding: 12,
          display: "grid",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontWeight: 900, color: "#111827", fontSize: 14 }}>{stateCode} Input Map</div>
          <div style={{ color: "#6b7280", fontSize: 12 }}>{starter.fields.length} fields</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
          {starter.fields.map((f) => (
            <div
              key={f.key}
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 10,
                padding: 10,
                backgroundColor: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div
                  style={{
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#111827",
                    wordBreak: "break-word",
                  }}
                >
                  {f.key}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: "1px solid #e5e5e5",
                    backgroundColor: f.required ? "#fff1f2" : "#f3f4f6",
                    color: f.required ? "#9f1239" : "#374151",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.required ? "Required" : "Optional"}
                </div>
              </div>
              <div style={{ marginTop: 6, color: "#374151", fontSize: 12, fontWeight: 700 }}>{f.label}</div>
              <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "4px 8px",
                    borderRadius: 999,
                    backgroundColor: "#fff",
                    border: "1px solid #e5e5e5",
                    color: "#111827",
                  }}
                >
                  {f.type}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 8px",
                    borderRadius: 999,
                    backgroundColor: "#fff",
                    border: "1px solid #e5e5e5",
                    color: "#6b7280",
                  }}
                >
                  {f.source_form}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <details>
        <summary style={{ cursor: "pointer", color: "#9f1239", fontWeight: 900, fontSize: 13 }}>
          Edit JSON (backend-parsed)
        </summary>
        <div style={{ marginTop: 10 }}>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            style={{
              width: "100%",
              minHeight: 240,
              borderRadius: 10,
              border: "1px solid #e5e5e5",
              padding: 12,
              color: "#111827",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: 12,
              lineHeight: 1.4,
              backgroundColor: "#fff",
            }}
          />
        </div>
      </details>
    </div>
  );
}

