from django.db import models
from django.conf import settings

class StoreChain(models.Model):
    name = models.CharField(max_length=255)
    headquarters_city = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.name


class Store(models.Model):
    # Link the store to a specific Django user
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="retailer_profile",
        null=True, blank=True
    )
    chain = models.ForeignKey(StoreChain, null=True, blank=True, on_delete=models.SET_NULL)
    name = models.CharField(max_length=255)
    neighborhood = models.CharField(max_length=255, blank=True)
    street_address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=255, blank=True)
    state = models.CharField(max_length=50, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    contact_email = models.EmailField(blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    def __str__(self):
        return self.name
