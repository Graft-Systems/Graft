from django.db import models
from .wine import Producer


class RetailContact(models.Model):
    producer = models.ForeignKey(Producer, on_delete=models.CASCADE, related_name="retail_contacts")
    store_name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    last_contact_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.contact_name} @ {self.store_name}"


class LocationRequest(models.Model):
    STAGE_CHOICES = [
        ("requested", "Requested"),
        ("outreach", "Outreach"),
        ("tasting_scheduled", "Tasting Scheduled"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    producer = models.ForeignKey(Producer, on_delete=models.CASCADE, related_name="location_requests")
    store_name = models.CharField(max_length=255)
    neighborhood = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=255, blank=True)
    state = models.CharField(max_length=50, blank=True)
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default="requested")
    fit_score = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.store_name} ({self.stage})"
