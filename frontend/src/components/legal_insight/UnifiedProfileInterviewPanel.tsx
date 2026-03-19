"use client";

import { useEffect, useMemo, useState } from "react";

type UnifiedProfile = {
  exporter_company_name: string;
  exporter_country: string;
  us_importer_company_name: string;
  primary_american_source_registered: boolean | null;
  us_physical_office_present: boolean | null;
  licensed_us_importer_contract_present: boolean | null;
  ttb_cola_submitted: boolean | null;
  ttb_cola_approved: boolean | null;
  // Edge-case fields that may only apply to a specific state.
  state_specific: {
    ca_prop65_needs_warning: boolean | null;
    ny_franchise_agreement_uploaded: boolean | null;
    fl_off_premises_storage_permit_needed: boolean | null;
    tx_nonresident_seller_permit_needed: boolean | null;
    il_warehouse_proof_present: boolean | null;
  };
};

export default function UnifiedProfileInterviewPanel({ stateCode }: { stateCode: string }) {
  const storageKey = `legal_insight_unified_profile_${stateCode}`;

  const starter: UnifiedProfile = useMemo(
    () => ({
      exporter_company_name: "",
      exporter_country: "France",
      us_importer_company_name: "",
      primary_american_source_registered: null,
      us_physical_office_present: null,
      licensed_us_importer_contract_present: null,
      ttb_cola_submitted: null,
      ttb_cola_approved: null,
      state_specific: {
        ca_prop65_needs_warning: null,
        ny_franchise_agreement_uploaded: null,
        fl_off_premises_storage_permit_needed: null,
        tx_nonresident_seller_permit_needed: null,
        il_warehouse_proof_present: null,
      },
    }),
    []
  );

  const [profile, setProfile] = useState<UnifiedProfile>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed as UnifiedProfile;
      }
    } catch {
      // ignore
    }
    return starter;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }, [storageKey, profile]);

  const conditionalByState: Record<
    string,
    { key: keyof UnifiedProfile["state_specific"]; label: string; help: string }
  > = useMemo(
    () => ({
      CA: {
        key: "ca_prop65_needs_warning",
        label: "Conditional (CA): Prop 65 warning requirement applies (yes/no)",
        help: "State-specific condition for California.",
      },
      NY: {
        key: "ny_franchise_agreement_uploaded",
        label: "Conditional (NY): Franchise/brand agreement documentation uploaded (yes/no)",
        help: "State-specific condition for New York.",
      },
      FL: {
        key: "fl_off_premises_storage_permit_needed",
        label: "Conditional (FL): Off-premises storage permit needed (yes/no)",
        help: "State-specific condition for Florida.",
      },
      TX: {
        key: "tx_nonresident_seller_permit_needed",
        label: "Conditional (TX): Non-resident seller permit needed (yes/no)",
        help: "State-specific condition for Texas.",
      },
      IL: {
        key: "il_warehouse_proof_present",
        label: "Conditional (IL): Warehouse/premises proof is ready (yes/no)",
        help: "State-specific condition for Illinois.",
      },
    }),
    []
  );

  const conditional = conditionalByState[stateCode];

  return (
    <div className="space-y-4">
      <div style={{ color: "#374151", fontSize: 13 }}>
        One interview for all downstream forms in {stateCode}.
      </div>

      <div className="space-y-3">
        <label style={{ display: "block", fontWeight: 600, color: "#111827", fontSize: 13 }}>
          Exporter company name
          <input
            value={profile.exporter_company_name}
            onChange={(e) => setProfile((p) => ({ ...p, exporter_company_name: e.target.value }))}
            style={{ width: "100%", marginTop: 6, padding: 10, border: "1px solid #e5e5e5", borderRadius: 10 }}
            placeholder="e.g., Château Example SA"
          />
        </label>

        <label style={{ display: "block", fontWeight: 600, color: "#111827", fontSize: 13 }}>
          Exporter country
          <select
            value={profile.exporter_country}
            onChange={(e) => setProfile((p) => ({ ...p, exporter_country: e.target.value }))}
            style={{ width: "100%", marginTop: 6, padding: 10, border: "1px solid #e5e5e5", borderRadius: 10 }}
          >
            <option value="France">France</option>
            <option value="Italy">Italy</option>
            <option value="Spain">Spain</option>
            <option value="Chile">Chile</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <label style={{ display: "block", fontWeight: 600, color: "#111827", fontSize: 13 }}>
          US importer/wholesaler company name
          <input
            value={profile.us_importer_company_name}
            onChange={(e) => setProfile((p) => ({ ...p, us_importer_company_name: e.target.value }))}
            style={{ width: "100%", marginTop: 6, padding: 10, border: "1px solid #e5e5e5", borderRadius: 10 }}
            placeholder="e.g., US Imports LLC"
          />
        </label>

        <div className="space-y-2">
          {[
            {
              key: "primary_american_source_registered" as const,
              label: "Primary American Source of Supply registration (yes/no)",
            },
            { key: "us_physical_office_present" as const, label: "US physical office present (yes/no)" },
            {
              key: "licensed_us_importer_contract_present" as const,
              label: "Licensed US importer contract present (yes/no)",
            },
          ].map((q) => (
            <div key={q.key}>
              <div style={{ color: "#111827", fontWeight: 600, fontSize: 13 }}>{q.label}</div>
              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() =>
                    setProfile((p) => ({
                      ...p,
                      [q.key]: true,
                    }))
                  }
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #e5e5e5",
                    backgroundColor: profile[q.key] === true ? "#e11d48" : "#fff",
                    color: profile[q.key] === true ? "#fff" : "#111827",
                  }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setProfile((p) => ({
                      ...p,
                      [q.key]: false,
                    }))
                  }
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #e5e5e5",
                    backgroundColor: profile[q.key] === false ? "#e11d48" : "#fff",
                    color: profile[q.key] === false ? "#fff" : "#111827",
                  }}
                >
                  No
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div style={{ color: "#111827", fontWeight: 900, fontSize: 13 }}>TTB Label Approval (COLA)</div>
          {[
            { key: "ttb_cola_submitted" as const, label: "COLA submitted (yes/no)" },
            { key: "ttb_cola_approved" as const, label: "COLA approved (yes/no)" },
          ].map((q) => (
            <div key={q.key}>
              <div style={{ color: "#111827", fontWeight: 600, fontSize: 13, marginTop: 2 }}>{q.label}</div>
              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setProfile((p) => ({ ...p, [q.key]: true }))}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #e5e5e5",
                    backgroundColor: profile[q.key] === true ? "#e11d48" : "#fff",
                    color: profile[q.key] === true ? "#fff" : "#111827",
                  }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setProfile((p) => ({ ...p, [q.key]: false }))}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #e5e5e5",
                    backgroundColor: profile[q.key] === false ? "#e11d48" : "#fff",
                    color: profile[q.key] === false ? "#fff" : "#111827",
                  }}
                >
                  No
                </button>
              </div>
            </div>
          ))}
        </div>

        {conditional && (
          <div className="space-y-2">
            <div style={{ color: "#111827", fontWeight: 700, fontSize: 13 }}>{conditional.label}</div>
            <div style={{ color: "#6b7280", fontSize: 12 }}>{conditional.help}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() =>
                  setProfile((p) => ({
                    ...p,
                    state_specific: { ...p.state_specific, [conditional.key]: true },
                  }))
                }
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e5e5",
                  backgroundColor:
                    profile.state_specific?.[conditional.key] === true ? "#e11d48" : "#fff",
                  color: profile.state_specific?.[conditional.key] === true ? "#fff" : "#111827",
                }}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() =>
                  setProfile((p) => ({
                    ...p,
                    state_specific: { ...p.state_specific, [conditional.key]: false },
                  }))
                }
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e5e5",
                  backgroundColor:
                    profile.state_specific?.[conditional.key] === false ? "#e11d48" : "#fff",
                  color: profile.state_specific?.[conditional.key] === false ? "#fff" : "#111827",
                }}
              >
                No
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <div style={{ fontWeight: 700, color: "#111827", fontSize: 13, marginBottom: 6 }}>
          Interview Summary (local)
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 10, backgroundColor: "#f8fafc" }}>
              <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 800 }}>Exporter company</div>
              <div style={{ marginTop: 4, color: "#111827", fontSize: 13, fontWeight: 800 }}>
                {profile.exporter_company_name || "Not provided"}
              </div>
            </div>

            <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 10, backgroundColor: "#f8fafc" }}>
              <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 800 }}>Exporter country</div>
              <div style={{ marginTop: 4, color: "#111827", fontSize: 13, fontWeight: 800 }}>
                {profile.exporter_country || "Not provided"}
              </div>
            </div>

            <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 10, backgroundColor: "#f8fafc" }}>
              <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 800 }}>US importer/wholesaler</div>
              <div style={{ marginTop: 4, color: "#111827", fontSize: 13, fontWeight: 800 }}>
                {profile.us_importer_company_name || "Not provided"}
              </div>
            </div>

            <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 10, backgroundColor: "#f8fafc" }}>
              <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 800 }}>Primary channel registration</div>
              <div style={{ marginTop: 4, fontSize: 13, fontWeight: 900 }}>
                {profile.primary_american_source_registered === null
                  ? "Not answered"
                  : profile.primary_american_source_registered
                    ? "Yes"
                    : "No"}
              </div>
            </div>

            <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 10, backgroundColor: "#f8fafc" }}>
              <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 800 }}>US physical office/premises</div>
              <div style={{ marginTop: 4, fontSize: 13, fontWeight: 900 }}>
                {profile.us_physical_office_present === null
                  ? "Not answered"
                  : profile.us_physical_office_present
                    ? "Yes"
                    : "No"}
              </div>
            </div>

            <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 10, backgroundColor: "#f8fafc" }}>
              <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 800 }}>Licensed US importer contract</div>
              <div style={{ marginTop: 4, fontSize: 13, fontWeight: 900 }}>
                {profile.licensed_us_importer_contract_present === null
                  ? "Not answered"
                  : profile.licensed_us_importer_contract_present
                    ? "Yes"
                    : "No"}
              </div>
            </div>

            <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 10, backgroundColor: "#f8fafc" }}>
              <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 800 }}>TTB COLA submitted</div>
              <div style={{ marginTop: 4, fontSize: 13, fontWeight: 900 }}>
                {profile.ttb_cola_submitted === null ? "Not answered" : profile.ttb_cola_submitted ? "Yes" : "No"}
              </div>
            </div>

            <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 10, backgroundColor: "#f8fafc" }}>
              <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 800 }}>TTB COLA approved</div>
              <div style={{ marginTop: 4, fontSize: 13, fontWeight: 900 }}>
                {profile.ttb_cola_approved === null ? "Not answered" : profile.ttb_cola_approved ? "Yes" : "No"}
              </div>
            </div>
          </div>

          {conditional && (
            <div
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 10,
                padding: 10,
                backgroundColor: "#fff7ed",
              }}
            >
              <div style={{ color: "#9a3412", fontSize: 12, fontWeight: 900 }}>State-specific: {conditional.label}</div>
              <div style={{ marginTop: 6, color: "#111827", fontSize: 13, fontWeight: 900 }}>
                {profile.state_specific?.[conditional.key] === null
                  ? "Not answered"
                  : profile.state_specific?.[conditional.key]
                    ? "Yes"
                    : "No"}
              </div>
            </div>
          )}
        </div>
      </div>

      <details>
        <summary style={{ cursor: "pointer", color: "#9f1239", fontWeight: 900, fontSize: 13 }}>
          View JSON (backend-parsed)
        </summary>
        <pre
          style={{
            marginTop: 10,
            backgroundColor: "#f7f7f7",
            border: "1px solid #e5e5e5",
            borderRadius: 10,
            padding: 12,
            color: "#111827",
            fontSize: 12,
            lineHeight: 1.4,
            overflow: "auto",
          }}
        >
          {JSON.stringify(profile, null, 2)}
        </pre>
      </details>
    </div>
  );
}

