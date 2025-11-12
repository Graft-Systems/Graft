from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role")           # Columns shown in list view
    list_filter = ("role",)                   # Sidebar filter by role
    search_fields = ("user__username",)       # Search by username
    ordering = ("user__username",)            # Sort alphabetically by username
