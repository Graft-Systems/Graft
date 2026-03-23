from rest_framework import serializers
from django.conf import settings
from .models.vigil import (
    Vineyard,
    VineyardBlock,
    ScanSession,
    GrapeCluster,
    PestDiseaseDetection,
    WeatherData,
    IrrigationLog,
    GrapeSpeciesProfile,
    YieldEstimate,
    VigilMLModelVersion,
    VigilTrainingSample,
    VigilInferenceResult,
)


class VineyardSerializer(serializers.ModelSerializer):
    """Serializer for vineyard properties owned by a producer."""
    block_count = serializers.SerializerMethodField()

    class Meta:
        model = Vineyard
        fields = [
            'id',
            'producer',
            'name',
            'location',
            'latitude',
            'longitude',
            'total_acres',
            'elevation_ft',
            'soil_type',
            'climate_zone',
            'created_at',
            'block_count',
        ]
        read_only_fields = ['id', 'producer', 'created_at']

    def get_block_count(self, obj):
        return obj.blocks.count()


class VineyardBlockSerializer(serializers.ModelSerializer):
    """Serializer for a specific block/section within a vineyard."""
    latest_scan_date = serializers.SerializerMethodField()
    scan_count = serializers.SerializerMethodField()

    class Meta:
        model = VineyardBlock
        fields = [
            'id',
            'vineyard',
            'name',
            'grape_species',
            'acres',
            'row_count',
            'vine_count',
            'vine_spacing_ft',
            'row_spacing_ft',
            'trellis_system',
            'rootstock',
            'year_planted',
            'created_at',
            'latest_scan_date',
            'scan_count',
        ]
        read_only_fields = ['id', 'created_at', 'latest_scan_date', 'scan_count']

    def get_latest_scan_date(self, obj):
        latest = obj.scan_sessions.order_by('-scan_date').first()
        if latest:
            return latest.scan_date
        return None

    def get_scan_count(self, obj):
        return obj.scan_sessions.count()


class ScanSessionSerializer(serializers.ModelSerializer):
    """Serializer for a single scan run over a vineyard block."""
    block_name = serializers.ReadOnlyField(source='block.name')
    grape_species = serializers.ReadOnlyField(source='block.grape_species')

    class Meta:
        model = ScanSession
        fields = [
            'id',
            'block',
            'block_name',
            'grape_species',
            'scan_date',
            'status',
            'platform',
            'rows_scanned',
            'total_images',
            'total_clusters_detected',
            'visible_clusters',
            'occluded_clusters',
            'avg_occlusion_pct',
            'estimated_yield_tons_per_acre',
            'notes',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'block_name', 'grape_species']


class GrapeClusterSerializer(serializers.ModelSerializer):
    """Serializer for an individual grape cluster detected during a scan."""

    class Meta:
        model = GrapeCluster
        fields = [
            'id',
            'scan_session',
            'cluster_index',
            'visibility',
            'occlusion_percentage',
            'hanging_height_cm',
            'estimated_volume_cm3',
            'estimated_weight_g',
            'confidence_score',
            'row_number',
            'vine_number',
            'bbox_x',
            'bbox_y',
            'bbox_width',
            'bbox_height',
            'image_url',
        ]
        read_only_fields = ['id']


class PestDiseaseDetectionSerializer(serializers.ModelSerializer):
    """Serializer for pest or vine disease detections."""

    class Meta:
        model = PestDiseaseDetection
        fields = [
            'id',
            'scan_session',
            'detection_type',
            'display_name',
            'severity',
            'affected_area_pct',
            'confidence_score',
            'recommended_action',
            'image_url',
            'row_number',
            'detected_at',
        ]
        read_only_fields = ['id', 'detected_at']


class WeatherDataSerializer(serializers.ModelSerializer):
    """Serializer for weather observations and forecasts."""

    class Meta:
        model = WeatherData
        fields = [
            'id',
            'vineyard',
            'source',
            'date',
            'temp_high_f',
            'temp_low_f',
            'precipitation_in',
            'humidity_pct',
            'wind_speed_mph',
            'gdd_base50',
            'uv_index',
            'fetched_at',
        ]
        read_only_fields = ['id', 'fetched_at']


class IrrigationLogSerializer(serializers.ModelSerializer):
    """Serializer for irrigation events on a vineyard block."""
    block_name = serializers.ReadOnlyField(source='block.name')

    class Meta:
        model = IrrigationLog
        fields = [
            'id',
            'block',
            'block_name',
            'date',
            'method',
            'duration_hours',
            'gallons_applied',
            'soil_moisture_pct_before',
            'soil_moisture_pct_after',
            'notes',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'block_name']


class GrapeSpeciesProfileSerializer(serializers.ModelSerializer):
    """Serializer for grape species historical data profiles."""

    class Meta:
        model = GrapeSpeciesProfile
        fields = [
            'id',
            'species_name',
            'avg_cluster_weight_g',
            'avg_clusters_per_vine',
            'avg_berries_per_cluster',
            'avg_berry_weight_g',
            'typical_yield_tons_per_acre',
            'rain_swell_factor',
            'heat_stress_threshold_f',
            'optimal_gdd_range_low',
            'optimal_gdd_range_high',
            'disease_susceptibility',
            'notes',
        ]
        read_only_fields = ['id']


class YieldEstimateSerializer(serializers.ModelSerializer):
    """Serializer for final yield estimates combining scan, weather, and species data."""
    block_name = serializers.ReadOnlyField(source='block.name')
    grape_species = serializers.ReadOnlyField(source='block.grape_species')
    vineyard_name = serializers.ReadOnlyField(source='block.vineyard.name')

    class Meta:
        model = YieldEstimate
        fields = [
            'id',
            'block',
            'block_name',
            'grape_species',
            'vineyard_name',
            'scan_session',
            'estimate_date',
            'scenario',
            'estimated_tons_per_acre',
            'total_estimated_tons',
            'visible_cluster_contribution',
            'occluded_cluster_contribution',
            'weather_adjustment_factor',
            'disease_penalty_factor',
            'species_historical_factor',
            'irrigation_adjustment_factor',
            'confidence_score',
            'notes',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'block_name',
            'grape_species',
            'vineyard_name',
        ]


class VigilTrainingSampleSerializer(serializers.ModelSerializer):
    block_name = serializers.ReadOnlyField(source='block.name')
    scan_label = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = VigilTrainingSample
        fields = [
            'id',
            'producer',
            'block',
            'block_name',
            'scan_session',
            'scan_label',
            'sample_name',
            'image',
            'image_url',
            'grape_species',
            'captured_at',
            'target_volume_cm3',
            'target_weight_g',
            'occlusion_percentage',
            'hanging_height_cm',
            'bbox_width_px',
            'bbox_height_px',
            'berry_count',
            'row_number',
            'vine_number',
            'weather_temp_f',
            'recent_rain_in',
            'soil_moisture_pct',
            'metadata',
            'notes',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'producer',
            'block_name',
            'scan_label',
            'image_url',
            'created_at',
        ]

    def get_scan_label(self, obj):
        if not obj.scan_session:
            return None
        return f"Scan {obj.scan_session.id} - {obj.scan_session.scan_date:%Y-%m-%d %H:%M}"

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url


class VigilMLModelVersionSerializer(serializers.ModelSerializer):
    producer_name = serializers.ReadOnlyField(source='producer.name')

    class Meta:
        model = VigilMLModelVersion
        fields = [
            'id',
            'producer',
            'producer_name',
            'name',
            'version',
            'status',
            'algorithm',
            'target',
            'feature_schema',
            'metrics',
            'training_sample_count',
            'validation_sample_count',
            'is_active',
            'notes',
            'created_at',
            'trained_at',
        ]
        read_only_fields = [
            'id',
            'producer',
            'producer_name',
            'version',
            'status',
            'algorithm',
            'target',
            'feature_schema',
            'metrics',
            'training_sample_count',
            'validation_sample_count',
            'created_at',
            'trained_at',
        ]


class VigilInferenceResultSerializer(serializers.ModelSerializer):
    block_name = serializers.ReadOnlyField(source='block.name')
    model_name = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    annotated_image_url = serializers.SerializerMethodField()

    class Meta:
        model = VigilInferenceResult
        fields = [
            'id',
            'producer',
            'model_version',
            'model_name',
            'block',
            'block_name',
            'scan_session',
            'sample_name',
            'image',
            'image_url',
            'annotated_image_url',
            'grape_species',
            'predicted_volume_cm3',
            'predicted_weight_g',
            'confidence_score',
            'features',
            'input_payload',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'producer',
            'model_name',
            'block_name',
            'image_url',
            'annotated_image_url',
            'predicted_volume_cm3',
            'predicted_weight_g',
            'confidence_score',
            'features',
            'input_payload',
            'created_at',
        ]

    def get_model_name(self, obj):
        if not obj.model_version:
            return None
        return f"{obj.model_version.name} v{obj.model_version.version}"

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url

    def get_annotated_image_url(self, obj):
        annotated_path = (obj.features or {}).get('annotated_image_path')
        if not annotated_path:
            return None
        media_url = getattr(settings, 'MEDIA_URL', '/media/')
        if not media_url.endswith('/'):
            media_url = f"{media_url}/"
        relative = str(annotated_path).lstrip('/')
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f"{media_url}{relative}")
        return f"{media_url}{relative}"
