"""
Legal Insight MVP templates.

These are intentionally lightweight and are meant to unblock the UI/UX end-to-end:
- State Profiles (rules + timeline windows)
- Logic Trees (dependency templates)
- Input Map templates (field lists)
- Form Automator (field mapping for 2 example forms)

In the next iteration, these should be replaced by data ingested from official sources.
"""

from __future__ import annotations

from typing import Any, Dict


STATE_CODES = ["CA", "NY", "FL", "TX", "IL"]


STATE_PROFILES: Dict[str, Dict[str, Any]] = {
    "CA": {
        "state_code": "CA",
        "primary_source_rule": {
            "label": "Primary American Source of Supply / importer-of-record arrangement",
            "required": True,
            "primary_source_name": "CA: Brand must be supplied through the licensed CA channel (document the US licensee arrangement for each brand).",
        },
        "physical_office_requirement": {
            "label": "US-based physical office/premises (or equivalent allowed recordkeeping office evidence)",
            "required": True,
            "office_types_allowed": ["USOffice", "ContractWithLicensedImporter"],
            "flag_if_missing": True,
        },
        "timelines": {
            "average_processing_days_by_permit": [
                {
                    "permit_name": "TTB Basic Permit (Importer/Wholesaler activity)",
                    "min_days": 34,
                    "max_days": 75,
                },
                {"permit_name": "TTB COLA (Wine labels)", "min_days": 6, "max_days": 15},
                {
                    "permit_name": "CA Importer-Wholesaler/License enablement (ABC)",
                    "min_days": 90,
                    "max_days": 180,
                },
                {
                    "permit_name": "CA product/brand enablement (label-related steps after COLA)",
                    "min_days": 30,
                    "max_days": 90,
                },
            ]
        },
    },
    "NY": {
        "state_code": "NY",
        "primary_source_rule": {
            "label": "Primary American Source of Supply / NY licensed channel arrangement",
            "required": True,
            "primary_source_name": "NY: Brand must be supplied through the NY-licensed wholesaler/importer channel (retain agreement/evidence).",
        },
        "physical_office_requirement": {
            "label": "NY State office solely used for licensed purposes (or allowed equivalent evidence)",
            "required": True,
            "office_types_allowed": ["USOffice", "ContractWithLicensedImporter"],
            "flag_if_missing": True,
        },
        "timelines": {
            "average_processing_days_by_permit": [
                {
                    "permit_name": "TTB Basic Permit (Importer/Wholesaler activity)",
                    "min_days": 34,
                    "max_days": 75,
                },
                {"permit_name": "TTB COLA (Wine labels)", "min_days": 6, "max_days": 15},
                {"permit_name": "NY SLA licensing (application review window)", "min_days": 154, "max_days": 220},
                {
                    "permit_name": "NY brand/label registration (SLA product enablement)",
                    "min_days": 20,
                    "max_days": 70,
                },
            ]
        },
    },
    "FL": {
        "state_code": "FL",
        "primary_source_rule": {
            "label": "Primary American Source of Supply / FL licensed channel arrangement",
            "required": True,
            "primary_source_name": "FL: Brand must be supplied through the FL-licensed importer/wholesaler channel (retain arrangement evidence).",
        },
        "physical_office_requirement": {
            "label": "Designated licensed premises/location evidence (and off-premises storage proof if applicable)",
            "required": True,
            "office_types_allowed": ["USOffice", "ContractWithLicensedImporter"],
            "flag_if_missing": True,
        },
        "timelines": {
            "average_processing_days_by_permit": [
                {
                    "permit_name": "TTB Basic Permit (Importer/Wholesaler activity)",
                    "min_days": 34,
                    "max_days": 75,
                },
                {"permit_name": "TTB COLA (Wine labels)", "min_days": 6, "max_days": 15},
                {
                    "permit_name": "FL importer/channel licensing (DBPR/ABT enablement)",
                    "min_days": 45,
                    "max_days": 120,
                },
                {
                    "permit_name": "FL brand/label registration (DBPR product registration)",
                    "min_days": 3,
                    "max_days": 10,
                },
            ]
        },
    },
    "TX": {
        "state_code": "TX",
        "primary_source_rule": {
            "label": "Primary American Source of Supply / TX licensed channel arrangement",
            "required": True,
            "primary_source_name": "TX: Product registration/enablement requires correct Texas authorized distribution channel (document Texas license role).",
        },
        "physical_office_requirement": {
            "label": "Licensed premises designation for the US entity (or edge-case nonresident authorization path evidence)",
            "required": True,
            "office_types_allowed": ["USOffice", "ContractWithLicensedImporter"],
            "flag_if_missing": True,
        },
        "timelines": {
            "average_processing_days_by_permit": [
                {
                    "permit_name": "TTB Basic Permit (Importer/Wholesaler activity)",
                    "min_days": 34,
                    "max_days": 75,
                },
                {"permit_name": "TTB COLA (Wine labels)", "min_days": 6, "max_days": 15},
                {"permit_name": "TX product registration (TABC) - after federal approval", "min_days": 10, "max_days": 30},
                {"permit_name": "TX channel enablement (licensing/authorization prerequisites)", "min_days": 60, "max_days": 120},
            ]
        },
    },
    "IL": {
        "state_code": "IL",
        "primary_source_rule": {
            "label": "Primary American Source of Supply / IL licensed channel arrangement",
            "required": True,
            "primary_source_name": "IL: Maintain IL distributor/importer channel evidence for each brand (and ensure pre-conditions for shipping route).",
        },
        "physical_office_requirement": {
            "label": "Warehouse/premises proof (lease/deed) and inspection-ready location evidence",
            "required": True,
            "office_types_allowed": ["USOffice", "ContractWithLicensedImporter"],
            "flag_if_missing": True,
        },
        "timelines": {
            "average_processing_days_by_permit": [
                {
                    "permit_name": "TTB Basic Permit (Importer/Wholesaler activity)",
                    "min_days": 34,
                    "max_days": 75,
                },
                {"permit_name": "TTB COLA (Wine labels)", "min_days": 6, "max_days": 15},
                {"permit_name": "IL distributor/importer licensing window", "min_days": 21, "max_days": 60},
                {"permit_name": "IL brand/product enablement (role/shipping-model dependent)", "min_days": 30, "max_days": 90},
            ]
        },
    },
}


LOGIC_TREES: Dict[str, Dict[str, Any]] = {
    "CA": {
        "state_code": "CA",
        "root_id": "CA_root",
        "nodes": [
            {
                "id": "CA_root",
                "title": "CA routing (starter): federal prerequisites -> CA channel licensing -> CA brand enablement",
                "type": "rule",
                "children": ["CA_ttb_basic_permit", "CA_ttb_cola"],
            },
            {
                "id": "CA_ttb_basic_permit",
                "title": "TTB Basic Permit (Importer/Wholesaler activity) - ensure US entity is authorized",
                "type": "requirement",
                "children": ["CA_primary_source_setup", "CA_physical_office_check", "CA_state_channel_permit"],
            },
            {
                "id": "CA_ttb_cola",
                "title": "TTB COLA (Wine labels) - obtain federal label approval for each product",
                "type": "requirement",
                "children": ["CA_brand_label_registration"],
            },
            {
                "id": "CA_primary_source_setup",
                "title": "CA primary US source of supply setup (agreement/evidence): licensed CA channel supplying each brand",
                "type": "rule",
                "children": ["CA_state_channel_permit"],
            },
            {
                "id": "CA_physical_office_check",
                "title": "CA physical office/premises check: provide evidence for licensed operations/recordkeeping where required",
                "type": "check",
                "children": ["CA_state_channel_permit"],
            },
            {
                "id": "CA_state_channel_permit",
                "title": "Submit CA importer/wholesaler licensing packet (channel enablement)",
                "type": "action",
                "children": ["CA_brand_label_registration"],
            },
            {
                "id": "CA_brand_label_registration",
                "title": "CA brand/label enablement (after TTB COLA + channel authorization)",
                "type": "action",
                "children": [],
            },
        ],
    },
    "NY": {
        "state_code": "NY",
        "root_id": "NY_root",
        "nodes": [
            {
                "id": "NY_root",
                "title": "NY routing (starter): federal prerequisites -> NY SLA licensing -> NY brand label enablement",
                "type": "rule",
                "children": ["NY_ttb_basic_permit", "NY_ttb_cola"],
            },
            {
                "id": "NY_ttb_basic_permit",
                "title": "TTB Basic Permit (Importer/Wholesaler activity) - ensure US entity is authorized",
                "type": "requirement",
                "children": ["NY_primary_source_setup", "NY_physical_office_check", "NY_state_channel_permit"],
            },
            {
                "id": "NY_ttb_cola",
                "title": "TTB COLA (Wine labels) - obtain federal label approval for each product",
                "type": "requirement",
                "children": ["NY_brand_label_registration"],
            },
            {
                "id": "NY_primary_source_setup",
                "title": "NY primary US source of supply setup (agreement/evidence): retain NY-licensed channel evidence for each brand",
                "type": "rule",
                "children": ["NY_state_channel_permit"],
            },
            {
                "id": "NY_physical_office_check",
                "title": "NY premises/office check: provide evidence supporting licensed operations/recordkeeping where required",
                "type": "check",
                "children": ["NY_state_channel_permit"],
            },
            {
                "id": "NY_state_channel_permit",
                "title": "Submit NY SLA licensing packet (channel enablement) for the correct role",
                "type": "action",
                "children": ["NY_brand_label_registration"],
            },
            {
                "id": "NY_brand_label_registration",
                "title": "NY brand label registration/enablement (after TTB COLA + SLA channel authorization)",
                "type": "action",
                "children": [],
            },
        ],
    },
    "FL": {
        "state_code": "FL",
        "root_id": "FL_root",
        "nodes": [
            {"id": "FL_root", "title": "FL routing (starter): federal prerequisites -> FL channel enablement -> FL brand/label registration", "type": "rule", "children": ["FL_ttb_basic_permit", "FL_ttb_cola"]},
            {"id": "FL_ttb_basic_permit", "title": "TTB Basic Permit (Importer/Wholesaler activity) - ensure US entity is authorized", "type": "requirement", "children": ["FL_primary_source_setup", "FL_physical_office_check", "FL_state_channel_permit"]},
            {"id": "FL_ttb_cola", "title": "TTB COLA (Wine labels) - obtain federal label approval for each product", "type": "requirement", "children": ["FL_brand_label_registration"]},
            {"id": "FL_primary_source_setup", "title": "FL primary US source of supply setup (agreement/evidence): licensed FL channel supplying each brand", "type": "rule", "children": ["FL_state_channel_permit"]},
            {"id": "FL_physical_office_check", "title": "FL premises/location check: licensed premises and (if applicable) off-premises storage evidence", "type": "check", "children": ["FL_state_channel_permit"]},
            {"id": "FL_state_channel_permit", "title": "Submit FL importer/channel licensing packet (channel enablement)", "type": "action", "children": ["FL_brand_label_registration"]},
            {"id": "FL_brand_label_registration", "title": "FL brand/label registration enablement (after TTB COLA + channel authorization)", "type": "action", "children": []},
        ],
    },
    "TX": {
        "state_code": "TX",
        "root_id": "TX_root",
        "nodes": [
            {"id": "TX_root", "title": "TX routing (starter): federal prerequisites -> Texas channel enablement -> TX product registration", "type": "rule", "children": ["TX_ttb_basic_permit", "TX_ttb_cola"]},
            {"id": "TX_ttb_basic_permit", "title": "TTB Basic Permit (Importer/Wholesaler activity) - ensure US entity is authorized", "type": "requirement", "children": ["TX_primary_source_setup", "TX_nonresident_or_premises_check", "TX_state_channel_permit"]},
            {"id": "TX_ttb_cola", "title": "TTB COLA (Wine labels) - obtain federal label approval for each product", "type": "requirement", "children": ["TX_product_registration"]},
            {"id": "TX_primary_source_setup", "title": "TX primary US source of supply setup: document Texas authorized distribution role/channel supplying each brand", "type": "rule", "children": ["TX_state_channel_permit"]},
            {"id": "TX_nonresident_or_premises_check", "title": "TX edge-case check: confirm resident license vs non-resident seller authorization / premises path before product registration", "type": "check", "children": ["TX_state_channel_permit"]},
            {"id": "TX_state_channel_permit", "title": "Submit TABC channel licensing/authorization packet (role-specific)", "type": "action", "children": ["TX_product_registration"]},
            {"id": "TX_product_registration", "title": "TX product registration/enablement (after TTB COLA + correct channel authorization)", "type": "action", "children": []},
        ],
    },
    "IL": {
        "state_code": "IL",
        "root_id": "IL_root",
        "nodes": [
            {"id": "IL_root", "title": "IL routing (starter): federal prerequisites -> IL channel licensing -> IL brand/product enablement", "type": "rule", "children": ["IL_ttb_basic_permit", "IL_ttb_cola"]},
            {"id": "IL_ttb_basic_permit", "title": "TTB Basic Permit (Importer/Distributor activity) - ensure US entity is authorized", "type": "requirement", "children": ["IL_primary_source_setup", "IL_physical_office_check", "IL_state_channel_permit"]},
            {"id": "IL_ttb_cola", "title": "TTB COLA (Wine labels) - obtain federal label approval for each product", "type": "requirement", "children": ["IL_brand_registration"]},
            {"id": "IL_primary_source_setup", "title": "IL primary US source of supply setup: retain IL-licensed channel evidence for each brand", "type": "rule", "children": ["IL_state_channel_permit"]},
            {"id": "IL_physical_office_check", "title": "IL premises/warehouse proof check: lease/deed/property rights evidence for inspection readiness", "type": "check", "children": ["IL_state_channel_permit"]},
            {"id": "IL_state_channel_permit", "title": "Submit IL distributor/importer licensing packet (channel enablement)", "type": "action", "children": ["IL_brand_registration"]},
            {"id": "IL_brand_registration", "title": "IL brand/product enablement (after TTB COLA + IL channel authorization)", "type": "action", "children": []},
        ],
    },
}


INPUT_MAPS: Dict[str, Dict[str, Any]] = {
    # Keep in sync with the frontend starter InputMapPanel templates.
    "CA": {
        "state_code": "CA",
        "fields": [
            {"key": "exporter_country", "label": "Exporter country", "type": "string", "required": True, "source_form": "Multiple forms (federal + state)"},
            {"key": "primary_american_source_registered", "label": "Primary American Source of Supply registration (required?)", "type": "boolean", "required": True, "source_form": "Importer/channel arrangement evidence"},
            {"key": "us_physical_office_present", "label": "US physical office/premises present", "type": "boolean", "required": True, "source_form": "Federal basic permit prerequisites (TTB)"},
            {"key": "licensed_us_importer_contract_present", "label": "Contract with licensed US importer present", "type": "boolean", "required": True, "source_form": "Federal basic permit prerequisites (TTB)"},
            {"key": "ttb_cola_submitted", "label": "TTB COLA submitted (yes/no)", "type": "boolean", "required": False, "source_form": "TTB COLA status"},
            {"key": "ttb_cola_approved", "label": "TTB COLA approved (yes/no)", "type": "boolean", "required": False, "source_form": "TTB COLA status"},
            {"key": "ca_prop65_warning_required", "label": "CA Prop 65 warning required for this product/label set", "type": "boolean", "required": False, "source_form": "CA labeling & Prop 65 compliance"},
            {"key": "ca_prop65_warning_statement", "label": "CA Prop 65 warning statement text (if required)", "type": "string", "required": False, "source_form": "CA labeling & Prop 65 compliance"},
        ],
    },
    "NY": {
        "state_code": "NY",
        "fields": [
            {"key": "exporter_country", "label": "Exporter country", "type": "string", "required": True, "source_form": "Multiple forms (federal + state)"},
            {"key": "primary_american_source_registered", "label": "Primary American Source of Supply registration (required?)", "type": "boolean", "required": True, "source_form": "Importer/channel arrangement evidence"},
            {"key": "us_physical_office_present", "label": "US physical office/premises present", "type": "boolean", "required": True, "source_form": "Federal basic permit prerequisites (TTB)"},
            {"key": "licensed_us_importer_contract_present", "label": "Contract with licensed US importer present", "type": "boolean", "required": True, "source_form": "Federal basic permit prerequisites (TTB)"},
            {"key": "ttb_cola_submitted", "label": "TTB COLA submitted (yes/no)", "type": "boolean", "required": False, "source_form": "TTB COLA status"},
            {"key": "ttb_cola_approved", "label": "TTB COLA approved (yes/no)", "type": "boolean", "required": False, "source_form": "TTB COLA status"},
            {"key": "sales_tax_permit_present", "label": "NY sales tax permit present", "type": "boolean", "required": False, "source_form": "NY Sales Tax / state registration"},
            {"key": "distributor_permit_present", "label": "NY distributor permit present", "type": "boolean", "required": False, "source_form": "Distributor permit"},
            {"key": "direct_shipper_permit_present", "label": "NY direct shipper permit present (if shipping model requires it)", "type": "boolean", "required": False, "source_form": "Direct shipper permit"},
            {"key": "ny_franchise_agreement_uploaded", "label": "NY franchise/brand agreement documentation uploaded", "type": "boolean", "required": False, "source_form": "NY brand/franchise compliance"},
            {"key": "ny_franchise_or_brand_agreement_document_ids", "label": "NY franchise/brand agreement document IDs (from vault)", "type": "array", "required": False, "source_form": "Document Vault"},
        ],
    },
    "FL": {
        "state_code": "FL",
        "fields": [
            {"key": "exporter_country", "label": "Exporter country", "type": "string", "required": True, "source_form": "Multiple forms (federal + state)"},
            {"key": "primary_american_source_registered", "label": "Primary American Source of Supply registration (required?)", "type": "boolean", "required": True, "source_form": "Importer/channel arrangement evidence"},
            {"key": "us_physical_office_present", "label": "US physical office/premises present", "type": "boolean", "required": True, "source_form": "Federal basic permit prerequisites (TTB)"},
            {"key": "licensed_us_importer_contract_present", "label": "Contract with licensed US importer present", "type": "boolean", "required": True, "source_form": "Federal basic permit prerequisites (TTB)"},
            {"key": "ttb_cola_submitted", "label": "TTB COLA submitted (yes/no)", "type": "boolean", "required": False, "source_form": "TTB COLA status"},
            {"key": "ttb_cola_approved", "label": "TTB COLA approved (yes/no)", "type": "boolean", "required": False, "source_form": "TTB COLA status"},
            {"key": "off_premises_storage_permit_needed", "label": "FL off-premises storage permit needed (if using off-premises storage)", "type": "boolean", "required": False, "source_form": "FL off-premises storage permit"},
            {"key": "off_premises_storage_permit_document_ids", "label": "FL off-premises storage permit document IDs (from vault)", "type": "array", "required": False, "source_form": "Document Vault"},
        ],
    },
    "TX": {
        "state_code": "TX",
        "fields": [
            {"key": "exporter_country", "label": "Exporter country", "type": "string", "required": True, "source_form": "Multiple forms (federal + state)"},
            {"key": "primary_american_source_registered", "label": "Primary American Source of Supply registration (required?)", "type": "boolean", "required": True, "source_form": "Importer/channel arrangement evidence"},
            {"key": "us_physical_office_present", "label": "US physical office/premises present", "type": "boolean", "required": True, "source_form": "Federal basic permit prerequisites (TTB)"},
            {"key": "licensed_us_importer_contract_present", "label": "Contract with licensed US importer present", "type": "boolean", "required": True, "source_form": "Federal basic permit prerequisites (TTB)"},
            {"key": "ttb_cola_submitted", "label": "TTB COLA submitted (yes/no)", "type": "boolean", "required": False, "source_form": "TTB COLA status"},
            {"key": "ttb_cola_approved", "label": "TTB COLA approved (yes/no)", "type": "boolean", "required": False, "source_form": "TTB COLA status"},
            {"key": "tx_nonresident_seller_permit_needed", "label": "TX nonresident seller permit needed (edge-case shipping path)", "type": "boolean", "required": False, "source_form": "TX importer/channel prerequisites"},
            {"key": "tx_nonresident_seller_permit_document_ids", "label": "TX nonresident seller permit document IDs (from vault)", "type": "array", "required": False, "source_form": "Document Vault"},
        ],
    },
    "IL": {
        "state_code": "IL",
        "fields": [
            {"key": "exporter_country", "label": "Exporter country", "type": "string", "required": True, "source_form": "Multiple forms (federal + state)"},
            {"key": "primary_american_source_registered", "label": "Primary American Source of Supply registration (required?)", "type": "boolean", "required": True, "source_form": "Importer/channel arrangement evidence"},
            {"key": "us_physical_office_present", "label": "US physical office/premises present", "type": "boolean", "required": True, "source_form": "Federal basic permit prerequisites (TTB)"},
            {"key": "licensed_us_importer_contract_present", "label": "Contract with licensed US importer present", "type": "boolean", "required": True, "source_form": "Federal basic permit prerequisites (TTB)"},
            {"key": "ttb_cola_submitted", "label": "TTB COLA submitted (yes/no)", "type": "boolean", "required": False, "source_form": "TTB COLA status"},
            {"key": "ttb_cola_approved", "label": "TTB COLA approved (yes/no)", "type": "boolean", "required": False, "source_form": "TTB COLA status"},
            {"key": "il_warehouse_proof_present", "label": "IL warehouse/premises proof present (inspection-ready location)", "type": "boolean", "required": False, "source_form": "IL licensing/inspection prerequisites"},
            {"key": "il_warehouse_proof_document_ids", "label": "IL warehouse/premises proof document IDs (from vault)", "type": "array", "required": False, "source_form": "Document Vault"},
        ],
    },
}


TTB_5100_24_FORM_FIELD_MAP = {
    # Keys are PDF/form field names (hypothetical for MVP).
    "ApplicantLegalName": "unified_profile.us_importer_company_name",
    "BusinessActivityType": "unified_profile.business_activity_type",
    "BondRequired": "unified_profile.ttb_bond_required",
    "PremisesType": "unified_profile.ttb_premises_type",
    "ResponsibleOfficerFullName": "unified_profile.ttb_responsible_officer_full_name",
    # Add more fields as you expand unified profile intake.
}


NY_SLA_BRAND_LABEL_REGISTRATION_MAP = {
    "BrandLabelStateCode": "NY",
    "PrimaryUSSourceOfSupplyChannelEvidenceProvided": "unified_profile.primary_american_source_registered",
    "USPhysicalOfficeEvidenceProvided": "unified_profile.us_physical_office_present",
    "LicensedImporterContractEvidenceProvided": "unified_profile.licensed_us_importer_contract_present",
    "TTBCOLAApproved": "unified_profile.ttb_cola_approved",
    "NYFranchiseAgreementUploaded": "unified_profile.state_specific.ny_franchise_agreement_uploaded",
    # Product/brand fields not collected in current MVP intake; fill later.
    "ProductBrandName": "unified_profile.product_brand_name",
    "ProductVintageOrNonVintage": "unified_profile.product_vintage_or_non_vintage",
}

