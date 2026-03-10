from django.contrib import admin
from .models import (
    UserProfile, Producer, Wine, StoreChain, Store,
    Delivery, RetailSale, StorePlacementStatus, InventorySnapshot,
    WholesalePrice, RetailContact, LocationRequest, MarketingMaterial,
    Vineyard, VineyardBlock, ScanSession, GrapeCluster,
    PestDiseaseDetection, WeatherData, IrrigationLog,
    GrapeSpeciesProfile, YieldEstimate, VigilMLModelVersion,
    VigilTrainingSample, VigilInferenceResult,
)

# --- USER PROFILES ---

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role")
    list_filter = ("role",)
    search_fields = ("user__username", "user__email")
    ordering = ("user__username",)

# --- WINE & PRODUCERS ---

@admin.register(Producer)
class ProducerAdmin(admin.ModelAdmin):
    list_display = ("name", "region", "contact_email")
    search_fields = ("name", "region")

@admin.register(Wine)
class WineAdmin(admin.ModelAdmin):
    list_display = ("name", "producer", "varietal", "vintage", "bottle_size_ml")
    list_filter = ("producer", "varietal", "vintage")
    search_fields = ("name", "producer__name", "varietal")

# --- STORES & CHAINS ---

@admin.register(StoreChain)
class StoreChainAdmin(admin.ModelAdmin):
    list_display = ("name", "headquarters_city")
    search_fields = ("name",)

@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ("name", "neighborhood", "city", "chain")
    list_filter = ("city", "chain", "neighborhood")
    search_fields = ("name", "street_address", "zip_code")

# --- SALES & LOGISTICS ---

@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ("delivery_date", "store", "wine", "cases", "get_total_bottles")
    list_filter = ("delivery_date", "store", "wine")
    search_fields = ("store__name", "wine__name")
    date_hierarchy = "delivery_date"

    def get_total_bottles(self, obj):
        return obj.total_bottles()
    get_total_bottles.short_description = "Total Bottles"

@admin.register(RetailSale)
class RetailSaleAdmin(admin.ModelAdmin):
    list_display = ("date", "store", "wine", "bottles_sold")
    list_filter = ("date", "store", "wine")
    search_fields = ("store__name", "wine__name")
    date_hierarchy = "date"

# --- INSIGHTS & STATUS ---

@admin.register(StorePlacementStatus)
class StorePlacementStatusAdmin(admin.ModelAdmin):
    list_display = ("store", "wine", "status", "estimated_bottles", "estimated_days_left")
    list_filter = ("status", "store", "wine")
    search_fields = ("store__name", "wine__name")
    list_editable = ("status",) # Allow quick status updates from the list view

@admin.register(InventorySnapshot)
class InventorySnapshotAdmin(admin.ModelAdmin):
    list_display = ("snapshot_date", "store", "wine", "bottles_on_hand")
    list_filter = ("snapshot_date", "store", "wine")
    date_hierarchy = "snapshot_date"

# --- PRICING ---

@admin.register(WholesalePrice)
class WholesalePriceAdmin(admin.ModelAdmin):
    list_display = ("wine", "store", "price", "date_effective")
    list_filter = ("store", "wine")
    search_fields = ("store__name", "wine__name")
    date_hierarchy = "date_effective"

# --- CONTACTS & LOCATION REQUESTS ---

@admin.register(RetailContact)
class RetailContactAdmin(admin.ModelAdmin):
    list_display = ("store_name", "contact_name", "email", "phone", "last_contact_date")
    list_filter = ("producer",)
    search_fields = ("store_name", "contact_name", "email")

@admin.register(LocationRequest)
class LocationRequestAdmin(admin.ModelAdmin):
    list_display = ("store_name", "producer", "stage", "fit_score", "created_at")
    list_filter = ("stage", "producer")
    search_fields = ("store_name", "city")
    list_editable = ("stage",)

# --- MARKETING ---

@admin.register(MarketingMaterial)
class MarketingMaterialAdmin(admin.ModelAdmin):
    list_display = ("producer", "category", "created_at")
    list_filter = ("category", "producer")
    search_fields = ("prompt_used",)


# --- VIGIL ---

@admin.register(Vineyard)
class VineyardAdmin(admin.ModelAdmin):
    list_display = ("name", "producer", "location", "total_acres", "created_at")
    list_filter = ("producer", "climate_zone")
    search_fields = ("name", "location", "producer__name")


@admin.register(VineyardBlock)
class VineyardBlockAdmin(admin.ModelAdmin):
    list_display = ("name", "vineyard", "grape_species", "acres", "created_at")
    list_filter = ("grape_species", "vineyard__producer")
    search_fields = ("name", "vineyard__name", "grape_species")


@admin.register(ScanSession)
class ScanSessionAdmin(admin.ModelAdmin):
    list_display = ("id", "block", "scan_date", "status", "platform", "total_images")
    list_filter = ("status", "platform")
    search_fields = ("block__name", "block__vineyard__name")


@admin.register(GrapeCluster)
class GrapeClusterAdmin(admin.ModelAdmin):
    list_display = ("scan_session", "cluster_index", "visibility", "estimated_volume_cm3", "estimated_weight_g")
    list_filter = ("visibility",)
    search_fields = ("scan_session__block__name",)


@admin.register(PestDiseaseDetection)
class PestDiseaseDetectionAdmin(admin.ModelAdmin):
    list_display = ("display_name", "scan_session", "severity", "confidence_score", "detected_at")
    list_filter = ("severity",)
    search_fields = ("display_name", "detection_type", "scan_session__block__name")


@admin.register(WeatherData)
class WeatherDataAdmin(admin.ModelAdmin):
    list_display = ("vineyard", "date", "source", "temp_high_f", "precipitation_in")
    list_filter = ("source",)
    date_hierarchy = "date"


@admin.register(IrrigationLog)
class IrrigationLogAdmin(admin.ModelAdmin):
    list_display = ("block", "date", "method", "gallons_applied")
    list_filter = ("method",)
    date_hierarchy = "date"


@admin.register(GrapeSpeciesProfile)
class GrapeSpeciesProfileAdmin(admin.ModelAdmin):
    list_display = ("species_name", "avg_cluster_weight_g", "typical_yield_tons_per_acre")
    search_fields = ("species_name",)


@admin.register(YieldEstimate)
class YieldEstimateAdmin(admin.ModelAdmin):
    list_display = ("block", "estimate_date", "scenario", "estimated_tons_per_acre", "confidence_score")
    list_filter = ("scenario",)
    date_hierarchy = "estimate_date"


@admin.register(VigilTrainingSample)
class VigilTrainingSampleAdmin(admin.ModelAdmin):
    list_display = (
        "sample_name",
        "producer",
        "block",
        "grape_species",
        "target_volume_cm3",
        "target_weight_g",
        "created_at",
    )
    list_filter = ("producer", "grape_species")
    search_fields = ("sample_name", "producer__name", "block__name", "grape_species")


@admin.register(VigilMLModelVersion)
class VigilMLModelVersionAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "producer",
        "version",
        "status",
        "training_sample_count",
        "is_active",
        "trained_at",
    )
    list_filter = ("status", "is_active")
    search_fields = ("name", "producer__name")


@admin.register(VigilInferenceResult)
class VigilInferenceResultAdmin(admin.ModelAdmin):
    list_display = (
        "sample_name",
        "producer",
        "model_version",
        "predicted_volume_cm3",
        "confidence_score",
        "created_at",
    )
    list_filter = ("producer",)
    search_fields = ("sample_name", "producer__name", "grape_species")