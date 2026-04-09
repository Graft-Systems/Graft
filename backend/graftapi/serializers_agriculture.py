from rest_framework import serializers

from .models.agriculture import IrrigationLog, Vineyard, VineyardBlock, WeatherData


class VineyardSerializer(serializers.ModelSerializer):
    """Serializer for vineyard properties owned by a producer."""

    block_count = serializers.SerializerMethodField()

    class Meta:
        model = Vineyard
        fields = [
            "id",
            "producer",
            "name",
            "location",
            "latitude",
            "longitude",
            "total_acres",
            "elevation_ft",
            "soil_type",
            "climate_zone",
            "created_at",
            "block_count",
        ]
        read_only_fields = ["id", "producer", "created_at"]

    def get_block_count(self, obj):
        return obj.blocks.count()


class VineyardBlockSerializer(serializers.ModelSerializer):
    """Serializer for a specific block/section within a vineyard."""

    latest_scan_date = serializers.SerializerMethodField()
    scan_count = serializers.SerializerMethodField()

    class Meta:
        model = VineyardBlock
        fields = [
            "id",
            "vineyard",
            "name",
            "grape_species",
            "acres",
            "row_count",
            "vine_count",
            "vine_spacing_ft",
            "row_spacing_ft",
            "trellis_system",
            "rootstock",
            "year_planted",
            "created_at",
            "latest_scan_date",
            "scan_count",
        ]
        read_only_fields = ["id", "created_at", "latest_scan_date", "scan_count"]

    def get_latest_scan_date(self, obj):
        latest = obj.scan_sessions.order_by("-scan_date").first()
        return latest.scan_date if latest else None

    def get_scan_count(self, obj):
        return obj.scan_sessions.count()


class WeatherDataSerializer(serializers.ModelSerializer):
    """Serializer for weather observations and forecasts."""

    class Meta:
        model = WeatherData
        fields = [
            "id",
            "vineyard",
            "source",
            "date",
            "temp_high_f",
            "temp_low_f",
            "precipitation_in",
            "humidity_pct",
            "wind_speed_mph",
            "gdd_base50",
            "uv_index",
            "fetched_at",
        ]
        read_only_fields = ["id", "fetched_at"]


class IrrigationLogSerializer(serializers.ModelSerializer):
    """Serializer for irrigation events on a vineyard block."""

    block_name = serializers.ReadOnlyField(source="block.name")

    class Meta:
        model = IrrigationLog
        fields = [
            "id",
            "block",
            "block_name",
            "date",
            "method",
            "duration_hours",
            "gallons_applied",
            "soil_moisture_pct_before",
            "soil_moisture_pct_after",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "block_name"]
