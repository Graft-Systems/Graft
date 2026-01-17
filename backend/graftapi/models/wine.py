from django.db import models
from django.conf import settings

class Producer(models.Model):
    # Link the producer to a specific Django user
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="producer_profile",
        null=True, blank=True
    )
    name = models.CharField(max_length=255)
    region = models.CharField(max_length=255, blank=True)
    contact_email = models.EmailField(blank=True)

    def __str__(self):
        return self.name

# Wine model stays the same, but ensure it's imported
class Wine(models.Model):
    producer = models.ForeignKey(Producer, on_delete=models.CASCADE, related_name="wines")
    name = models.CharField(max_length=255)
    varietal = models.CharField(max_length=255, blank=True)
    region = models.CharField(max_length=255, blank=True)
    vintage = models.IntegerField(null=True, blank=True)
    bottle_size_ml = models.IntegerField(default=750)

    def __str__(self):
        return f"{self.name} ({self.vintage or 'NV'})"
