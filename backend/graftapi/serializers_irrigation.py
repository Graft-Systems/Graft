from rest_framework import serializers

from .models.irrigation import (
    BlockMoistureTarget,
    IrrigationRecommendation,
    SoilMoistureReading,
)


class SoilMoistureReadingSerializer(serializers.ModelSerializer):
    block_name = serializers.ReadOnlyField(source="block.name")
    vineyard_name = serializers.ReadOnlyField(source="block.vineyard.name")

    class Meta:
        model = SoilMoistureReading
        fields = [
            "id",
            "block",
            "block_name",
            "vineyard_name",
            "recorded_at",
            "moisture_pct",
            "source",
            "source_label",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "block_name", "vineyard_name", "created_at"]


class BlockMoistureTargetSerializer(serializers.ModelSerializer):
    block_name = serializers.ReadOnlyField(source="block.name")

    class Meta:
        model = BlockMoistureTarget
        fields = [
            "id",
            "block",
            "block_name",
            "target_min_pct",
            "target_max_pct",
            "critical_min_pct",
            "updated_at",
        ]
        read_only_fields = ["id", "block_name", "updated_at"]


class IrrigationRecommendationSerializer(serializers.ModelSerializer):
    block_name = serializers.ReadOnlyField(source="block.name")
    vineyard_name = serializers.ReadOnlyField(source="block.vineyard.name")

    class Meta:
        model = IrrigationRecommendation
        fields = [
            "id",
            "block",
            "block_name",
            "vineyard_name",
            "generated_at",
            "horizon_days",
            "action",
            "recommended_total_gallons",
            "recommended_gallons_per_acre",
            "next_irrigation_date",
            "target_moisture_pct",
            "confidence_score",
            "drivers",
            "explanation",
        ]
        read_only_fields = fields
