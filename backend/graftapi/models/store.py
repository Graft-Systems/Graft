from django.db import models

class StoreChain(models.Model):
    name = models.CharField(max_length=255)
    headquarters_city = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.name


class Store(models.Model):
    chain = models.ForeignKey(StoreChain, null=True, blank=True, on_delete=models.SET_NULL)
    name = models.CharField(max_length=255)
    neighborhood = models.CharField(max_length=255, blank=True)
    street_address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=255)
    state = models.CharField(max_length=50)
    zip_code = models.CharField(max_length=20)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    def __str__(self):
        return self.name
