"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/app/lib/api";

type StateProfile = {
  state_code: string;
  primary_source_rule: {
    label: string;
    required: boolean;
    primary_source_name?: string;
  };
  physical_office_requirement: {
    label: string;
    required: boolean;
    office_types_allowed: string[];
    flag_if_missing: boolean;
  };
  timelines: {
    average_processing_days_by_permit: Array<{ permit_name: string; min_days: number; max_days: number }>;
  };
};

export default function StateProfileSchemaPanel({ stateCode }: { stateCode: string }) {
  const stateProfiles: Record<string, StateProfile> = useMemo(
    () => ({
      CA: {
        state_code: "CA",
        primary_source_rule: {
          label: "Primary American Source of Supply / importer-of-record arrangement",
          required: true,
          primary_source_name:
            "CA: Brand must be supplied through the licensed CA channel (document the US licensee arrangement for each brand).",
        },
        physical_office_requirement: {
          label: "US-based physical office/premises (or equivalent allowed recordkeeping office evidence)",
          required: true,
          office_types_allowed: ["USOffice", "ContractWithLicensedImporter"],
          flag_if_missing: true,
        },
        timelines: {
          average_processing_days_by_permit: [
            { permit_name: "TTB Basic Permit (Importer/Wholesaler activity)", min_days: 34, max_days: 75 },
            { permit_name: "TTB COLA (Wine labels)", min_days: 6, max_days: 15 },
            { permit_name: "CA Importer-Wholesaler/License enablement (ABC)", min_days: 90, max_days: 180 },
            { permit_name: "CA product/brand enablement (label-related steps after COLA)", min_days: 30, max_days: 90 },
          ],
        },
      },
      NY: {
        state_code: "NY",
        primary_source_rule: {
          label: "Primary American Source of Supply / NY licensed channel arrangement",
          required: true,
          primary_source_name:
            "NY: Brand must be supplied through the NY-licensed wholesaler/importer channel (retain agreement/evidence).",
        },
        physical_office_requirement: {
          label: "NY State office solely used for licensed purposes (or allowed equivalent evidence)",
          required: true,
          office_types_allowed: ["USOffice", "ContractWithLicensedImporter"],
          flag_if_missing: true,
        },
        timelines: {
          average_processing_days_by_permit: [
            { permit_name: "TTB Basic Permit (Importer/Wholesaler activity)", min_days: 34, max_days: 75 },
            { permit_name: "TTB COLA (Wine labels)", min_days: 6, max_days: 15 },
            { permit_name: "NY SLA licensing (application review window)", min_days: 154, max_days: 220 },
            { permit_name: "NY brand/label registration (SLA product enablement)", min_days: 20, max_days: 70 },
          ],
        },
      },
      FL: {
        state_code: "FL",
        primary_source_rule: {
          label: "Primary American Source of Supply / FL licensed channel arrangement",
          required: true,
          primary_source_name:
            "FL: Brand must be supplied through the FL-licensed importer/wholesaler channel (retain arrangement evidence).",
        },
        physical_office_requirement: {
          label: "Designated licensed premises/location evidence (and off-premises storage proof if applicable)",
          required: true,
          office_types_allowed: ["USOffice", "ContractWithLicensedImporter"],
          flag_if_missing: true,
        },
        timelines: {
          average_processing_days_by_permit: [
            { permit_name: "TTB Basic Permit (Importer/Wholesaler activity)", min_days: 34, max_days: 75 },
            { permit_name: "TTB COLA (Wine labels)", min_days: 6, max_days: 15 },
            { permit_name: "FL importer/channel licensing (DBPR/ABT enablement)", min_days: 45, max_days: 120 },
            { permit_name: "FL brand/label registration (DBPR product registration)", min_days: 3, max_days: 10 },
          ],
        },
      },
      TX: {
        state_code: "TX",
        primary_source_rule: {
          label: "Primary American Source of Supply / TX licensed channel arrangement",
          required: true,
          primary_source_name:
            "TX: Product registration/enablement requires correct Texas authorized distribution channel (document Texas license role).",
        },
        physical_office_requirement: {
          label: "Licensed premises designation for the US entity (or edge-case nonresident authorization path evidence)",
          required: true,
          office_types_allowed: ["USOffice", "ContractWithLicensedImporter"],
          flag_if_missing: true,
        },
        timelines: {
          average_processing_days_by_permit: [
            { permit_name: "TTB Basic Permit (Importer/Wholesaler activity)", min_days: 34, max_days: 75 },
            { permit_name: "TTB COLA (Wine labels)", min_days: 6, max_days: 15 },
            { permit_name: "TX product registration (TABC) - after federal approval", min_days: 10, max_days: 30 },
            { permit_name: "TX channel enablement (licensing/authorization prerequisites)", min_days: 60, max_days: 120 },
          ],
        },
      },
      IL: {
        state_code: "IL",
        primary_source_rule: {
          label: "Primary American Source of Supply / IL licensed channel arrangement",
          required: true,
          primary_source_name:
            "IL: Maintain IL distributor/importer channel evidence for each brand (and ensure pre-conditions for shipping route).",
        },
        physical_office_requirement: {
          label: "Warehouse/premises proof (lease/deed) and inspection-ready location evidence",
          required: true,
          office_types_allowed: ["USOffice", "ContractWithLicensedImporter"],
          flag_if_missing: true,
        },
        timelines: {
          average_processing_days_by_permit: [
            { permit_name: "TTB Basic Permit (Importer/Wholesaler activity)", min_days: 34, max_days: 75 },
            { permit_name: "TTB COLA (Wine labels)", min_days: 6, max_days: 15 },
            { permit_name: "IL distributor/importer licensing window", min_days: 21, max_days: 60 },
            { permit_name: "IL brand/product enablement (role/shipping-model dependent)", min_days: 30, max_days: 90 },
          ],
        },
      },
    }),
    []
  );

  const [backendStateProfiles, setBackendStateProfiles] = useState<Record<string, StateProfile> | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/legal-insight/state-profiles/")
      .then((res) => {
        if (!cancelled) setBackendStateProfiles(res.data?.states ?? null);
      })
      .catch(() => {
        // MVP fallback: keep using local templates if the backend isn't reachable.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedProfile =
    backendStateProfiles?.[stateCode] ?? stateProfiles[stateCode] ?? stateProfiles.NY;

  return (
    <div className="space-y-4">
      <div style={{ color: "#374151", fontSize: 13 }}>
        State compliance profile for the selected market.
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontWeight: 800, color: "#111827" }}>Primary American Source of Supply</div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: "6px 10px",
                borderRadius: 999,
                backgroundColor: resolvedProfile.primary_source_rule.required ? "#fff1f2" : "#f3f4f6",
                color: resolvedProfile.primary_source_rule.required ? "#9f1239" : "#374151",
                border: resolvedProfile.primary_source_rule.required ? "1px solid #fecdd3" : "1px solid #e5e5e5",
              }}
            >
              {resolvedProfile.primary_source_rule.required ? "Required" : "Optional"}
            </div>
          </div>

          <div style={{ marginTop: 8, color: "#374151", fontSize: 13, lineHeight: 1.45 }}>
            {resolvedProfile.primary_source_rule.label}
          </div>
          {resolvedProfile.primary_source_rule.primary_source_name ? (
            <div style={{ marginTop: 6, color: "#6b7280", fontSize: 12 }}>
              {resolvedProfile.primary_source_rule.primary_source_name}
            </div>
          ) : null}
        </div>

        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontWeight: 800, color: "#111827" }}>Physical US Office / Premises</div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: "6px 10px",
                borderRadius: 999,
                backgroundColor: resolvedProfile.physical_office_requirement.required ? "#fff1f2" : "#f3f4f6",
                color: resolvedProfile.physical_office_requirement.required ? "#9f1239" : "#374151",
                border: resolvedProfile.physical_office_requirement.required ? "1px solid #fecdd3" : "1px solid #e5e5e5",
              }}
            >
              {resolvedProfile.physical_office_requirement.required ? "Required" : "Optional"}
            </div>
          </div>

          <div style={{ marginTop: 8, color: "#374151", fontSize: 13, lineHeight: 1.45 }}>
            {resolvedProfile.physical_office_requirement.label}
          </div>

          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {resolvedProfile.physical_office_requirement.office_types_allowed.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "6px 10px",
                  borderRadius: 999,
                  backgroundColor: "#f3f4f6",
                  border: "1px solid #e5e5e5",
                  color: "#111827",
                }}
              >
                {t}
              </span>
            ))}
          </div>

          {resolvedProfile.physical_office_requirement.flag_if_missing ? (
            <div style={{ marginTop: 8, color: "#9f1239", fontSize: 12, fontWeight: 700 }}>
              If missing, your workflow should flag this immediately.
            </div>
          ) : null}
        </div>

        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div style={{ fontWeight: 800, color: "#111827" }}>Typical Timeline Windows</div>
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            {resolvedProfile.timelines.average_processing_days_by_permit.map((t) => (
              <div
                key={t.permit_name}
                style={{
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid #e5e5e5",
                  backgroundColor: "#f7f7f7",
                }}
              >
                <div style={{ fontWeight: 800, color: "#111827", fontSize: 13 }}>{t.permit_name}</div>
                <div style={{ marginTop: 4, color: "#6b7280", fontSize: 12 }}>
                  Estimate: {t.min_days}–{t.max_days} days
                </div>
              </div>
            ))}
          </div>
        </div>

        <details>
          <summary style={{ cursor: "pointer", color: "#9f1239", fontWeight: 800, fontSize: 13 }}>
            View JSON (for backend parsing)
          </summary>
          <pre
            style={{
              marginTop: 10,
              backgroundColor: "#f7f7f7",
              border: "1px solid #e5e5e5",
              borderRadius: 10,
              padding: 12,
              overflow: "auto",
              color: "#111827",
              fontSize: 12,
              lineHeight: 1.4,
            }}
          >
            {JSON.stringify(resolvedProfile, null, 2)}
          </pre>
        </details>
      </div>

      <div style={{ color: "#6b7280", fontSize: 12 }}>Source: legal insight state profile data.</div>
    </div>
  );
}

