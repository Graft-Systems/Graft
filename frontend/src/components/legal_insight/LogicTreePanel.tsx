"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/app/lib/api";

type LogicNode = {
  id: string;
  title: string;
  type: "rule" | "requirement" | "check" | "action";
  children: string[];
};

type LogicTree = {
  state_code: string;
  root_id: string;
  nodes: LogicNode[];
};

export default function LogicTreePanel({ stateCode }: { stateCode: string }) {
  const storageKey = `legal_insight_logic_tree_${stateCode}`;
  const [govText, setGovText] = useState(
    "Optional: paste government/regulatory text here."
  );

  const [tree, setTree] = useState<LogicTree | null>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.state_code === stateCode) {
        return parsed as LogicTree;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [backendLogicTrees, setBackendLogicTrees] = useState<Record<string, LogicTree> | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/legal-insight/logic-trees/")
      .then((res) => {
        if (cancelled) return;
        setBackendLogicTrees(res.data?.states ?? null);
      })
      .catch(() => {
        // MVP fallback: keep local starterTrees.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const starterTrees: Record<string, LogicTree> = useMemo(
    () => ({
      CA: {
        state_code: "CA",
        root_id: "CA_root",
        nodes: [
          {
            id: "CA_root",
            title: "CA routing (starter): federal prerequisites -> CA channel licensing -> CA brand enablement",
            type: "rule",
            children: ["CA_ttb_basic_permit", "CA_ttb_cola"],
          },
          {
            id: "CA_ttb_basic_permit",
            title: "TTB Basic Permit (Importer/Wholesaler activity) - ensure US entity is authorized",
            type: "requirement",
            children: ["CA_primary_source_setup", "CA_physical_office_check", "CA_state_channel_permit"],
          },
          {
            id: "CA_ttb_cola",
            title: "TTB COLA (Wine labels) - obtain federal label approval for each product",
            type: "requirement",
            children: ["CA_brand_label_registration"],
          },
          {
            id: "CA_primary_source_setup",
            title: "CA primary US source of supply setup (agreement/evidence): licensed CA channel supplying each brand",
            type: "rule",
            children: ["CA_state_channel_permit"],
          },
          {
            id: "CA_physical_office_check",
            title: "CA physical office/premises check: provide evidence for licensed operations/recordkeeping where required",
            type: "check",
            children: ["CA_state_channel_permit"],
          },
          {
            id: "CA_state_channel_permit",
            title: "Submit CA importer/wholesaler licensing packet (channel enablement)",
            type: "action",
            children: ["CA_brand_label_registration"],
          },
          {
            id: "CA_brand_label_registration",
            title: "CA brand/label enablement (after TTB COLA + channel authorization)",
            type: "action",
            children: [],
          },
        ],
      },
      NY: {
        state_code: "NY",
        root_id: "NY_root",
        nodes: [
          {
            id: "NY_root",
            title: "NY routing (starter): federal prerequisites -> NY SLA licensing -> NY brand label enablement",
            type: "rule",
            children: ["NY_ttb_basic_permit", "NY_ttb_cola"],
          },
          {
            id: "NY_ttb_basic_permit",
            title: "TTB Basic Permit (Importer/Wholesaler activity) - ensure US entity is authorized",
            type: "requirement",
            children: ["NY_primary_source_setup", "NY_physical_office_check", "NY_state_channel_permit"],
          },
          {
            id: "NY_ttb_cola",
            title: "TTB COLA (Wine labels) - obtain federal label approval for each product",
            type: "requirement",
            children: ["NY_brand_label_registration"],
          },
          {
            id: "NY_primary_source_setup",
            title: "NY primary US source of supply setup (agreement/evidence): retain NY-licensed channel evidence for each brand",
            type: "rule",
            children: ["NY_state_channel_permit"],
          },
          {
            id: "NY_physical_office_check",
            title: "NY premises/office check: provide evidence supporting licensed operations/recordkeeping where required",
            type: "check",
            children: ["NY_state_channel_permit"],
          },
          {
            id: "NY_state_channel_permit",
            title: "Submit NY SLA licensing packet (channel enablement) for the correct role",
            type: "action",
            children: ["NY_brand_label_registration"],
          },
          {
            id: "NY_brand_label_registration",
            title: "NY brand label registration/enablement (after TTB COLA + SLA channel authorization)",
            type: "action",
            children: [],
          },
        ],
      },
      FL: {
        state_code: "FL",
        root_id: "FL_root",
        nodes: [
          {
            id: "FL_root",
            title: "FL routing (starter): federal prerequisites -> FL channel enablement -> FL brand/label registration",
            type: "rule",
            children: ["FL_ttb_basic_permit", "FL_ttb_cola"],
          },
          {
            id: "FL_ttb_basic_permit",
            title: "TTB Basic Permit (Importer/Wholesaler activity) - ensure US entity is authorized",
            type: "requirement",
            children: ["FL_primary_source_setup", "FL_physical_office_check", "FL_state_channel_permit"],
          },
          {
            id: "FL_ttb_cola",
            title: "TTB COLA (Wine labels) - obtain federal label approval for each product",
            type: "requirement",
            children: ["FL_brand_label_registration"],
          },
          {
            id: "FL_primary_source_setup",
            title: "FL primary US source of supply setup (agreement/evidence): licensed FL channel supplying each brand",
            type: "rule",
            children: ["FL_state_channel_permit"],
          },
          {
            id: "FL_physical_office_check",
            title: "FL premises/location check: licensed premises and (if applicable) off-premises storage evidence",
            type: "check",
            children: ["FL_state_channel_permit"],
          },
          {
            id: "FL_state_channel_permit",
            title: "Submit FL importer/channel licensing packet (channel enablement)",
            type: "action",
            children: ["FL_brand_label_registration"],
          },
          {
            id: "FL_brand_label_registration",
            title: "FL brand/label registration enablement (after TTB COLA + channel authorization)",
            type: "action",
            children: [],
          },
        ],
      },
      TX: {
        state_code: "TX",
        root_id: "TX_root",
        nodes: [
          {
            id: "TX_root",
            title: "TX routing (starter): federal prerequisites -> Texas channel enablement -> TX product registration",
            type: "rule",
            children: ["TX_ttb_basic_permit", "TX_ttb_cola"],
          },
          {
            id: "TX_ttb_basic_permit",
            title: "TTB Basic Permit (Importer/Wholesaler activity) - ensure US entity is authorized",
            type: "requirement",
            children: ["TX_primary_source_setup", "TX_nonresident_or_premises_check", "TX_state_channel_permit"],
          },
          {
            id: "TX_ttb_cola",
            title: "TTB COLA (Wine labels) - obtain federal label approval for each product",
            type: "requirement",
            children: ["TX_product_registration"],
          },
          {
            id: "TX_primary_source_setup",
            title: "TX primary US source of supply setup: document Texas authorized distribution role/channel supplying each brand",
            type: "rule",
            children: ["TX_state_channel_permit"],
          },
          {
            id: "TX_nonresident_or_premises_check",
            title: "TX edge-case check: confirm resident license vs non-resident seller authorization / premises path before product registration",
            type: "check",
            children: ["TX_state_channel_permit"],
          },
          {
            id: "TX_state_channel_permit",
            title: "Submit TABC channel licensing/authorization packet (role-specific)",
            type: "action",
            children: ["TX_product_registration"],
          },
          {
            id: "TX_product_registration",
            title: "TX product registration/enablement (after TTB COLA + correct channel authorization)",
            type: "action",
            children: [],
          },
        ],
      },
      IL: {
        state_code: "IL",
        root_id: "IL_root",
        nodes: [
          {
            id: "IL_root",
            title: "IL routing (starter): federal prerequisites -> IL channel licensing -> IL brand/product enablement",
            type: "rule",
            children: ["IL_ttb_basic_permit", "IL_ttb_cola"],
          },
          {
            id: "IL_ttb_basic_permit",
            title: "TTB Basic Permit (Importer/Distributor activity) - ensure US entity is authorized",
            type: "requirement",
            children: ["IL_primary_source_setup", "IL_physical_office_check", "IL_state_channel_permit"],
          },
          {
            id: "IL_ttb_cola",
            title: "TTB COLA (Wine labels) - obtain federal label approval for each product",
            type: "requirement",
            children: ["IL_brand_registration"],
          },
          {
            id: "IL_primary_source_setup",
            title: "IL primary US source of supply setup: retain IL-licensed channel evidence for each brand",
            type: "rule",
            children: ["IL_state_channel_permit"],
          },
          {
            id: "IL_physical_office_check",
            title: "IL premises/warehouse proof check: lease/deed/property rights evidence for inspection readiness",
            type: "check",
            children: ["IL_state_channel_permit"],
          },
          {
            id: "IL_state_channel_permit",
            title: "Submit IL distributor/importer licensing packet (channel enablement)",
            type: "action",
            children: ["IL_brand_registration"],
          },
          {
            id: "IL_brand_registration",
            title: "IL brand/product enablement (after TTB COLA + IL channel authorization)",
            type: "action",
            children: [],
          },
        ],
      },
    }),
    []
  );

  const handleGenerate = () => {
    const resolved = backendLogicTrees?.[stateCode] ?? starterTrees[stateCode] ?? starterTrees.NY;
    setTree(resolved);

    try {
      localStorage.setItem(storageKey, JSON.stringify(resolved));
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      <div style={{ color: "#374151", fontSize: 13 }}>
        Generate a state-aware dependency tree for routing.
      </div>

      <textarea
        value={govText}
        onChange={(e) => setGovText(e.target.value)}
        style={{
          width: "100%",
          minHeight: 180,
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

      <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleGenerate}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #e5e5e5",
            backgroundColor: "#e11d48",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          Generate Logic Tree
        </button>

        <button
          type="button"
          onClick={() => setTree(null)}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #e5e5e5",
            backgroundColor: "#fff",
            color: "#111827",
            fontWeight: 600,
          }}
        >
          Clear
        </button>
      </div>

      {tree && tree.state_code === stateCode && (
        <div className="space-y-3">
          <div style={{ fontWeight: 800, color: "#111827" }}>Logic Tree JSON</div>
          <pre
            style={{
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
            {JSON.stringify(tree, null, 2)}
          </pre>

          <div style={{ color: "#6b7280", fontSize: 12 }}>Generated from current state template.</div>
        </div>
      )}
    </div>
  );
}

