from django.contrib import admin
from .models import (
    UserProfile, Producer, Wine, StoreChain, Store, 
    Delivery, RetailSale, StorePlacementStatus, InventorySnapshot
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