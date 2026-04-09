from django.db import models


class Vineyard(models.Model):
    """A vineyard property owned/managed by a producer."""

    producer = models.ForeignKey(
        "graftapi.Producer", on_delete=models.CASCADE, related_name="vineyards"
    )
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=500, blank=True, help_text="Address or GPS coordinates")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    total_acres = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    elevation_ft = models.IntegerField(null=True, blank=True)
    soil_type = models.CharField(max_length=255, blank=True)
    climate_zone = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.producer.name})"


class VineyardBlock(models.Model):
    """A specific block/section within a vineyard, typically one grape variety."""

    vineyard = models.ForeignKey(Vineyard, on_delete=models.CASCADE, related_name="blocks")
    name = models.CharField(max_length=255, help_text="Block identifier (e.g., Block A, Hillside East)")
    grape_species = models.CharField(max_length=255, help_text="Grape variety planted")
    acres = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    row_count = models.IntegerField(null=True, blank=True)
    vine_count = models.IntegerField(null=True, blank=True)
    vine_spacing_ft = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    row_spacing_ft = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    trellis_system = models.CharField(
        max_length=100,
        blank=True,
        help_text="e.g., VSP, Geneva Double Curtain, Pergola",
    )
    rootstock = models.CharField(max_length=255, blank=True)
    year_planted = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.grape_species} ({self.vineyard.name})"


class WeatherData(models.Model):
    """Weather observations and forecasts for a vineyard location."""

    SOURCE_CHOICES = [
        ("observation", "Observed"),
        ("forecast", "Forecast"),
    ]

    vineyard = models.ForeignKey(Vineyard, on_delete=models.CASCADE, related_name="weather_data")
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default="observation")
    date = models.DateField()
    temp_high_f = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    temp_low_f = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    precipitation_in = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    humidity_pct = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    wind_speed_mph = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    gdd_base50 = models.DecimalField(
        max_digits=6,
        decimal_places=1,
        null=True,
        blank=True,
        help_text="Growing Degree Days (base 50F)",
    )
    uv_index = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    fetched_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date"]
        unique_together = ["vineyard", "source", "date"]

    def __str__(self):
        return f"{self.vineyard.name} - {self.date} ({self.source})"


class IrrigationLog(models.Model):
    """Irrigation events for a vineyard block."""

    METHOD_CHOICES = [
        ("drip", "Drip"),
        ("sprinkler", "Sprinkler"),
        ("flood", "Flood"),
        ("none", "Dry Farmed"),
    ]

    block = models.ForeignKey(VineyardBlock, on_delete=models.CASCADE, related_name="irrigation_logs")
    date = models.DateField()
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, default="drip")
    duration_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    gallons_applied = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    soil_moisture_pct_before = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    soil_moisture_pct_after = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.block.name} irrigation - {self.date}"
