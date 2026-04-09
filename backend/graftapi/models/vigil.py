from django.db import models

from .agriculture import IrrigationLog, Vineyard, VineyardBlock, WeatherData

class ScanSession(models.Model):
    """A single scan run over a vineyard block -- captures metadata about the scan."""
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]
    PLATFORM_CHOICES = [
        ("rover", "Autonomous Rover"),
        ("tractor", "Tractor-Mounted"),
        ("drone", "Drone"),
        ("handheld", "Handheld"),
    ]

    block = models.ForeignKey(VineyardBlock, on_delete=models.CASCADE, related_name="scan_sessions")
    scan_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, default="handheld")
    rows_scanned = models.IntegerField(default=0)
    total_images = models.IntegerField(default=0)
    # CV model outputs
    total_clusters_detected = models.IntegerField(default=0)
    visible_clusters = models.IntegerField(default=0)
    occluded_clusters = models.IntegerField(default=0)
    avg_occlusion_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    # Summary metrics computed after scan processing
    estimated_yield_tons_per_acre = models.DecimalField(
        max_digits=8, decimal_places=3, null=True, blank=True
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-scan_date"]

    def __str__(self):
        return f"Scan {self.id} - {self.block.name} ({self.scan_date:%Y-%m-%d})"


class GrapeCluster(models.Model):
    """Individual grape cluster detected during a scan session."""
    VISIBILITY_CHOICES = [
        ("full", "Fully Visible"),
        ("partial", "Partially Occluded"),
        ("estimated", "Fully Occluded / Estimated"),
    ]

    scan_session = models.ForeignKey(
        ScanSession, on_delete=models.CASCADE, related_name="clusters"
    )
    cluster_index = models.IntegerField(help_text="Sequence number within the scan")
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default="full")
    occlusion_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text="Percentage of cluster hidden by foliage (0-100)"
    )
    # Spatial measurements from depth camera
    hanging_height_cm = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True,
        help_text="Height from ground in centimeters"
    )
    estimated_volume_cm3 = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True,
        help_text="Estimated cluster volume in cubic centimeters"
    )
    estimated_weight_g = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True,
        help_text="Estimated cluster weight in grams"
    )
    # Context-based sizing: how this cluster compares to neighbors
    confidence_score = models.DecimalField(
        max_digits=4, decimal_places=2, default=0,
        help_text="Model confidence (0-1) for this detection"
    )
    row_number = models.IntegerField(null=True, blank=True)
    vine_number = models.IntegerField(null=True, blank=True)
    # Bounding box in the captured image (for UI highlighting)
    bbox_x = models.IntegerField(null=True, blank=True)
    bbox_y = models.IntegerField(null=True, blank=True)
    bbox_width = models.IntegerField(null=True, blank=True)
    bbox_height = models.IntegerField(null=True, blank=True)
    image_url = models.URLField(max_length=1000, blank=True)

    class Meta:
        ordering = ["scan_session", "cluster_index"]

    def __str__(self):
        return f"Cluster {self.cluster_index} ({self.visibility}) - {self.scan_session}"


class PestDiseaseDetection(models.Model):
    """Pest or vine disease detected during scanning."""
    SEVERITY_CHOICES = [
        ("low", "Low"),
        ("moderate", "Moderate"),
        ("high", "High"),
        ("severe", "Severe"),
    ]

    scan_session = models.ForeignKey(
        ScanSession, on_delete=models.CASCADE, related_name="pest_detections"
    )
    detection_type = models.CharField(
        max_length=50,
        help_text="e.g., powdery_mildew, black_rot, botrytis, phylloxera, leafhoppers"
    )
    display_name = models.CharField(max_length=255, blank=True)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="low")
    affected_area_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text="Percentage of scanned area affected"
    )
    confidence_score = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    recommended_action = models.TextField(blank=True)
    image_url = models.URLField(max_length=1000, blank=True)
    row_number = models.IntegerField(null=True, blank=True)
    detected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-severity", "-detected_at"]

    def __str__(self):
        return f"{self.display_name or self.detection_type} ({self.severity}) - {self.scan_session}"


class GrapeSpeciesProfile(models.Model):
    """Historical data profile for a grape species -- used for predictive modeling."""
    species_name = models.CharField(max_length=255, unique=True, help_text="e.g., Cabernet Sauvignon")
    avg_cluster_weight_g = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    avg_clusters_per_vine = models.IntegerField(null=True, blank=True)
    avg_berries_per_cluster = models.IntegerField(null=True, blank=True)
    avg_berry_weight_g = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    typical_yield_tons_per_acre = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    rain_swell_factor = models.DecimalField(
        max_digits=4, decimal_places=3, default=1.000,
        help_text="Weight multiplier per inch of rain in the last 10 days"
    )
    heat_stress_threshold_f = models.IntegerField(
        null=True, blank=True,
        help_text="Temperature above which berry shrinkage risk increases"
    )
    optimal_gdd_range_low = models.IntegerField(null=True, blank=True)
    optimal_gdd_range_high = models.IntegerField(null=True, blank=True)
    disease_susceptibility = models.JSONField(
        default=dict, blank=True,
        help_text='e.g., {"powdery_mildew": "high", "botrytis": "moderate"}'
    )
    notes = models.TextField(blank=True)

    def __str__(self):
        return self.species_name


class YieldEstimate(models.Model):
    """Final yield estimate for a block, combining scan data + weather + species data."""
    SCENARIO_CHOICES = [
        ("bear", "Bear (Conservative)"),
        ("base", "Base (Expected)"),
        ("bull", "Bull (Optimistic)"),
    ]

    block = models.ForeignKey(VineyardBlock, on_delete=models.CASCADE, related_name="yield_estimates")
    scan_session = models.ForeignKey(
        ScanSession, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="yield_estimates"
    )
    estimate_date = models.DateField()
    scenario = models.CharField(max_length=10, choices=SCENARIO_CHOICES)

    # Core estimate
    estimated_tons_per_acre = models.DecimalField(max_digits=8, decimal_places=3)
    total_estimated_tons = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)

    # Contributing factors (stored for transparency/explainability)
    visible_cluster_contribution = models.DecimalField(
        max_digits=8, decimal_places=3, null=True, blank=True,
        help_text="Tons/acre from fully visible clusters"
    )
    occluded_cluster_contribution = models.DecimalField(
        max_digits=8, decimal_places=3, null=True, blank=True,
        help_text="Tons/acre estimated from hidden clusters"
    )
    weather_adjustment_factor = models.DecimalField(
        max_digits=5, decimal_places=3, default=1.000,
        help_text="Multiplier from 10-day weather forecast"
    )
    disease_penalty_factor = models.DecimalField(
        max_digits=5, decimal_places=3, default=1.000,
        help_text="Reduction factor from pest/disease detections"
    )
    species_historical_factor = models.DecimalField(
        max_digits=5, decimal_places=3, default=1.000,
        help_text="Adjustment based on species historical averages"
    )
    irrigation_adjustment_factor = models.DecimalField(
        max_digits=5, decimal_places=3, default=1.000,
        help_text="Adjustment based on irrigation data"
    )

    confidence_score = models.DecimalField(
        max_digits=4, decimal_places=2, default=0,
        help_text="Overall confidence in the estimate (0-1)"
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-estimate_date", "scenario"]

    def __str__(self):
        return f"{self.block.name} - {self.scenario} ({self.estimate_date}): {self.estimated_tons_per_acre} t/ac"


class VigilMLModelVersion(models.Model):
    """A producer-scoped trained model artifact for cluster volume prediction."""

    STATUS_CHOICES = [
        ("training", "Training"),
        ("ready", "Ready"),
        ("failed", "Failed"),
        ("archived", "Archived"),
    ]

    producer = models.ForeignKey(
        "graftapi.Producer", on_delete=models.CASCADE, related_name="vigil_ml_models"
    )
    name = models.CharField(max_length=255, default="Cluster Volume Model")
    version = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="training")
    algorithm = models.CharField(max_length=100, default="ridge-regression-v1")
    target = models.CharField(max_length=100, default="cluster_volume_cm3")
    artifact_path = models.CharField(max_length=500, blank=True)
    feature_schema = models.JSONField(default=dict, blank=True)
    metrics = models.JSONField(default=dict, blank=True)
    training_sample_count = models.PositiveIntegerField(default=0)
    validation_sample_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    trained_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ["producer", "name", "version"]

    def __str__(self):
        return f"{self.producer.name} - {self.name} v{self.version}"


class VigilTrainingSample(models.Model):
    """Labeled cluster images and metadata used to train the VIGIL model."""

    producer = models.ForeignKey(
        "graftapi.Producer", on_delete=models.CASCADE, related_name="vigil_training_samples"
    )
    block = models.ForeignKey(
        VineyardBlock,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="training_samples",
    )
    scan_session = models.ForeignKey(
        ScanSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="training_samples",
    )
    sample_name = models.CharField(max_length=255, blank=True)
    image = models.FileField(upload_to="vigil/training/%Y/%m/%d/")
    grape_species = models.CharField(max_length=255, blank=True)
    captured_at = models.DateTimeField(null=True, blank=True)
    target_volume_cm3 = models.DecimalField(max_digits=10, decimal_places=2)
    target_weight_g = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    occlusion_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    hanging_height_cm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    bbox_width_px = models.IntegerField(null=True, blank=True)
    bbox_height_px = models.IntegerField(null=True, blank=True)
    berry_count = models.IntegerField(null=True, blank=True)
    row_number = models.IntegerField(null=True, blank=True)
    vine_number = models.IntegerField(null=True, blank=True)
    weather_temp_f = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    recent_rain_in = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    soil_moisture_pct = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        label = self.sample_name or f"Training Sample {self.pk}"
        return f"{label} - {self.producer.name}"


class VigilInferenceResult(models.Model):
    """Saved prediction runs for real-world cluster images."""

    producer = models.ForeignKey(
        "graftapi.Producer", on_delete=models.CASCADE, related_name="vigil_inference_results"
    )
    model_version = models.ForeignKey(
        VigilMLModelVersion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="predictions",
    )
    block = models.ForeignKey(
        VineyardBlock,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inference_results",
    )
    scan_session = models.ForeignKey(
        ScanSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inference_results",
    )
    sample_name = models.CharField(max_length=255, blank=True)
    image = models.FileField(upload_to="vigil/inference/%Y/%m/%d/")
    grape_species = models.CharField(max_length=255, blank=True)
    predicted_volume_cm3 = models.DecimalField(max_digits=10, decimal_places=2)
    predicted_weight_g = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    confidence_score = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    features = models.JSONField(default=dict, blank=True)
    input_payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        label = self.sample_name or f"Prediction {self.pk}"
        return f"{label} - {self.producer.name}"
