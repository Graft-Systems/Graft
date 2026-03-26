from __future__ import annotations

import hashlib
import uuid
from typing import Any, Dict, List

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .legal_insight_templates import (
    INPUT_MAPS,
    LOGIC_TREES,
    NY_SLA_BRAND_LABEL_REGISTRATION_MAP,
    STATE_CODES,
    STATE_PROFILES,
    TTB_5100_24_FORM_FIELD_MAP,
)
from .legal_rag import state_corpus_summary

ALL_STATE_CODES = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
]


def _build_generic_state_profile(state_code: str) -> Dict[str, Any]:
    code = (state_code or "").upper() or "NA"
    return {
        "state_code": code,
        "primary_source_rule": {
            "label": f"Primary American Source of Supply / {code} licensed channel arrangement",
            "required": True,
            "primary_source_name": f"{code}: Brand should be supplied through a licensed importer/wholesaler channel with retained agreement evidence.",
        },
        "physical_office_requirement": {
            "label": f"{code} licensed premises or equivalent office evidence",
            "required": True,
            "office_types_allowed": ["USOffice", "ContractWithLicensedImporter"],
            "flag_if_missing": True,
        },
        "timelines": {
            "average_processing_days_by_permit": [
                {"permit_name": "TTB Basic Permit (Importer/Wholesaler activity)", "min_days": 34, "max_days": 75},
                {"permit_name": "TTB COLA (Wine labels)", "min_days": 6, "max_days": 15},
                {"permit_name": f"{code} importer/channel licensing review", "min_days": 30, "max_days": 120},
                {"permit_name": f"{code} brand/product registration review", "min_days": 10, "max_days": 90},
            ]
        },
    }


def _build_generic_input_map(state_code: str) -> Dict[str, Any]:
    code = (state_code or "").upper() or "NA"
    lc = code.lower()
    return {
        "state_code": code,
        "fields": [
            {"key": "exporter_country", "label": "Exporter country", "type": "string", "required": True, "source_form": "Multiple forms (federal + state)"},
            {"key": "primary_american_source_registered", "label": f"Primary American Source registration ({code})", "type": "boolean", "required": True, "source_form": f"{code} importer/channel arrangement"},
            {"key": "us_physical_office_present", "label": "US physical office/premises present", "type": "boolean", "required": True, "source_form": "Federal basic permit prerequisites (TTB)"},
            {"key": "licensed_us_importer_contract_present", "label": "Contract with licensed US importer present", "type": "boolean", "required": True, "source_form": "Federal basic permit prerequisites (TTB)"},
            {"key": "ttb_cola_submitted", "label": "TTB COLA submitted (yes/no)", "type": "boolean", "required": False, "source_form": "TTB COLA status"},
            {"key": "ttb_cola_approved", "label": "TTB COLA approved (yes/no)", "type": "boolean", "required": False, "source_form": "TTB COLA status"},
            {"key": f"{lc}_state_channel_permit_present", "label": f"{code} state channel/import permit present", "type": "boolean", "required": False, "source_form": f"{code} state permit"},
            {"key": f"{lc}_state_document_ids", "label": f"{code} state compliance document IDs (from vault)", "type": "array", "required": False, "source_form": "Document Vault"},
        ],
    }


def _build_generic_logic_tree(state_code: str) -> Dict[str, Any]:
    code = (state_code or "").upper() or "NA"
    root = f"{code}_root"
    return {
        "state_code": code,
        "root_id": root,
        "nodes": [
            {
                "id": root,
                "title": f"{code} routing (generic): federal prerequisites -> state channel enablement -> state brand registration",
                "type": "rule",
                "children": [f"{code}_ttb_basic_permit", f"{code}_ttb_cola"],
            },
            {
                "id": f"{code}_ttb_basic_permit",
                "title": "TTB Basic Permit (Importer/Wholesaler activity)",
                "type": "requirement",
                "children": [f"{code}_state_channel_permit"],
            },
            {
                "id": f"{code}_ttb_cola",
                "title": "TTB COLA (Wine labels)",
                "type": "requirement",
                "children": [f"{code}_brand_registration"],
            },
            {
                "id": f"{code}_state_channel_permit",
                "title": f"{code} state channel/import permit",
                "type": "action",
                "children": [f"{code}_brand_registration"],
            },
            {
                "id": f"{code}_brand_registration",
                "title": f"{code} brand/product registration",
                "type": "action",
                "children": [],
            },
        ],
    }


def _deep_get(obj: Any, path: str) -> Any:
    """
    Minimal deep getter for paths like:
      unified_profile.state_specific.ny_franchise_agreement_uploaded
    Returns None if any step is missing.
    """
    cur: Any = obj
    for part in path.split("."):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return None
    return cur


def _compute_step_completion(state_code: str, unified_profile: Dict[str, Any], logic_tree: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    MVP completion logic: based on which unified-profile keys are non-null.
    The UI can still show incomplete states for COLA/product/label details not yet captured.
    """
    state_code = (state_code or "").upper()

    def answered(key_path: str) -> bool:
        # key_path can be dotted: state_specific.ny_franchise_agreement_uploaded
        parts = key_path.split(".")
        cur: Any = unified_profile
        for p in parts:
            if isinstance(cur, dict) and p in cur:
                cur = cur[p]
            else:
                return False
        return cur is not None

    basic_answered = (
        answered("primary_american_source_registered")
        and answered("us_physical_office_present")
        and answered("licensed_us_importer_contract_present")
    )

    # Heuristic: mark the key nodes complete when their mapped evidence is answered.
    completion: Dict[str, bool] = {}
    nodes = logic_tree.get("nodes", []) if isinstance(logic_tree, dict) else []

    for node in nodes:
        node_id = node.get("id")
        title = node.get("title", "")
        if not node_id:
            continue

        # TTB basic permit gating: require the 3 core yes/no questions to be answered.
        if node_id.endswith("_ttb_basic_permit"):
            completion[node_id] = (
                answered("primary_american_source_registered")
                and answered("us_physical_office_present")
                and answered("licensed_us_importer_contract_present")
            )
            continue

        # COLA gating: require ttb_cola_approved to be answered.
        if node_id.endswith("_ttb_cola"):
            completion[node_id] = answered("ttb_cola_approved")
            continue

        # State channel/brand enablement: require conditional field for the state (if present),
        # otherwise require the basic channel evidence.
        if node_id.endswith("_state_channel_permit") or node_id.endswith("_brand_label_registration") or node_id.endswith("_brand_registration"):
            conditional_key_map = {
                "CA": "state_specific.ca_prop65_needs_warning",
                "NY": "state_specific.ny_franchise_agreement_uploaded",
                "FL": "state_specific.fl_off_premises_storage_permit_needed",
                "TX": "state_specific.tx_nonresident_seller_permit_needed",
                "IL": "state_specific.il_warehouse_proof_present",
            }
            cond_path = conditional_key_map.get(state_code)
            if cond_path:
                # Convert state_specific.x -> nested get
                cond_parts = cond_path.split(".")[1:]  # drop leading state_specific
                cur: Any = unified_profile.get("state_specific", {}) if isinstance(unified_profile, dict) else {}
                for p in cond_parts:
                    if isinstance(cur, dict) and p in cur:
                        cur = cur[p]
                    else:
                        cur = None
                        break
                conditional_answered = cur is not None
            else:
                conditional_answered = True

            completion[node_id] = basic_answered and conditional_answered
            continue

        if node_id.endswith("_primary_source_setup") or node_id.endswith("_physical_office_check"):
            completion[node_id] = basic_answered
            continue

        # Default: not complete until you extend unified-profile intake.
        completion[node_id] = completion.get(node_id, False)

    steps: List[Dict[str, Any]] = []
    # Convert logic tree nodes to a UI step list.
    for node in nodes:
        node_id = node.get("id")
        if not node_id:
            continue
        node_type = node.get("type")
        title = node.get("title", node_id)
        # Show requirement/check/action nodes as steps.
        if node_type in ("requirement", "check", "action"):
            steps.append(
                {
                    "id": node_id,
                    "title": title,
                    "dependsOn": node.get("children", []),  # children represent downstream
                    "completed": bool(completion.get(node_id, False)),
                }
            )

    return steps


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def legal_insight_state_profiles(request):
    states = {code: STATE_PROFILES.get(code) or _build_generic_state_profile(code) for code in ALL_STATE_CODES}
    return Response({"states": states})


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def legal_insight_logic_trees(request):
    states = {code: LOGIC_TREES.get(code) or _build_generic_logic_tree(code) for code in ALL_STATE_CODES}
    return Response({"states": states})


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def legal_insight_state_corpus(request, state_code: str):
    state_code = (state_code or "").upper()
    if len(state_code) != 2:
        return Response({"error": "Invalid state_code"}, status=status.HTTP_400_BAD_REQUEST)
    return Response(state_corpus_summary(state_code))


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def legal_insight_input_map(request, state_code: str):
    state_code = (state_code or "").upper()
    if len(state_code) != 2:
        return Response({"error": "Invalid state_code"}, status=status.HTTP_400_BAD_REQUEST)
    return Response({"state_code": state_code, "input_map": INPUT_MAPS.get(state_code) or _build_generic_input_map(state_code)})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def legal_insight_form_automator_generate(request):
    state_code = (request.data.get("state_code") or "").upper()
    unified_profile = request.data.get("unified_profile") or {}
    if len(state_code) != 2:
        return Response({"error": "Invalid state_code"}, status=status.HTTP_400_BAD_REQUEST)
    logic_tree = LOGIC_TREES.get(state_code) or _build_generic_logic_tree(state_code)

    steps = _compute_step_completion(state_code, unified_profile, logic_tree)

    # Generate mapped forms using the MVP field map.
    def map_form(field_map: Dict[str, str]) -> Dict[str, Any]:
        out: Dict[str, Any] = {}
        for pdf_field, unified_path in field_map.items():
            # MVP convention: unified_path is either "unified_profile.<key...>" or a direct key.
            if unified_path.startswith("unified_profile."):
                out[pdf_field] = _deep_get({"unified_profile": unified_profile}, unified_path)
            else:
                out[pdf_field] = unified_profile.get(unified_path)
        return out

    ttb_mapped = map_form(TTB_5100_24_FORM_FIELD_MAP)
    ny_mapped = map_form(NY_SLA_BRAND_LABEL_REGISTRATION_MAP)

    draft_packet_preview = {
        "note": "MVP preview: mapped JSON payload only (no PDF filling/RPA yet).",
        "state_code": state_code,
        "mapped_forms": {
            "TTB_F_5100_24_BASIC_PERMIT": ttb_mapped,
            "NY_SLA_BRAND_LABEL_REGISTRATION": ny_mapped,
        },
    }

    return Response({"steps": steps, "draft_packet_preview": draft_packet_preview})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def legal_insight_chat(request):
    """
    MVP chatbot: deterministic routing explanation using State Profiles + Logic Trees.
    """
    message = (request.data.get("message") or "").strip()
    state_code = (request.data.get("state_code") or "").upper()
    unified_profile = request.data.get("unified_profile") or {}

    if not message:
        return Response({"error": "Message cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)

    inferred_state = state_code if state_code in STATE_PROFILES else "NY"
    profile = STATE_PROFILES.get(inferred_state)
    logic_tree = LOGIC_TREES.get(inferred_state)

    if not profile or not logic_tree:
        return Response({"error": "State templates not found"}, status=status.HTTP_400_BAD_REQUEST)

    # Heuristic comparison for the example question.
    lower = message.lower()
    comparison_text = ""
    if "taking longer" in lower or "longer than" in lower or "why" in lower:
        # Try detect CA vs TX mentions.
        if "texas" in lower and "california" in lower:
            tx = STATE_PROFILES["TX"]
            ca = STATE_PROFILES["CA"]
            # pick a representative step: "TX channel enablement" vs "CA license enablement"
            tx_window = next((t for t in tx["timelines"]["average_processing_days_by_permit"] if t["permit_name"].startswith("TX product registration")), None)
            ca_window = next((t for t in ca["timelines"]["average_processing_days_by_permit"] if t["permit_name"].startswith("CA Importer-Wholesaler/License enablement")), None)
            if tx_window and ca_window:
                comparison_text = f"Texas’s channel enablement window is estimated {tx_window['min_days']}–{tx_window['max_days']} days vs California’s {ca_window['min_days']}–{ca_window['max_days']} days (MVP estimates from state profiles)."

    # Determine which core gating answers are missing.
    missing = []
    core_keys = ["primary_american_source_registered", "us_physical_office_present", "licensed_us_importer_contract_present"]
    for k in core_keys:
        if unified_profile.get(k) is None:
            missing.append(k)

    next_step_node = None
    for node in logic_tree.get("nodes", []):
        node_id = node.get("id")
        title = node.get("title", "")
        if not node_id:
            continue
        if node_id.endswith("_ttb_basic_permit") and missing:
            next_step_node = title
            break

    base = [
        "Legal Insight Provider (MVP): informational compliance routing, not legal advice.",
        f"Target state: {inferred_state}.",
        f"State gating requirement: {profile['primary_source_rule']['label']}",
    ]
    if missing:
        base.append("What’s blocking your next step (based on the MVP unified profile answers):")
        base.append(f"- Missing answers for: {', '.join(missing)}")
    else:
        base.append("Your core gating answers are present in the MVP unified profile.")

    # Add dependency chain snippet.
    chain = []
    root = logic_tree.get("root_id")
    chain.append(f"Dependency chain (starter): {root} -> see nodes: {', '.join([n['id'] for n in logic_tree['nodes'][:4] if 'id' in n])} ...")

    if comparison_text:
        base.append(comparison_text)
    if next_step_node:
        base.append(f"Next likely step: {next_step_node}")

    if not comparison_text and not next_step_node:
        base.append("Next action: upload any supporting documents and answer the missing gating questions in the Unified Profile.")

    return Response({"message": "\n".join(base + ["", *chain])})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def legal_insight_upload_document(request):
    uploaded = request.FILES.get("file")
    if uploaded is None:
        return Response({"error": "Missing file field named 'file'"}, status=status.HTTP_400_BAD_REQUEST)

    # MVP size guard (10MB)
    if uploaded.size > 10 * 1024 * 1024:
        return Response({"error": "File too large (max 10MB)"} , status=status.HTTP_400_BAD_REQUEST)

    # Compute sha256 while reading bytes.
    data = uploaded.read()
    sha = hashlib.sha256(data).hexdigest()
    doc_id = f"li_doc_{uuid.uuid4().hex}_{int(uploaded.size)}"

    # Save to default storage for later retrieval (no DB record in MVP).
    storage_path = f"legal_insight_uploads/{doc_id}_{uploaded.name}"
    default_storage.save(storage_path, ContentFile(data))

    return Response(
        {
            "doc_id": doc_id,
            "filename": uploaded.name,
            "content_hash_sha256": sha,
            "storage_path": storage_path,
        },
        status=status.HTTP_201_CREATED,
    )

